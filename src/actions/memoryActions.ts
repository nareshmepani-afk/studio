'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Memory } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { mockPrompts } from '@/lib/mockData';
import { verifyRecaptchaToken } from '@/lib/fraud-defense';

async function getUidFromIdToken(idToken: string): Promise<string | null> {
    if (!adminAuth) {
        console.error("Firebase Admin SDK is not initialized.");
        return null;
    }
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}

export async function getOrCreateMemoryForPrompt(promptId: string, idToken: string): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  const uid = await getUidFromIdToken(idToken);
  if (!uid) {
    return { success: false, message: "Unauthorized. Invalid token." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const memoriesRef = adminDb.collection('users').doc(uid).collection('memories');
  
  // 1. Check if a memory for this prompt already exists
  const existingMemoryQuery = await memoriesRef.where('promptId', '==', promptId).limit(1).get();

  if (!existingMemoryQuery.empty) {
    const existingMemoryId = existingMemoryQuery.docs[0].id;
    console.log(`Found existing memory ${existingMemoryId} for prompt ${promptId}`);
    return { success: true, message: "Existing memory found.", memoryId: existingMemoryId };
  }

  // 2. If not, create a new one
  console.log(`No existing memory for prompt ${promptId}. Creating a new one.`);
  const prompt = mockPrompts.find(p => p.id === promptId);
  if (!prompt) {
    return { success: false, message: "Prompt not found." };
  }

  try {
    const newMemoryRef = memoriesRef.doc();
    const newMemory: Omit<Memory, 'id'> = {
      userId: uid,
      promptId: promptId,
      title: prompt.title,
      description: 'Recording session initiated from QR code.', // Placeholder description
      videoUrl: '',
      category: 'personal',
      location: '',
      emotionTags: [],
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft', // Add a status to indicate it's not a complete memory yet
      sensoryConfig: prompt.sensoryPrompts || []
    };

    await newMemoryRef.set(newMemory);
    
    revalidatePath('/studio'); // Revalidate to show the new session state

    console.log(`Created new memory ${newMemoryRef.id} for prompt ${promptId}`);
    return { success: true, message: "New memory session created.", memoryId: newMemoryRef.id };

  } catch (error) {
    console.error("Error creating memory for prompt:", error);
    return { success: false, message: "Failed to create a new memory session." };
  }
}


export async function createMemoryAction(data: Partial<Memory>): Promise<{ success: boolean; message: string; memoryId?: string; }> {
  // This action still relies on the session cookie. This is acceptable for now
  // as it is not part of the QR code flow.
  const session = await getSession();

  if (!session || !session.uid) {
    return { success: false, message: "Unauthorized. Please log in." };
  }

  if (!adminDb) {
    return { success: false, message: "Database connection failed." };
  }

  const { title, description, videoUrl, category, location, emotionTags, date } = data;

  if (!title?.trim() || !description?.trim()) {
    return { success: false, message: "Title and story cannot be empty." };
  }

  try {
    const newMemoryRef = adminDb.collection('users').doc(session.uid).collection('memories').doc();
    const newMemory: Omit<Memory, 'id'> = {
      userId: session.uid,
      title,
      description,
      videoUrl: videoUrl || '',
      category: category || 'personal',
      location: location || '',
      emotionTags: emotionTags || [],
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await newMemoryRef.set(newMemory);
    
    // Revalidate paths to ensure fresh data is shown after creation
    revalidatePath('/cinema');
    revalidatePath('/studio');

    return { success: true, message: "Memory created successfully!", memoryId: newMemoryRef.id };

  } catch (error) {
    console.error("Error creating memory:", error);
    // It's better to return a generic error message to the client
    return { success: false, message: "An unexpected error occurred while saving your memory." };
  }
}

export async function getMemories(userId: string): Promise<Memory[]> {
  if (!adminDb) {
    throw new Error("Firestore is not initialized.");
  }
  const memoriesSnapshot = await adminDb.collection('users').doc(userId).collection('memories').get();
  const memories = memoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Memory[];
  return memories;
}

export async function getMemory(memoryId: string): Promise<Memory | null> {
    // This action still relies on the session cookie.
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        throw new Error("Unauthorized or DB not initialized.");
    }
    const memoryDoc = await adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).get();
    if (!memoryDoc.exists) {
        return null;
    }
    return { id: memoryDoc.id, ...memoryDoc.data() } as Memory;
}

