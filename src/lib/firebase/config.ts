import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const getDynamicAuthDomain = (defaultDomain: string) => {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('memoryweaver.studio')) {
    return window.location.hostname;
  }
  return defaultDomain;
};

const productionConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'app.memoryweaver.studio',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const stagingConfig = {
  apiKey: "AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98",
  authDomain: 'admin.memoryweaver.studio',
  projectId: "memory-weaver-dev",
  storageBucket: "memory-weaver-dev.firebasestorage.app",
  messagingSenderId: "98973313245",
  appId: "1:98973313245:web:bbe45fb78d08d0563c1334",
};

const isStaging = (typeof window !== 'undefined' && (
  window.location.hostname === 'dev.memoryweaver.studio' ||
  window.location.hostname.includes('memory-weaver-dev') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)) || (
  process.env.NEXT_PUBLIC_BYPASS_CAPTCHA === 'true' ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'memory-weaver-dev'
);

// Function to resolve the dynamic Firebase configuration at runtime
export const getClientFirebaseConfig = () => {
  const baseConfig = isStaging ? stagingConfig : productionConfig;
  
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('memoryweaver.studio')) {
    return {
      ...baseConfig,
      authDomain: window.location.hostname
    };
  }
  return baseConfig;
};

let internalApp: FirebaseApp;
let internalAuth: Auth;
let internalDb: Firestore;
let internalStorage: FirebaseStorage;

try {
  const activeConfig = getClientFirebaseConfig();
  internalApp = getApps().length ? getApp() : initializeApp(activeConfig);
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
