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
    console.log(`[SAVE_MEMORY_ACTION] --- Initiating memory save for user: ${userId} ---`);

    const mediaFileToUpload = formData.get("mediaFile") as File | null;
   
    const promptId = formData.get('promptId') as string | undefined;
    console.log(`[SAVE_MEMORY_ACTION] Retrieved 'promptId' from FormData: ${promptId ? `'${promptId}'` : 'undefined'}`);

    const title = formData.get('title') as string || 'Untitled Memory';
    const dateStr = formData.get('date') as string || new Date().toISOString();
    const date = new Date(dateStr);
    const description = formData.get('description') as string || '';
    const location = formData.get('location') as string || undefined;
    const country = formData.get('country') as string || undefined;
    const category = formData.get('category') as string || 'Other';
    const isLegacy = formData.get('isLegacy') === 'true';
   
    let emotionTags: EmotionTag[] = [];
    const emotionTagsString = formData.get('emotionTags');
    if (emotionTagsString && typeof emotionTagsString === 'string') {
        try {
            emotionTags = JSON.parse(emotionTagsString);
        } catch (e) {
            console.warn("[SAVE_MEMORY_ACTION] Could not parse emotionTags", e);
        }
    }

    try {
        let finalMediaAttachments: MediaAttachment[] = [];
        const existingAttachmentsString = formData.get('mediaAttachments') as string;
        if (existingAttachmentsString) {
             try {
                finalMediaAttachments = JSON.parse(existingAttachmentsString);
            } catch (e) {
                console.warn("[SAVE_MEMORY_ACTION] Could not parse existing mediaAttachments", e);
            }
        }

        if (mediaFileToUpload) {
            const filePath = `users/${userId}/memories/${Date.now()}_${mediaFileToUpload.name}`;
            const fileRef = storageRef(storage, filePath);
            await uploadBytes(fileRef, mediaFileToUpload);
            const downloadURL = await getDownloadURL(fileRef);
            
            const metadataStr = formData.get('mediaMetadata') as string;
            let metadata = {};
            if (metadataStr) {
                try {
                    metadata = JSON.parse(metadataStr);
                } catch (e) {
                    console.warn("[SAVE_MEMORY_ACTION] Could not parse mediaMetadata", e);
                }
            }

            const newAttachment: MediaAttachment = {
                id: 'media' + Date.now(),
                type: mediaFileToUpload.type.startsWith('video') ? 'video' : 'audio',
                url: downloadURL,
                filename: mediaFileToUpload.name,
                size: mediaFileToUpload.size,
                ...metadata // This spreads in the startTime/endTime from the client
            };
            finalMediaAttachments = [newAttachment]; 
        }

        const dataToSave: any = {
            title,
            date: Timestamp.fromDate(date),
            description,
            location,
            country,
            category,
            isLegacy,
            emotionTags,
            mediaAttachments: finalMediaAttachments,
            updatedAt: serverTimestamp(),
        };

        if (promptId) {
            dataToSave.promptId = promptId;
        }
       
        console.log('[SAVE_MEMORY_ACTION] Assembled data object for Firestore. Checking for promptId...', dataToSave);
        if (dataToSave.promptId) {
            console.log(`[SAVE_MEMORY_ACTION] SUCCESS: promptId '${dataToSave.promptId}' is present in the object to be saved.`);
        } else {
            console.log(`[SAVE_MEMORY_ACTION] WARNING: promptId is NOT present in the final object. It will not be saved.`);
        }

        if (editMemoryId) {
            console.log(`[SAVE_MEMORY_ACTION] Updating existing memory with ID: ${editMemoryId}`);
            const memoryDocRef = doc(db, 'users', userId, 'memories', editMemoryId);
            await updateDoc(memoryDocRef, dataToSave);
        } else {
            console.log(`[SAVE_MEMORY_ACTION] Creating new memory for user: ${userId}`);
            const memoriesCollectionRef = collection(db, 'users', userId, 'memories');
            const dataWithCreationFields = {
                ...dataToSave,
                userId: userId,
                createdAt: serverTimestamp(),
            };
            await addDoc(memoriesCollectionRef, dataWithCreationFields);
        }

        console.log('[SAVE_MEMORY_ACTION] --- Memory save operation completed successfully. ---
');
        return { success: true, message: "Memory saved successfully!" };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("[SAVE_MEMORY_ACTION] Error in saveMemory server action:", errorMessage);
        console.log('[SAVE_MEMORY_ACTION] --- Memory save operation failed. ---
');
        return { success: false, message: `A server error occurred: ${errorMessage}` };
    }
}
