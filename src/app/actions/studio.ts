'use server';

import { firestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Queues a prompt for the Storyteller.
 * @param sessionId The ID of the studio session.
 * @param promptId The ID of the prompt to queue.
 */
export const queuePrompt = async (sessionId: string, promptId: string) => {
  if (!sessionId || !promptId) {
    return { success: false, error: 'Invalid arguments' };
  }
  try {
    const sessionRef = firestore.collection('studio').doc(sessionId);
    await sessionRef.update({
      queuedPromptId: promptId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error queuing prompt:', error);
    return { success: false, error: 'Failed to queue prompt' };
  }
};

/**
 * Sets the active prompt for the stage.
 * @param sessionId The ID of the studio session.
 * @param promptId The ID of the prompt to set as active.
 */
export const setPrompt = async (sessionId: string, promptId: string) => {
  if (!sessionId || !promptId) {
    return { success: false, error: 'Invalid arguments' };
  }
  try {
    const sessionRef = firestore.collection('studio').doc(sessionId);
    await sessionRef.update({
      activePromptId: promptId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting prompt:', error);
    return { success: false, error: 'Failed to set prompt' };
  }
};

/**
 * Fetches the content of a specific prompt.
 * @param promptId The ID of the prompt to fetch.
 */
export const getPrompt = async (promptId: string) => {
  if (!promptId) {
    return { success: false, error: 'Invalid arguments' };
  }
  try {
    const promptRef = firestore.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();
    if (!promptDoc.exists) {
      return { success: false, error: 'Prompt not found' };
    }
    return { success: true, prompt: promptDoc.data() };
  } catch (error) {
    console.error('Error getting prompt:', error);
    return { success: false, error: 'Failed to get prompt' };
  }
};
