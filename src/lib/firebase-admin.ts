
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

/**
 * Robustly parses the SERVICE_ACCOUNT_JSON environment variable.
 * Handles cases where the JSON might be double-stringified or contain escaped newlines.
 */
const getServiceAccount = () => {
  const raw = process.env.SERVICE_ACCOUNT_JSON;
  
  if (!raw) {
    console.error("TESTIMONY: SERVICE_ACCOUNT_JSON is missing from environment variables.");
    return null;
  }

  try {
    // 1. Handle potential double-stringification (common in automated secret injection)
    let parsed = raw;
    if (raw.trim().startsWith('"') && raw.trim().endsWith('"')) {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        // Not double-stringified, just starts with quotes (unlikely for valid JSON)
      }
    }

    const config = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;

    // 2. Fix potential newline issues in the private key which often break parsing
    if (config && config.private_key) {
      config.private_key = config.private_key.replace(/\\n/g, '\n');
    }

    return config;
  } catch (error: any) {
    console.error("TESTIMONY: CRITICAL - Failed to parse SERVICE_ACCOUNT_JSON.", error.message);
    // Log a safe snippet for debugging
    console.error("TESTIMONY: Raw secret prefix (first 20 chars):", raw.substring(0, 20));
    return null;
  }
};

let app: App | undefined;

// Idempotent initialization
if (getApps().length === 0) {
  const serviceAccount = getServiceAccount();
  
  if (serviceAccount && serviceAccount.project_id) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log(`TESTIMONY: Firebase Admin SDK initialized for project: ${serviceAccount.project_id}`);
    } catch (error: any) {
      console.error("TESTIMONY: Firebase Admin SDK initialization error:", error.message);
    }
  } else {
    console.error("TESTIMONY: Skipping Firebase Admin initialization - no valid service account available.");
  }
} else {
  app = getApps()[0];
}

export const adminApp: App | undefined = app;
export const adminAuth: Auth | null = app ? getAuth(app) : null;
export const adminDb: Firestore | null = app ? getFirestore(app) : null;
export const adminStorage: Storage | null = app ? getStorage(app) : null;
