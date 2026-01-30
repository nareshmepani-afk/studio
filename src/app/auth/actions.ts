
'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

export async function signInAnonymously(): Promise<string> {
  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }
  try {
    // Firebase does not have a direct "signInAnonymously" method in the Admin SDK.
    // Instead, we create a custom token for an anonymous user and then sign in with that token on the client-side.
    // However, for the purpose of this exercise, we will simulate the creation of an anonymous user
    // by creating a new user with a specific flag.

    const userRecord: UserRecord = await adminAuth.createUser({});
    const uid = userRecord.uid;

    await adminDb.collection('users').doc(uid).set({
      roles: ['guest'],
      createdAt: new Date(),
    });

    return uid;
  } catch (error) {
    console.error('Error in signInAnonymously:', error);
    throw new Error('Failed to sign in anonymously.');
  }
}
