import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON as string);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firestore = admin.firestore();
