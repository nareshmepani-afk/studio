import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const productionConfig = {
  apiKey: "AIzaSyANRmF5M5guN3PJ-IDw-3a8W3WaIvk-NJE",
  authDomain: 'memory-weaver-8rk9t.firebaseapp.com',
  projectId: 'memory-weaver-8rk9t',
  storageBucket: 'memory-weaver-8rk9t.appspot.com',
  messagingSenderId: '67296998103',
  appId: '1:67296998103:web:f48699405c37bcf4567692',
};

const stagingConfig = {
  apiKey: "AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98",
  authDomain: 'memory-weaver-dev.firebaseapp.com',
  projectId: "memory-weaver-dev",
  storageBucket: "memory-weaver-dev.firebasestorage.app",
  messagingSenderId: "98973313245",
  appId: "1:98973313245:web:bbe45fb78d08d0563c1334",
};

const getServerProjectId = () => {
  const sa = process.env.SERVICE_ACCOUNT_JSON;
  if (!sa) return null;
  try {
    const config = JSON.parse(sa);
    return config.project_id;
  } catch (e) {
    return null;
  }
};

const isStaging = (typeof window !== 'undefined' && (
  window.location.hostname === 'dev.memoryweaver.studio' ||
  window.location.hostname.includes('memory-weaver-dev') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)) || (typeof window === 'undefined' && (
  process.env.SERVICE_ACCOUNT_JSON 
    ? getServerProjectId() === 'memory-weaver-dev'
    : (process.env.NEXT_PUBLIC_BYPASS_CAPTCHA === 'true' ||
       process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'memory-weaver-dev')
));

// Function to resolve the dynamic Firebase configuration at runtime
export const getClientFirebaseConfig = () => {
  return isStaging ? stagingConfig : productionConfig;
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
