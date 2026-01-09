'use server';

import { ActionResponse } from '@/types';

/**
 * Server-side action to reset a user's password using the Firebase Auth REST API.
 */
export async function resetPassword(
  oobCode: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    // 1. Validate inputs
    if (!oobCode || !newPassword) {
      return { success: false, message: 'Action code and new password are required.' };
    }

    // 2. We use the REST API because Admin SDK doesn't verify oobCodes
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; 
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oobCode,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Map REST API errors to friendly messages
      const errorCode = data.error?.message;
      
      if (errorCode === 'EXPIRED_OOB_CODE') {
        return { success: false, message: 'The link has expired. Please request a new one.' };
      }
      if (errorCode === 'INVALID_OOB_CODE') {
        return { success: false, message: 'The link is invalid or has already been used.' };
      }
      if (errorCode === 'WEAK_PASSWORD') {
        return { success: false, message: 'The new password is too weak.' };
      }
      
      throw new Error(errorCode || 'REST_API_ERROR');
    }

    return { success: true, message: 'Your password has been reset successfully.' };

  } catch (error: any) {
    console.error('[ACTION FAILED] resetPassword:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
}