
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app;

if (getApps().length === 0) {
  const serviceAccount = process.env.SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
    : null;

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.error("SERVICE_ACCOUNT_JSON is missing! Firebase Admin SDK could not be initialized.");
  }
} else {
  app = getApps()[0];
}

const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;
const adminStorage = app ? getStorage(app) : null;

export { adminAuth, adminDb, adminStorage };
