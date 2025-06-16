
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing essential configuration values
const essentialConfigKeys = ['apiKey', 'authDomain', 'projectId'];
const missingConfigs = essentialConfigKeys.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingConfigs.length > 0) {
  console.error(
    `FIREBASE CONFIGURATION ERROR: The following essential Firebase configuration values are missing or undefined: ${missingConfigs.join(', ')}. ` +
    "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file. " +
    "If you've recently updated the .env file, you MUST RESTART your Next.js development server (e.g., stop and re-run 'npm run dev') for the changes to take effect."
  );
  // It's often good to throw an error here to stop further execution if config is critically missing
  // For now, allowing Firebase to throw its own more specific error after this log.
}

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Re-throw or handle as appropriate for your app's error strategy
    // This helps ensure the app doesn't proceed with a broken Firebase instance.
    throw new Error(`Firebase initialization failed. Original error: ${(e as Error).message}`);
  }
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

