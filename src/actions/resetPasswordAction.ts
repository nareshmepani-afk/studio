'use server';

import { ActionResponse } from '@/types';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Server-side action to reset a user's password using the Firebase Admin SDK.
 * This action assumes the oobCode has already been verified on the client.
 */
export async function resetPassword(
  email: string, // Changed from oobCode
  newPassword: string
): Promise<ActionResponse> {
  if (!adminAuth) {
    console.error("[resetPassword] Firebase Admin SDK is not initialized.");
    return { success: false, message: "Server-side authentication is not configured." };
  }

  try {
    // 1. Validate inputs
    if (!email || !newPassword) {
      return { success: false, message: 'Email and new password are required.' };
    }

    // 2. Use the Admin SDK to apply the password reset.
    // The oobCode is verified on the client; the server just executes the update.
    const user = await adminAuth.getUserByEmail(email);
    if (!user) {
        return { success: false, message: 'User not found.' };
    }
    await adminAuth.updateUser(user.uid, { password: newPassword });


    return { success: true, message: 'Your password has been reset successfully.' };

  } catch (error: any) {
    console.error('[ACTION FAILED] resetPassword:', error);
    
    // Map Firebase Admin SDK errors to friendly messages
    let message = 'An unexpected error occurred. Please try again later.';
    switch (error.code) {
      case 'auth/user-not-found':
          message = 'No user found with this email address.';
          break;
      case 'auth/user-disabled':
        message = 'Your account has been disabled.';
        break;
      case 'auth/weak-password':
        message = 'The new password is too weak. It must be at least 6 characters long.';
        break;
    }

    return { success: false, message: message };
  }
}
