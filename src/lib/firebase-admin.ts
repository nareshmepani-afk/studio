// lib/firebase-admin.ts
import admin from 'firebase-admin';

export function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const serviceAccount = process.env.SERVICE_ACCOUNT_JSON 
    ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON) 
    : null;

  if (!serviceAccount) {
    console.error("❌ SERVICE_ACCOUNT_JSON is missing!");
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