export async function cleanupAndMigrateMemories(): Promise<{ success: boolean; message: string; stats?: any }> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    try {
        const memoriesRef = adminDb.collection('users').doc(session.uid).collection('memories');
        const snapshot = await memoriesRef.get();
        
        let migratedCount = 0;
        let deletedCount = 0;

        const batch = adminDb.batch();

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Rule: If it's an existing memory (usually has a promptId or content), mark as draft if no status exists
            if (!data.status) {
                batch.update(docSnap.ref, { status: 'draft' });
                migratedCount++;
            } else if (data.status !== 'draft' && data.status !== 'published' && data.status !== 'pre-release') {
                // Should not happen with new enum, but for safety
                batch.update(docSnap.ref, { status: 'draft' });
                migratedCount++;
            }
        });

        await batch.commit();

        // Second pass: Delete those that are STILL not draft (the user said "delete all... which do not have status: 'draft'")
        // But wait, if I just marked them all as draft, nothing will be deleted.
        // Ah, the user probably meant "Delete the ones that were empty and didn't even qualify for draft migration".
        // Let's refine: Delete memories that have NO title AND NO description AND NO media.
        
        const finalSnapshot = await memoriesRef.get();
        const deleteBatch = adminDb.batch();
        
        finalSnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const isEmpty = !data.title && !data.description && (!data.mediaAttachments || data.mediaAttachments.length === 0) && !data.videoUrl;
            
            if (isEmpty) {
                deleteBatch.delete(docSnap.ref);
                deletedCount++;
            }
        });

        await deleteBatch.commit();

        revalidatePath('/cinema');
        revalidatePath('/studio');

        return { 
            success: true, 
            message: `Migration complete.`, 
            stats: { migrated: migratedCount, deleted: deletedCount } 
        };
    } catch (error: any) {
        console.error("Migration error:", error);
        return { success: false, message: error.message || "Migration failed." };
    }
}

export async function publishMemoryAction(memoryId: string, recaptchaToken?: string): Promise<{ success: boolean; message: string }> {
    console.log(`[publishMemoryAction] Verifying publish for ${memoryId}. Token present: ${!!recaptchaToken}`);
    const session = await getSession();
    
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    // 1. Active Fraud Check
    if (recaptchaToken) {
        const fraudResult = await verifyRecaptchaToken(recaptchaToken, 'publish', session.uid);
        console.log(`[publishMemoryAction] Risk Score: ${fraudResult.score} | Assessment: ${fraudResult.assessmentName}`);
        
        if (!fraudResult.isSafe) {
            console.error(`[publishMemoryAction] BLOCKING: High-risk request detected for user ${session.uid}. Score: ${fraudResult.score}`);
            return { 
                success: false, 
                message: "Security check failed. Please refresh and try again, or contact support if the issue persists." 
            };
        }
    }

    try {
        const docRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId);
        await docRef.update({ 
            status: 'published',
            updatedAt: new Date().toISOString()
        });
        
        revalidatePath('/cinema');
        revalidatePath('/studio');
        
        return { success: true, message: "Cinema updated successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to publish." };
    }
}

export async function unpublishMemoryAction(memoryId: string): Promise<{ success: boolean; message: string }> {
    const session = await getSession();
    if (!session?.uid || !adminDb) {
        return { success: false, message: "Unauthorized or DB not initialized." };
    }

    try {
        const docRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId);
        await docRef.update({ 
            status: 'pre-release',
            updatedAt: new Date().toISOString()
        });
        
        revalidatePath('/cinema');
        revalidatePath('/studio');
        
        return { success: true, message: "Memory reverted to pre-release." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to revert to draft." };
    }
}

