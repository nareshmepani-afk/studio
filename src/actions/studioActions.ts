
'use server';

import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

interface Participant {
  uid: string;
  role: 'Interviewer' | 'Storyteller';
  joinedAt: number;
}

export async function assignRoleInStudioSession(sessionId: string, userId: string, role: 'Interviewer' | 'Storyteller') {
  try {
    const studioStateRef = doc(db, 'studio', sessionId);

    const newParticipant: Participant = {
      uid: userId,
      role: role,
      joinedAt: Date.now(),
    };

    await updateDoc(studioStateRef, {
      participants: arrayUnion(newParticipant)
    });

    // Revalidate the path to ensure the StudioClientPage re-renders with the new role
    revalidatePath(`/studio/${sessionId}`);

    return { success: true, message: 'Role assigned successfully.' };
  } catch (error) {
    console.error('Error assigning role:', error);
    return { success: false, message: 'Failed to assign role.' };
  }
}
