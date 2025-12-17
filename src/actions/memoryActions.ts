"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import type { Memory, MediaAttachment, EmotionTag } from "@/types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Helper to read the body of a file to a buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

export async function saveMemory(
    formData: FormData,
    userId: string,
    editMemoryId: string | null
): Promise<{ success: boolean; message: string; data?: Memory }> {
    console.log(`[SAVE_MEMORY_ACTION] --- Initiating memory save for user: ${userId} ---`);
    const isEditing = !!editMemoryId;

    try {
        const mediaFileToUpload = formData.get("mediaFile") as File | null;
        const title = formData.get('title') as string || 'Untitled Memory';
        const dateStr = formData.get('date') as string || new Date().toISOString();
        const description = formData.get('description') as string || '';

        let finalMediaAttachments: MediaAttachment[] = [];

        // Scenario 1: A new file is being uploaded
        if (mediaFileToUpload && mediaFileToUpload.size > 0) {
            console.log(`[SAVE_MEMORY_ACTION] New media file detected: ${mediaFileToUpload.name}`);
            const filePath = `users/${userId}/memories/${Date.now()}_${mediaFileToUpload.name}`;
            const fileRef = adminStorage.bucket().file(filePath);
            
            // Convert file stream to buffer to upload with Admin SDK
            const fileBuffer = await streamToBuffer(mediaFileToUpload.stream());
            
            await fileRef.save(fileBuffer, { contentType: mediaFileToUpload.type });
            await fileRef.makePublic(); // Make the file publicly accessible
            const downloadURL = fileRef.publicUrl();

            const metadataStr = formData.get('mediaMetadata') as string;
            let metadata = { startTime: 0, endTime: 0, isTrimmed: false };
            if (metadataStr) metadata = { ...metadata, ...JSON.parse(metadataStr) };

            const newAttachment: MediaAttachment = {
                id: 'media' + Date.now(),
                type: mediaFileToUpload.type.startsWith('video') ? 'video' : 'audio',
                url: downloadURL,
                filename: mediaFileToUpload.name,
                size: mediaFileToUpload.size,
                ...metadata
            };
            finalMediaAttachments = [newAttachment];
        } else {
            // Scenario 2: No new file, check for existing attachments (e.g., just a trim update)
            const existingAttachmentsString = formData.get('mediaAttachments') as string;
            if (existingAttachmentsString) {
                console.log(`[SAVE_MEMORY_ACTION] Existing media attachments detected.`);
                finalMediaAttachments = JSON.parse(existingAttachmentsString);
            }
        }

        // Assemble the core data object for Firestore
        const dataToSave: { [key: string]: any } = {
            title,
            date: Timestamp.fromDate(new Date(dateStr)),
            description,
            mediaAttachments: finalMediaAttachments,
            updatedAt: FieldValue.serverTimestamp(),
        };
        
        // Conditionally add fields to avoid saving 'undefined' or empty values
        const location = formData.get('location') as string;
        if (location) dataToSave.location = location;

        const country = formData.get('country') as string;
        if (country) dataToSave.country = country;
        
        const category = formData.get('category') as string;
        if (category) dataToSave.category = category;

        const promptId = formData.get('promptId') as string;
        if (promptId) dataToSave.promptId = promptId;

        dataToSave.isLegacy = formData.get('isLegacy') === 'true';

        const emotionTagsString = formData.get('emotionTags') as string;
        if (emotionTagsString) dataToSave.emotionTags = JSON.parse(emotionTagsString);


        if (editMemoryId) {
            console.log(`[SAVE_MEMORY_ACTION] Updating existing memory with ID: ${editMemoryId}`);
            const memoryDocRef = adminDb.collection('users').doc(userId).collection('memories').doc(editMemoryId);
            await memoryDocRef.update(dataToSave);
        } else {
            console.log(`[SAVE_MEMORY_ACTION] Creating new memory for user: ${userId}`);
            const memoriesCollectionRef = adminDb.collection('users').doc(userId).collection('memories');
            dataToSave.userId = userId;
            dataToSave.createdAt = FieldValue.serverTimestamp();
            await memoriesCollectionRef.add(dataToSave);
        }

        console.log('[SAVE_MEMORY_ACTION] --- Memory save operation completed successfully. ---');
        return { success: true, message: isEditing ? "Memory updated successfully!" : "Memory saved successfully!" };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("[SAVE_MEMORY_ACTION] Error in saveMemory server action:", error);
        return { success: false, message: `A server error occurred: ${errorMessage}` };
    }
}