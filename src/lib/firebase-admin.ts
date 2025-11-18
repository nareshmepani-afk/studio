
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

// This function initializes and returns the Firebase Admin App instance.
// It ensures that the app is initialized only once (singleton pattern).
export function getFirebaseAdminApp() {
  if (!admin.apps.length) {
    console.log('[firebase-admin] Initializing Firebase Admin SDK...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  } else {
    console.log('[firebase-admin] Firebase Admin SDK already initialized.');
  }
  return admin.app();
}
