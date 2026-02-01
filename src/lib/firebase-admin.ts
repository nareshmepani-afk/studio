
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

const getServiceAccount = () => {
  const raw = process.env.SERVICE_ACCOUNT_JSON;
  if (!raw) {
      console.error("SERVICE_ACCOUNT_JSON is missing");
      return null;
  };

  try {
    // 1. Handle double-stringification (common in some secret managers)
    const formatted = raw.startsWith('"') ? JSON.parse(raw) : raw;
    const config = typeof formatted === 'string' ? JSON.parse(formatted) : formatted;

    // 2. Fix potential newline issues in the private key
    if (config.private_key) {
      config.private_key = config.private_key.replace(/\n/g, '\n');
    }
    return config;
  } catch (error) {
    console.error("SERVICE_ACCOUNT_JSON parsing failed:", error);
    return null;
  }
};

let app: App | undefined;

if (getApps().length === 0) {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error("Firebase Admin SDK initialization failed:", error);
      app = undefined; // Ensure app is undefined on failure
    }
  } else {
    console.error("Firebase Admin SDK initialization failed: No valid service account could be parsed.");
  }
} else {
  app = getApps()[0];
}

const adminAuth: Auth | null = app ? getAuth(app) : null;
const adminDb: Firestore | null = app ? getFirestore(app) : null;
const adminStorage: Storage | null = app ? getStorage(app) : null;

if (!adminAuth || !adminDb || !adminStorage) {
    console.warn("One or more Firebase Admin services could not be initialized. This may lead to runtime errors.");
}

export { adminAuth, adminDb, adminStorage };
