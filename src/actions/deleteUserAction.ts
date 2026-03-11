'use server';

import { adminAuth } from '@/lib/firebase-admin';

/**
 * Server-side action to delete a user.
 * Uses the centralized adminAuth instance to prevent multiple initialization errors.
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  if (!adminAuth) {
    console.error("TESTIMONY: deleteUser failed - Firebase Admin SDK not initialized.");
    return { success: false, message: "Server-side administration is not configured." };
  }

  try {
    await adminAuth.deleteUser(uid);
    console.log(`TESTIMONY: Successfully deleted user with UID: ${uid}`);
    return { success: true, message: 'User deleted successfully.' };
  } catch (error: any) {
    console.error(`TESTIMONY: Error deleting user with UID: ${uid}`, error);
    return { success: false, message: error.message || "Failed to delete user." };
  }
}
