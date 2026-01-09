'use server';

import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { sendPasswordResetEmail } from '@/lib/email';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const link = await getAuth().generatePasswordResetLink(email);
    // This now calls the email service instead of just logging.
    await sendPasswordResetEmail(email, link);
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error: any) {
    // We keep the generic error message for security.
    // Detailed errors are logged on the server.
    console.error(`Password reset request failed for ${email}:`, error);
    return { success: false, message: 'Could not send password reset link. Please try again.' };
  }
}
