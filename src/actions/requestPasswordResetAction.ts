'use server';

import { ActionResponse } from '@/types';
import { adminAuth } from '@/lib/firebase-admin';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * Server-side action to generate a password reset link and send it via email.
 */
export async function requestPasswordReset(email: string): Promise<ActionResponse> {
  try {
    if (!email) {
      return { success: false, message: 'Email is required.' };
    }

    // 1. Generate the password reset link using the Firebase Admin SDK.
    const link = await adminAuth.generatePasswordResetLink(email);

    // 2. Send the email using our Resend service.
    await sendPasswordResetEmail(email, link);

    // For security, we don't want to confirm if an email exists or not.
    return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };

  } catch (error: any) {
    // Firebase Admin SDK throws an 'auth/user-not-found' error if the user doesn't exist.
    // We will catch this specific error and treat it as a success from the user's perspective
    // to prevent email enumeration attacks.
    if (error.code === 'auth/user-not-found') {
        console.log(`[ACTION] Password reset requested for non-existent user: ${email}`);
        return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // For all other errors, log them and re-throw to provide a full stack trace on the client.
    console.error('[ACTION FAILED] requestPasswordReset:', error);
    throw error;
  }
}
