
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (getApps().length === 0) {
  if (serviceAccount) {
    // Use the service account key if it is available (for local development)
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  } else {
    // Otherwise, fall back to automatic credential discovery (for Firebase Hosting)
    initializeApp();
  }
}

const adminAuth = getAuth(getApp());
const adminDb = getFirestore(getApp());

export { adminAuth, adminDb };
