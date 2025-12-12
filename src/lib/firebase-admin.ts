
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth, adminDb;

try {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      console.log('[firebase-admin] Found service account key, attempting to initialize...');
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      });
      console.log('[firebase-admin] Initialization with service account successful.');
    } else {
      console.log('[firebase-admin] No service account key found, using default credentials...');
      initializeApp();
      console.log('[firebase-admin] Default initialization successful.');
    }
  } else {
    console.log('[firebase-admin] App already initialized.');
  }

  adminAuth = getAuth(getApp());
  adminDb = getFirestore(getApp());

} catch (error: any) {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('[firebase-admin] CRITICAL ERROR DURING INITIALIZATION:');
  console.error(`[firebase-admin] Error Type: ${error.constructor.name}`);
  console.error(`[firebase-admin] Error Message: ${error.message}`);
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 'NOT FOUND';
  console.error(`[firebase-admin] Service Account Loaded: ${serviceAccount !== 'NOT FOUND'}`);
  if (serviceAccount !== 'NOT FOUND') {
    console.error(`[firebase-admin] Service Account Snippet: ${serviceAccount.substring(0, 30)}...${serviceAccount.substring(serviceAccount.length - 30)}`);
  }
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  // We are not re-throwing the error here. Instead, we'll export null values.
  // This will cause a more informative error downstream where the db is used.
  adminAuth = null;
  adminDb = null;
}

export { adminAuth, adminDb };
