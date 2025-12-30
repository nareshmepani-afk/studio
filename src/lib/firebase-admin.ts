
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountEnv = process.env.SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[firebase-admin] Firebase Admin SDK initialized successfully from environment variable.');
    } catch (error) {
      console.error('[firebase-admin] Error initializing from SERVICE_ACCOUNT_JSON:', error);
    }
  } else {
    console.warn('[firebase-admin] SERVICE_ACCOUNT_JSON environment variable is not set. Admin SDK not initialized.');
  }
}

export const adminAuth = admin.apps.length ? getAuth() : null;
export const adminDb = admin.apps.length ? getFirestore() : null;
export const adminStorage = admin.apps.length ? getStorage() : null;
