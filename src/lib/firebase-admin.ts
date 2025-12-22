import * as admin from 'firebase-admin';

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Important for Vercel/similar envs
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] Initialization failed:', errorMessage);
     // Throwing the error is important to stop the process if admin fails to initialize
    throw new Error(`Firebase Admin SDK initialization failed: ${errorMessage}`);
  }
} else {
  console.log('[Firebase Admin] Already initialized.');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
