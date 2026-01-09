'use server';

import * as admin from 'firebase-admin';
import { ActionResponse } from '@/types';

// Initialize the admin SDK if it hasn't been already.
// This is a self-contained action, ensuring it has what it needs.
if (!admin.apps.length) {
  const serviceAccount = process.env.SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    console.error('[resetPasswordAction] Firebase Admin SDK not initialized: SERVICE_ACCOUNT_JSON is missing.');
  }
}

/**
 * Server-side action to reset a user's password using a valid oobCode.
 * This is the final step in the password reset flow.
 */
export async function resetPassword(
  oobCode: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    if (!admin.apps.length) {
      throw new Error("Firebase Admin SDK is not available.");
    }

    // Get a fresh, correctly-typed auth service directly from the admin object.
    const adminAuth = admin.auth();

    // Check for missing arguments
    if (!oobCode || !newPassword) {
      return { success: false, message: 'Action code and new password are required.' };
    }

    // 1. Verify the password reset code is valid.
    await adminAuth.verifyPasswordResetCode(oobCode);

    // 2. If valid, update the user's password.
    await adminAuth.confirmPasswordReset(oobCode, newPassword);

    return { success: true, message: 'Your password has been reset successfully.' };

  } catch (error: any) {
    console.error('[ACTION FAILED] resetPassword:', error);

    let userMessage = 'Failed to reset password. Please try again.';
    if (error.code === 'auth/expired-action-code') {
      userMessage = 'The password reset link has expired. Please request a new one.';
    } else if (error.code === 'auth/invalid-action-code') {
      userMessage = 'The password reset link is invalid. It may have already been used.';
    }

    return { success: false, message: userMessage };
  }
}
