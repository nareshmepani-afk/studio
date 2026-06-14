import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let internalApp: FirebaseApp;
let internalAuth: Auth;
let internalDb: Firestore;
let internalStorage: FirebaseStorage;

try {
  internalApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  internalAuth = getAuth(internalApp);
  internalDb = getFirestore(internalApp);
  internalStorage = getStorage(internalApp);
} catch (error) {
  console.error("Failed to initialize Firebase services:", error);
  throw new Error("Firebase services could not be initialized.");
}

export const app = internalApp;
export const auth = internalAuth;
export const db = internalDb;
export const storage = internalStorage;
