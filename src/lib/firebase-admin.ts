
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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
  }
} catch (error: any) {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('[firebase-admin] CRITICAL ERROR DURING INITIALIZATION:');
  console.error(`[firebase-admin] Error Message: ${error.message}`);
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 'NOT FOUND';
  console.error(`[firebase-admin] Service Account (start): ${serviceAccount.substring(0, 50)}...`);
  console.error(`[firebase-admin] Service Account (end): ...${serviceAccount.substring(serviceAccount.length - 50)}`);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  throw error;
}

const adminAuth = getAuth(getApp());
const adminDb = getFirestore(getApp());

export { adminAuth, adminDb };
