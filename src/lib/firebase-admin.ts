import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage'; // Added storage import

let app: App;
let adminDb: Firestore;
let adminAuth: Auth;
let adminStorage: Storage; // Added storage variable

const formatPrivateKey = (key: string) => {
  return key.replace(/\\n/g, '\n');
};

try {
  if (getApps().length > 0) {
    app = getApp();
    console.log('[FIREBASE ADMIN] Using existing app instance.');
  } else {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      console.log('[FIREBASE ADMIN] Found service account key. Parsing...');
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (e) {
        console.error('[FIREBASE ADMIN] JSON Parse failed. Checking for unescaped newlines...');
        const cleanedKey = formatPrivateKey(serviceAccountKey);
        serviceAccount = JSON.parse(cleanedKey);
      }
      
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[FIREBASE ADMIN] New app instance initialized.');
    } else {
      throw new Error('[FIREBASE ADMIN] Service account key is missing in environment variables.');
    }
  }

  adminDb = getFirestore(app);
  adminAuth = getAuth(app);
  adminStorage = getStorage(app); // Initialize storage

  console.log('[FIREBASE ADMIN] Firestore, Auth, and Storage are ready.');

} catch (error: any) {
  console.error('[FIREBASE ADMIN] Initialization failed:', error.message);
  // To prevent the app from running with a broken admin setup, we throw the error.
  // This will cause the server to fail to start, which is better than running in a broken state.
  throw error;
}

export { app, adminDb, adminAuth, adminStorage }; // Export adminStorage
