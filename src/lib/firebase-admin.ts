// lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;

if (admin.apps.length === 0) {
  const serviceAccount = process.env.SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
    : null;

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.error("SERVICE_ACCOUNT_JSON is missing! Firebase Admin SDK could not be initialized.");
  }
} else {
  app = admin.apps[0];
}

const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;

export { adminAuth, adminDb };
