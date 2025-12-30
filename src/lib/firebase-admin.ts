
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

console.log('[Firebase Admin] Initializing... Attempts to init:', admin.apps.length);

if (!admin.apps.length) {
  try {
    // Try to get service account from environment variable first
    const serviceAccountEnv = process.env.SERVICE_ACCOUNT_JSON;
    const storageBucketEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    let initialized = false;

    console.log(`[Firebase Admin] Storage bucket from env: ${storageBucketEnv}`);

    if (serviceAccountEnv && storageBucketEnv) {
      try {
        const serviceAccount = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucketEnv,
        });
        console.log('[Firebase Admin] Initialized successfully using environment variables.');
        initialized = true;
      } catch (e) {
        console.warn('[Firebase Admin] Failed to initialize from environment variable. Falling back to file system.', e);
      }
    }

    if (!initialized) {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountString);
        
        const bucketName = storageBucketEnv || serviceAccount.project_id + '.appspot.com';

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: bucketName
        });
        console.log(`[Firebase Admin] Initialized successfully using file system. Bucket: ${bucketName}`);
      } else {
        throw new Error('serviceAccountKey.json not found and SERVICE_ACCOUNT_JSON env var not set.');
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] CRITICAL: Initialization failed:', errorMessage);
    // Re-throwing the error might be too aggressive for some environments.
    // Consider just logging the error and letting the app continue,
    // if parts of the app can function without Firebase services.
    // throw new Error(`Firebase Admin SDK initialization failed: ${errorMessage}`);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = getStorage();

console.log('[Firebase Admin] Module fully loaded.');
