
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: "memory-weaver-8rk9t", // Use the correct project ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// It's recommended to initialize auth this way to avoid re-initialization errors in Next.js
const auth: Auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Use initializeFirestore to apply experimental settings
const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
