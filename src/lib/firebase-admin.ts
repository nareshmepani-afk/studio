
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app;

// Add this helper to sanitize the environment variable
const getServiceAccount = () => {
  const raw = process.env.SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("SERVICE_ACCOUNT_JSON is missing");

  try {
    // This handles cases where the JSON might be wrapped in extra quotes 
    // or has escaped newlines from the Firebase Console
    return JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw);
  } catch (e) {
    console.error("Critical: Service Account JSON is malformed");
    throw e;
  }
};

if (getApps().length === 0) {
  try {
    const serviceAccount = getServiceAccount();
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (e) {
    console.error("Firebase Admin SDK initialization failed:", e);
    // Set app to null or handle appropriately so the rest of the app knows init failed
    app = null;
  }
} else {
  app = getApps()[0];
}

const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;
const adminStorage = app ? getStorage(app) : null;

export { adminAuth, adminDb, adminStorage };
