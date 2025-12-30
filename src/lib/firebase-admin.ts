
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

console.log('[Firebase Admin] Initializing... Attempts to init:', admin.apps.length);

if (!admin.apps.length) {
  try {
    const serviceAccountEnv = process.env.SERVICE_ACCOUNT_JSON;
    let initialized = false;

    // This environment variable is unreliable on the server.
    const storageBucketEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; 
    console.log(`[Firebase Admin] Storage bucket from env (may be incorrect): ${storageBucketEnv}`);

    if (serviceAccountEnv && storageBucketEnv) {
      try {
        const serviceAccount = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          // Even if the env var exists, we force the correct bucket.
          storageBucket: 'memory-weaver-8rk9t.appspot.com',
        });
        console.log('[Firebase Admin] Initialized successfully using environment variables with hardcoded bucket.');
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
        
        // THE DEFINITIVE FIX: Hardcode the correct bucket name.
        const bucketName = 'memory-weaver-8rk9t.appspot.com';

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: bucketName
        });
        console.log(`[Firebase Admin] Initialized successfully using file system. DEFINITIVE BUCKET: ${bucketName}`);
      } else {
        throw new Error('serviceAccountKey.json not found and SERVICE_ACCOUNT_JSON env var not set.');
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] CRITICAL: Initialization failed:', errorMessage);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = getStorage();

console.log('[Firebase Admin] Module fully loaded.');