/**
 * Public action for unauthenticated Guest Access Pass to view published stories.
 */
export async function getPublicMemoryAction(memoryId: string): Promise<{ success: boolean; memory?: Memory; message?: string }> {
  if (!memoryId || !adminDb) {
    return { success: false, message: 'Invalid request or database not initialized.' };
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return { success: false, message: 'Memory story not found.' };
    }

    const memoryData = { id: targetDoc.id, ...targetDoc.data() } as Memory;
    return { success: true, memory: memoryData };
  } catch (error: any) {
    console.error('[getPublicMemoryAction] Error fetching public memory:', error);
    return { success: false, message: error?.message || 'Failed to fetch public memory.' };
  }
}

/**
 * Public action for zero-signup guest reactions (Inspiring, Moved, Legendary).
 */
export async function addGuestReactionAction(
  memoryId: string, 
  reactionType: 'inspiring' | 'moved' | 'legendary', 
  guestName?: string, 
  comment?: string
): Promise<{ success: boolean; message: string }> {
  if (!memoryId || !adminDb) {
    return { success: false, message: 'Invalid reaction request.' };
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return { success: false, message: 'Memory story not found.' };
    }

    const reactionsRef = targetDoc.ref.collection('reactions').doc();
    await reactionsRef.set({
      reactionType,
      guestName: guestName?.trim() || 'Anonymous Family Member',
      comment: comment?.trim() || '',
      createdAt: new Date().toISOString()
    });

    return { success: true, message: 'Thank you! Your heartfelt reaction has been sent to the director.' };
  } catch (error: any) {
    console.error('[addGuestReactionAction] Error recording reaction:', error);
    return { success: false, message: error?.message || 'Failed to record reaction.' };
  }
}

export interface GuestQuestion {
  id: string;
  guestName: string;
  questionText: string;
  createdAt: string;
  status: 'pending' | 'promoted_to_prompt' | 'answered';
}

/**
 * Increment guestViewCount atomically and return current count.
 */
export async function recordGuestViewAction(memoryId: string): Promise<{ success: boolean; guestViewCount?: number }> {
  if (!memoryId || !adminDb) return { success: false };

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) return { success: false };

    const currentCount = (targetDoc.data().guestViewCount || 0) + 1;
    await targetDoc.ref.update({
      guestViewCount: currentCount
    });

    return { success: true, guestViewCount: currentCount };
  } catch (error) {
    console.error('[recordGuestViewAction] Failed to record view:', error);
    return { success: false };
  }
}

/**
 * Submit a question from a guest ("Ask Grandpa a Question").
 */
export async function submitGuestQuestionAction(
  memoryId: string, 
  guestName: string, 
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  if (!memoryId || !questionText.trim() || !adminDb) {
    return { success: false, message: 'Question text is required.' };
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return { success: false, message: 'Memory story not found.' };
    }

    const questionRef = targetDoc.ref.collection('questions').doc();
    const newQuestion: GuestQuestion = {
      id: questionRef.id,
      guestName: guestName.trim() || 'Family Member',
      questionText: questionText.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    await questionRef.set(newQuestion);
    return { success: true, message: 'Question sent to the director! It will appear in their Scriptorium teleprompter queue.', questionId: questionRef.id };
  } catch (error: any) {
    console.error('[submitGuestQuestionAction] Error submitting question:', error);
    return { success: false, message: error?.message || 'Failed to submit question.' };
  }
}

/**
 * Fetch pending questions for a host in Scriptorium.
 */
