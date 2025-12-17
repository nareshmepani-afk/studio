
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let adminDb: Firestore;
let adminAuth: Auth;

const formatPrivateKey = (key: string) => {
  return key.replace(/\\n/g, '\n');
};

try {
  if (getApps().length > 0) {
    app = getApp();
    console.log('[FIREBASE ADMIN] Using existing app instance.');
  } else {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      console.log('[FIREBASE ADMIN] Found service account key. Parsing...');
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (e) {
        console.error('[FIREBASE ADMIN] JSON Parse failed. Checking for unescaped newlines...');
        const cleanedKey = formatPrivateKey(serviceAccountKey);
        serviceAccount = JSON.parse(cleanedKey);
      }

      if (serviceAccount.private_key) {
        serviceAccount.private_key = formatPrivateKey(serviceAccount.private_key);
      }

      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[FIREBASE ADMIN] Initialized with Service Account.');
    } else {
      console.log('[FIREBASE ADMIN] No service account found. Using default credentials.');
      app = initializeApp();
    }
  }

  adminDb = getFirestore(app);
  adminAuth = getAuth(app);
  console.log('[FIREBASE ADMIN] Firestore and Auth connected successfully.');

} catch (error: any) {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('[FIREBASE ADMIN] CRITICAL INITIALIZATION ERROR:', error.message);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  throw error; 
}

export { adminDb, adminAuth };
