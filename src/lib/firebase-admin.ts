
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app;
let serviceAccount;

if (getApps().length === 0) {
  try {
    serviceAccount = process.env.SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
      : null;
  } catch (e) {
    console.error("Failed to parse SERVICE_ACCOUNT_JSON. Ensure it is valid JSON.");
    serviceAccount = null;
  }

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.error("SERVICE_ACCOUNT_JSON is missing or malformed! Firebase Admin SDK could not be initialized.");
  }
} else {
  app = getApps()[0];
}

const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;
const adminStorage = app ? getStorage(app) : null;

export { adminAuth, adminDb, adminStorage };
