// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, validateConfig } from "./config-schema";

const isConfigValid = validateConfig();

// Initialize Firebase only if config is valid and not already initialized
const app = (isConfigValid && getApps().length === 0) 
  ? initializeApp(firebaseConfig) 
  : getApps().length > 0 
    ? getApp() 
    : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export default app;
