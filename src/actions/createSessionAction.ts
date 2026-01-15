'use server';

import { setSessionCookie, deleteSession } from "@/lib/session";
import { adminAuth } from '@/lib/firebase-admin';

export async function createSessionAction(idToken: string) {
  if (!adminAuth) {
    console.error("[createSessionAction] Firebase Admin SDK is not initialized.");
    return { success: false, message: "Server-side authentication is not configured." };
  }
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    await setSessionCookie(sessionCookie, expiresIn);
    return { success: true, message: 'Session created successfully.' };

  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return { success: false, message: 'Could not create session: ' + error.message };
  }
}

export async function deleteSessionAction() {
    await deleteSession();
    return { success: true, message: "Session deleted successfully." };
}
