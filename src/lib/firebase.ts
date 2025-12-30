
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// THE FIX: The projectId MUST be sourced from the environment variable
// to ensure the client and server are talking to the same Firebase project.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Use the environment variable
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// New log to debug configuration
console.log('[FIREBASE_CONFIG] Loaded Firebase config:', JSON.stringify(firebaseConfig, null, 2));


// This check provides a clear error message if the configuration is missing.
if (!firebaseConfig.projectId) {
  // Enhanced error logging
  console.error('[FIREBASE_CLIENT] Firebase project ID is not available. Check server logs for config details. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set and accessible.');
  throw new Error('[FIREBASE_CLIENT] Firebase project ID is not available. Set the NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.');
}

// Initialize Firebase
// Add a log to see if initialization happens multiple times
console.log(`[FIREBASE_INIT] Initializing Firebase app... (Apps running: ${getApps().length})`);
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log(`[FIREBASE_INIT] Firebase app initialized. Project ID: ${app.options.projectId}`);


const auth: Auth = getAuth(app);
auth.setPersistence(browserLocalPersistence);

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Add a log to check the initialized storage instance
try {
    const storageInstance = getStorage(app);
    console.log('[FIREBASE_STORAGE] Storage instance initialized. Bucket:', storageInstance.app.options.storageBucket);
} catch (e: any) {
    console.error('[FIREBASE_STORAGE] Error getting storage instance:', e.message);
}


export { app, auth, db, storage };
