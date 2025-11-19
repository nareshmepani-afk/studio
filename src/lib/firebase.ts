
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics as Crashlytics } from 'firebase/analytics';

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
const auth: Auth = getAuth(app);
auth.setPersistence(browserLocalPersistence);

// Use getFirestore to ensure a single instance
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Initialize Crashlytics (via Analytics)
let crashlytics: Crashlytics | null = null;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CRASHLYTICS_ENABLED === 'true') {
    try {
        crashlytics = getAnalytics(app);
    } catch (e) {
        console.error("Failed to initialize Firebase Analytics/Crashlytics", e);
    }
}


export { app, auth, db, storage, crashlytics };
