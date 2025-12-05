
"use server";

import { db, storage } from "@/lib/firebase";
import type { Memory, MediaAttachment, EmotionTag } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

// A map to keep track of storage usage calculations to avoid redundant operations.
const storageUsageCalculationPromises = new Map<string, Promise<void>>();

async function calculateAndUpdateStorageUsage(userId: string): Promise<void> {
    // Implementation for storage calculation, can be added later if needed.
}

export async function saveMemory(
    formData: FormData,
    userId: string,
    editMemoryId: string | null
): Promise<{ success: boolean; message: string; data?: Memory }> {
    const mediaFileToUpload = formData.get("mediaFile") as File | null;
    
    // Safely extract and parse form data
    const title = formData.get('title') as string || 'Untitled Memory';
    const date = formData.get('date') as string || new Date().toISOString();
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
        
        const existingAttachmentsString = formData.get('mediaAttachments') as string;
        if (existingAttachmentsString) {
             try {
                finalMediaAttachments = JSON.parse(existingAttachmentsString);
            } catch (e) {
                console.warn("Could not parse existing mediaAttachments", e);
            }
        }


        if (mediaFileToUpload) {
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
                // Duration would need to be extracted from the file, a more complex task
            };
            // When a new file is uploaded, it replaces any existing media
            finalMediaAttachments = [newAttachment]; 
        }

        const dataToSave = {
            title,
            date,
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
            const memoryDocRef = doc(db, 'users', userId, 'memories', editMemoryId);
            await updateDoc(memoryDocRef, dataToSave);
        } else {
            const memoriesCollectionRef = collection(db, 'users', userId, 'memories');
            await addDoc(memoriesCollectionRef, {
                ...dataToSave,
                userId: userId,
                createdAt: serverTimestamp(),
            });
        }

        // Update storage usage without waiting for it to complete
        const calcPromise = storageUsageCalculationPromises.get(userId);
        if (!calcPromise) {
            const newPromise = calculateAndUpdateStorageUsage(userId);
            storageUsageCalculationPromises.set(userId, newPromise);
            newPromise.finally(() => {
                storageUsageCalculationPromises.delete(userId);
            });
        }

        return { success: true, message: "Memory saved successfully!" };

    } catch (error) {
        console.error("Error saving memory:", error);
        return { success: false, message: "Failed to save memory." };
    }
}
