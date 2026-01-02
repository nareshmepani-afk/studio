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
    await sendPasswordResetEmail(email, link);
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
