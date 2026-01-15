// lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig, validateConfig } from "./config-schema";

let internalApp: FirebaseApp;
let internalAuth: Auth;
let internalDb: Firestore;
let internalStorage: FirebaseStorage;

// Immediately validate the configuration. This is a critical step.
const isConfigValid = validateConfig();

if (!isConfigValid) {
  // If the config is invalid, we must stop execution immediately.
  console.error("CRITICAL: Firebase config validation failed. See console logs for details. Application cannot start.");
  throw new Error("Firebase configuration is invalid. Halting application initialization.");
}

try {
  // If config is valid, proceed with initialization.
  internalApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  internalAuth = getAuth(internalApp);
  internalDb = getFirestore(internalApp);
  internalStorage = getStorage(internalApp);
} catch (error) {
    console.error("Failed to initialize Firebase services:", error);
    // Re-throw to ensure the app doesn't continue in a partially-initialized state.
    throw new Error("Firebase services could not be initialized. Check the browser console for the root cause.");
}

// Export explicitly non-nullable constants for a strict type contract.
export const app = internalApp;
export const auth = internalAuth;
export const db = internalDb;
export const storage = internalStorage;
