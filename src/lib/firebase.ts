
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

console.log("Attempting to load Firebase config from environment variables...");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config object constructed. Project ID:", firebaseConfig.projectId);

// Check for missing essential configuration values
const essentialConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
const missingConfigs = essentialConfigKeys.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingConfigs.length > 0) {
  console.error(
    `FIREBASE CONFIGURATION ERROR: The following essential Firebase configuration values are missing or undefined in .env: ${missingConfigs.join(', ')}. ` +
    "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file. " +
    "If you've recently updated the .env file, you MUST RESTART your Next.js development server for the changes to take effect."
  );
}

// Singleton pattern to initialize and get Firebase services
const getFirebaseServices = () => {
  let app: FirebaseApp;
  if (!getApps().length) {
    console.log("No Firebase apps initialized yet. Calling initializeApp().");
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully. Name:", app.name, "Project ID from options:", app.options.projectId);
    } catch (e) {
      console.error("Firebase initializeApp() FAILED:", e);
      throw new Error(`Firebase initialization failed. Original error: ${(e as Error).message}`);
    }
  } else {
    console.log("Firebase app already exists. Calling getApp().");
    app = getApp();
    console.log("Existing Firebase app retrieved. Name:", app.name, "Project ID from options:", app.options.projectId);
  }

  const auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
  
  const db = getFirestore(app);
  const storage = getStorage(app);

  return { app, auth, db, storage };
};

// Export the initialized services
const { app, auth, db, storage } = getFirebaseServices();
export { app, auth, db, storage };
