import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    // App Hosting provides the service account credentials via this environment variable.
    const serviceAccount = process.env.SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        storageBucket: 'memory-weaver-8rk9t.appspot.com' // Make sure this is your correct storage bucket
      });
      console.log('[firebase-admin] Admin SDK initialized successfully.');
    } else {
      console.warn('[firebase-admin] SERVICE_ACCOUNT_JSON env var not set. SDK not initialized.');
    }
  } catch (error: any) {
    console.error('[firebase-admin] CRITICAL: Firebase Admin initialization failed:', error);
  }
}

if (admin.apps.length > 0) {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
}

export { adminDb, adminAuth };