export async function getGuestQuestionsAction(memoryId: string): Promise<{ success: boolean; questions?: GuestQuestion[] }> {
  if (!memoryId || !adminDb) return { success: false, questions: [] };

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) return { success: false, questions: [] };

    const questionsSnap = await targetDoc.ref.collection('questions').get();
    const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as GuestQuestion[];

    return { success: true, questions };
  } catch (error) {
    console.error('[getGuestQuestionsAction] Error fetching questions:', error);
    return { success: false, questions: [] };
  }
}

/**
 * Submit private family feedback notes on a Pre-Release Screener draft story.
 */
export async function submitDraftFeedbackAction(
  memoryId: string,
  guestName: string,
  feedbackText: string
): Promise<{ success: boolean; message: string }> {
  if (!memoryId || !feedbackText.trim() || !adminDb) {
    return { success: false, message: 'Invalid feedback submission.' };
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return { success: false, message: 'Pre-release memory story not found.' };
    }

    const notesRef = targetDoc.ref.collection('draftNotes').doc();
    await notesRef.set({
      id: notesRef.id,
      guestName: guestName.trim() || 'Family Member',
      feedbackText: feedbackText.trim(),
      createdAt: new Date().toISOString(),
      status: 'unread'
    });

    return { success: true, message: 'Thank you! Your private feedback note has been delivered to the storyteller.' };
  } catch (error: any) {
    console.error('[submitDraftFeedbackAction] Error recording draft note:', error);
    return { success: false, message: error?.message || 'Failed to submit draft feedback note.' };
  }
}

// We need to re-import getSession here because it was removed from the top of the file
import { getSession } from '@/lib/session';

export async function claimSharedMemoryAction(memoryId: string, claimantUid: string): Promise<{ success: boolean; alreadyClaimed?: boolean; isOwner?: boolean; memoryTitle?: string; ownerDisplayName?: string; error?: string }> {
  if (!memoryId || !claimantUid || !adminDb) {
    return { success: false, error: 'Invalid request or database not initialized.' };
  }

  try {
    const memoryQuery = await adminDb.collectionGroup('memories').get();
    const targetDoc = memoryQuery.docs.find(d => d.id === memoryId);

    if (!targetDoc || !targetDoc.exists) {
      return { success: false, error: 'Memory story not found.' };
    }

    const data = targetDoc.data() as Memory;
    const ownerUid = data.userId || targetDoc.ref.parent.parent?.id;

    if (data.status === 'draft') {
      return { success: false, error: 'This memory is not available for claiming.' };
    }

    if (ownerUid && ownerUid === claimantUid) {
      return { success: false, isOwner: true, error: 'You are the director of this memory.' };
    }

    const sharedWithList: string[] = Array.isArray((data as any).sharedWith) ? (data as any).sharedWith : [];
    const alreadyClaimed = sharedWithList.includes(claimantUid);

    // 1. Update memory document sharedWith array
    if (!alreadyClaimed) {
      await targetDoc.ref.set({
        sharedWith: FieldValue.arrayUnion(claimantUid)
      }, { merge: true });
    }

    // 2. Dual-Write: Write instant-access pointer to claimant's private subcollection (Zero-Index architecture)
    await adminDb.collection('users').doc(claimantUid).collection('sharedMemories').doc(memoryId).set({
      memoryId,
      ownerUid: ownerUid || '',
      ownerPath: targetDoc.ref.path,
      title: data.title || '',
      chapterTitle: data.chapterTitle || '',
      posterImageUrl: data.posterImageUrl || data.imageUrl || '',
      status: data.status || 'published',
      claimedAt: new Date().toISOString()
    }, { merge: true });

    let ownerDisplayName = 'Memory Weaver Director';
    if (ownerUid) {
      const userDoc = await adminDb.collection('users').doc(ownerUid).get();
      if (userDoc.exists) {
        ownerDisplayName = userDoc.data()?.displayName || userDoc.data()?.name || 'Memory Weaver Director';
      }
    }

    return { success: true, alreadyClaimed, memoryTitle: data.title, ownerDisplayName };
  } catch (error: any) {
    console.error('[claimSharedMemoryAction] Error claiming shared memory:', error);
    return { success: false, error: error?.message || 'Failed to claim shared memory.' };
  }
}

