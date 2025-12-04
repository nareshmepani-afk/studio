
"use server";

import { db, storage } from "@/lib/firebase";
import type { Memory, MediaAttachment } from "@/types";
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
    const memoryData: Partial<Memory> = {};
    const mediaFileToUpload = formData.get("mediaFile") as File | null;

    // Extract data from formData
    for (const [key, value] of formData.entries()) {
        if (key !== 'mediaFile') {
            try {
                memoryData[key as keyof Memory] = JSON.parse(value as string);
            } catch (e) {
                memoryData[key as keyof Memory] = value as any;
            }
        }
    }

    try {
        let finalMediaAttachments = memoryData.mediaAttachments || [];

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
            finalMediaAttachments = [newAttachment]; // Replace or append as per logic
        }

        const dataToSave = {
            ...memoryData,
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
