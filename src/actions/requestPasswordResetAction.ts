'use server';

import { ActionResponse } from '@/types';

/**
 * Server-side action to request a password reset email using the Firebase Auth REST API.
 * This tells Firebase to generate the link and send the email.
 */
export async function requestPasswordReset(email: string): Promise<ActionResponse> {
  try {
    // 1. Validate input
    if (!email) {
      return { success: false, message: 'Email is required.' };
    }

    // 2. Use the REST API to send the password reset email
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        // For security, we don't want to confirm if an email exists or not.
        // The REST API returns EMAIL_NOT_FOUND, but we will treat it as a success to the user.
        // We will log the actual error on the server for debugging.
        const errorCode = data.error?.message;
        console.error(`[ACTION FAILED] requestPasswordReset for ${email}:`, errorCode);
        // To the client, we return a generic success message to prevent user enumeration attacks.
        return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Return a more specific success message for the happy path.
    return { success: true, message: 'A password reset link has been sent to your email.' };

  } catch (error: any) {
    console.error('[ACTION FAILED] requestPasswordReset:', error);
    // Generic message for unexpected errors.
    return { success: false, message: 'Could not send password reset link. Please try again later.' };
  }
}
