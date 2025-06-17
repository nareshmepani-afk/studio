
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Added

console.log("Attempting to load Firebase config from environment variables...");
console.log("Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID from process.env:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID); // Explicit log for project ID

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config object constructed:", firebaseConfig);

// Check for missing essential configuration values
const essentialConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket']; // Added storageBucket
const missingConfigs = essentialConfigKeys.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingConfigs.length > 0) {
  console.error(
    `FIREBASE CONFIGURATION ERROR: The following essential Firebase configuration values are missing or undefined in .env: ${missingConfigs.join(', ')}. ` +
    "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file. " +
    "If you've recently updated the .env file, you MUST RESTART your Next.js development server for the changes to take effect."
  );
  // Consider not throwing here to allow more logs to appear, but the app will likely fail.
} else {
  console.log("All essential Firebase config keys seem to be present in the constructed config object.");
}

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  console.log("No Firebase apps initialized yet. Calling initializeApp().");
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully with name:", app.name, "and project ID from app options:", app.options.projectId);
  } catch (e) {
    console.error("Firebase initializeApp() FAILED:", e);
    // It's crucial to rethrow or handle this, as the app cannot function without Firebase.
    throw new Error(`Firebase initialization failed. Original error: ${(e as Error).message}`);
  }
} else {
  console.log("Firebase app already exists. Calling getApp().");
  app = getApp();
  console.log("Existing Firebase app retrieved:", app.name, "and project ID from app options:", app.options.projectId);
}

let authInstance;
let dbInstance;
let storageInstance; // Added

try {
  console.log("Attempting to get Auth instance...");
  authInstance = getAuth(app);
  console.log("Auth instance retrieved successfully.");
} catch (e) {
  console.error("Failed to get Auth instance:", e);
  throw new Error(`Failed to initialize Firebase Auth. Original error: ${(e as Error).message}`);
}

try {
  console.log("Attempting to get Firestore instance...");
  dbInstance = getFirestore(app);
  console.log("Firestore instance retrieved successfully.");
} catch (e) {
  console.error("Failed to get Firestore instance:", e);
  throw new Error(`Failed to initialize Firebase Firestore. Original error: ${(e as Error).message}`);
}

try {
  console.log("Attempting to get Storage instance...");
  storageInstance = getStorage(app); // Added
  console.log("Storage instance retrieved successfully.");
} catch (e) {
  console.error("Failed to get Storage instance:", e); // Added
  throw new Error(`Failed to initialize Firebase Storage. Original error: ${(e as Error).message}`); // Added
}


export { app, authInstance as auth, dbInstance as db, storageInstance as storage }; // Added storage