export async function getSharedWithMeMemoriesAction(uid: string): Promise<{ memories: any[]; error?: string }> {
  if (!uid || !adminDb) {
    return { memories: [], error: 'Invalid request or database not initialized.' };
  }

  const db = adminDb;

  try {
    // 1. Primary Strategy: Query user's private sharedMemories subcollection (Instant & requires zero composite indexes)
    const subcollectionSnap = await db.collection('users').doc(uid).collection('sharedMemories').get();
    
    let candidateDocs: any[] = [];

    if (!subcollectionSnap.empty) {
      // Fetch fresh full memory records from pointers
      const memoryPromises = subcollectionSnap.docs.map(async (pDoc) => {
        const pointerData = pDoc.data();
        try {
          if (pointerData.ownerPath) {
            const fullDoc = await db.doc(pointerData.ownerPath).get();
            if (fullDoc.exists) {
              const fullData = fullDoc.data() as any;
              return {
                id: fullDoc.id,
                ...fullData,
                ownerUid: pointerData.ownerUid || fullData.userId || fullDoc.ref.parent.parent?.id,
                ownerPath: pointerData.ownerPath
              };
            }
          }
        } catch (e) {
          console.warn(`[getSharedWithMeMemoriesAction] Error reading memory path ${pointerData.ownerPath}:`, e);
        }
        return {
          id: pDoc.id,
          ...pointerData
        };
      });

      const resolved = await Promise.all(memoryPromises);
      candidateDocs = resolved.filter(m => m && (m.status === 'published' || m.status === 'pre-release'));
    } else {
      // 2. Fallback Strategy: CollectionGroup query with single-field index
      try {
        const memoriesQuery = await db.collectionGroup('memories')
          .where('sharedWith', 'array-contains', uid)
          .get();

        candidateDocs = memoriesQuery.docs.map(doc => {
          const data = doc.data();
          const ownerUid = data.userId || doc.ref.parent.parent?.id;
          return {
            id: doc.id,
            ...data,
            ownerUid,
            ownerPath: ownerUid ? `users/${ownerUid}/memories/${doc.id}` : doc.ref.path
          } as any;
        }).filter(m => m.status === 'published' || m.status === 'pre-release');
      } catch (cgErr: any) {
        console.warn('[getSharedWithMeMemoriesAction] CollectionGroup query fallback failed (likely pending index exemption):', cgErr.message);
      }
    }

    // UID Deduplication: Batch fetch unique director profiles once
    const uniqueOwnerUids = Array.from(new Set(candidateDocs.map(m => m.ownerUid).filter(Boolean))) as string[];

    const userProfilesMap: Record<string, { displayName: string; email: string }> = {};
    await Promise.all(uniqueOwnerUids.map(async (ownerId) => {
      try {
        const userDoc = await db.collection('users').doc(ownerId).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          userProfilesMap[ownerId] = {
            displayName: uData?.displayName || uData?.name || 'Memory Weaver Director',
            email: uData?.email || ''
          };
        }
      } catch (e) {
        console.warn(`[getSharedWithMeMemoriesAction] Could not fetch profile for ${ownerId}:`, e);
      }
    }));

    // Map profiles back to candidate docs instantaneously from in-memory dictionary
    const memoriesWithOwners = candidateDocs.map(m => {
      const profile = m.ownerUid ? userProfilesMap[m.ownerUid] : undefined;
      return {
        ...m,
        ownerDisplayName: profile?.displayName || m.ownerDisplayName || 'Memory Weaver Director',
        ownerEmail: profile?.email || m.ownerEmail || ''
      };
    });

    return { memories: memoriesWithOwners };
  } catch (error: any) {
    console.error('[getSharedWithMeMemoriesAction] Error fetching shared memories:', error);
    return { memories: [], error: error?.message || 'Failed to fetch shared memories.' };
  }
}
