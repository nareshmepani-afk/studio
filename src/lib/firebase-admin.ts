import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

// Define the correct storage bucket name directly.
const BUCKET_NAME = 'memory-weaver-8rk9t.appspot.com';

console.log('[Firebase Admin] Initializing... Attempts to init:', admin.apps.length);

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // Try to get service account from environment variable first
    if (process.env.SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
       console.log('[Firebase Admin] Loaded service account from environment variable.');
    } else {
      // Fallback to file system
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountString);
        console.log('[Firebase Admin] Loaded service account from file system.');
      } else {
        throw new Error('Could not find service account credentials. Set SERVICE_ACCOUNT_JSON env var or place serviceAccountKey.json in the root directory.');
      }
    }
    
    // Initialize with the definitive storage bucket name.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
    
    console.log(`[Firebase Admin] Initialized successfully. Using bucket: ${BUCKET_NAME}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] CRITICAL: Initialization failed:', errorMessage);
    // This allows the app to build but will fail at runtime if Firebase services are needed.
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = getStorage();

console.log('[Firebase Admin] Module fully loaded.');
