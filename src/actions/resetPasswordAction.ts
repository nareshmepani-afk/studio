'use server';

import { ActionResponse } from '@/types';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Server-side action to reset a user's password using the Firebase Admin SDK.
 */
export async function resetPassword(
  oobCode: string,
  newPassword: string
): Promise<ActionResponse> {
  if (!adminAuth) {
    console.error("[resetPassword] Firebase Admin SDK is not initialized.");
    return { success: false, message: "Server-side authentication is not configured." };
  }

  try {
    // 1. Validate inputs
    if (!oobCode || !newPassword) {
      return { success: false, message: 'Action code and new password are required.' };
    }

    // 2. Use the Admin SDK to apply the password reset.
    // This is more secure as it's a trusted server-side operation.
    const email = (await adminAuth.verifyPasswordResetCode(oobCode)).email!;
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { password: newPassword });


    return { success: true, message: 'Your password has been reset successfully.' };

  } catch (error: any) {
    console.error('[ACTION FAILED] resetPassword:', error);
    
    // Map Firebase Admin SDK errors to friendly messages
    let message = 'An unexpected error occurred. Please try again later.';
    switch (error.code) {
      case 'auth/expired-action-code':
        message = 'The link has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        message = 'The link is invalid or has already been used.';
        break;
      case 'auth/user-disabled':
        message = 'Your account has been disabled.';
        break;
      case 'auth/weak-password':
        message = 'The new password is too weak.';
        break;
    }

    return { success: false, message: message };
  }
}
