
"use server";

import { db, storage } from "@/lib/firebase";
import type { Memory, MediaAttachment, EmotionTag } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

export async function saveMemory(
    formData: FormData,
    userId: string,
    editMemoryId: string | null
): Promise<{ success: boolean; message: string; data?: Memory }> {
    const mediaFileToUpload = formData.get("mediaFile") as File | null;
    
    // Safely extract and parse form data
    const title = formData.get('title') as string || 'Untitled Memory';
    const dateStr = formData.get('date') as string || new Date().toISOString();
    const date = new Date(dateStr); // Convert ISO string to Date object for Firestore
    const description = formData.get('description') as string || '';
    const location = formData.get('location') as string || undefined;
    const country = formData.get('country') as string || undefined;
    const category = formData.get('category') as string || 'Other';
    const promptId = formData.get('promptId') as string || undefined;
    const isLegacy = formData.get('isLegacy') === 'true';
    
    let emotionTags: EmotionTag[] = [];
    const emotionTagsString = formData.get('emotionTags');
    if (emotionTagsString && typeof emotionTagsString === 'string') {
        try {
            emotionTags = JSON.parse(emotionTagsString);
        } catch (e) {
            console.warn("Could not parse emotionTags", e);
        }
    }

    try {
        let finalMediaAttachments: MediaAttachment[] = [];
        
        // If there's an existing media attachment string, parse it.
        // This is crucial for edits where the media isn't being changed.
        const existingAttachmentsString = formData.get('mediaAttachments') as string;
        if (existingAttachmentsString) {
             try {
                finalMediaAttachments = JSON.parse(existingAttachmentsString);
            } catch (e) {
                console.warn("Could not parse existing mediaAttachments", e);
            }
        }


        // If a new file is uploaded, it takes precedence.
        if (mediaFileToUpload) {
            console.log(`[SERVER ACTION] Uploading new file: ${mediaFileToUpload.name}`);
            const filePath = `users/${userId}/memories/${Date.now()}_${mediaFileToUpload.name}`;
            const fileRef = storageRef(storage, filePath);
            await uploadBytes(fileRef, mediaFileToUpload);
            const downloadURL = await getDownloadURL(fileRef);

            const newAttachment: MediaAttachment = {
                id: 'media' + Date.now(),
                type: mediaFileToUpload.type.startsWith('video') ? 'video' : 'audio',
                url: downloadURL,
                filename: mediaFileToUpload.name,
                size: mediaFileToUpload.size,
                // Duration would ideally be extracted, but it's complex server-side.
                // It's better to handle this on the client before upload if needed.
            };
            // When a new file is uploaded, it replaces any existing media
            finalMediaAttachments = [newAttachment]; 
            console.log(`[SERVER ACTION] New attachment created:`, newAttachment);
        }

        // Prepare data with correct types for Firestore
        const dataToSave = {
            title,
            date: Timestamp.fromDate(date), // Use Firestore Timestamp
            description,
            location,
            country,
            category,
            promptId,
            isLegacy,
            emotionTags,
            mediaAttachments: finalMediaAttachments,
            updatedAt: serverTimestamp(),
        };

        if (editMemoryId) {
            console.log(`[SERVER ACTION] Updating memory ID: ${editMemoryId}`);
            const memoryDocRef = doc(db, 'users', userId, 'memories', editMemoryId);
            await updateDoc(memoryDocRef, dataToSave);
        } else {
            console.log(`[SERVER ACTION] Creating new memory for user: ${userId}`);
            const memoriesCollectionRef = collection(db, 'users', userId, 'memories');
            const dataWithCreationFields = {
                ...dataToSave,
                userId: userId,
                createdAt: serverTimestamp(),
            };
            await addDoc(memoriesCollectionRef, dataWithCreationFields);
        }

        return { success: true, message: "Memory saved successfully!" };

    } catch (error) {
        console.error("Error in saveMemory server action:", error);
        return { success: false, message: "A server error occurred while saving the memory." };
    }
}
