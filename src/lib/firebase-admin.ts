
import * as admin from 'firebase-admin';

// The service account key is imported directly from the JSON file
// in the project root. The path has been corrected to be a standard
// relative path that works correctly during the Next.js build process.
import serviceAccount from '../../../serviceAccountKey.json';

if (!admin.apps.length) {
  try {
    // The service account object from the JSON file needs to be cast to the
    // type the Admin SDK expects. The property names also need to match.
    // The JSON file uses 'private_key' and 'client_email', but the SDK
    // expects 'privateKey' and 'clientEmail'.
    const credential = admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      // The private key also needs its newlines correctly formatted.
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    });

    admin.initializeApp({ credential });

    console.log('[Firebase Admin] Initialized successfully using serviceAccountKey.json.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] CRITICAL: Initialization from service account file failed:', errorMessage);
    // Re-throw the error to ensure the server process stops if initialization fails.
    throw new Error(`Firebase Admin SDK initialization failed: ${errorMessage}`);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
