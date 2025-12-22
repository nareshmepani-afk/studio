
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// --- The Final, Correct Fix ---
// The application was failing to build because Next.js/Webpack cannot use an 'import'
// statement to load a JSON file from outside the 'src' directory.
//
// The correct solution is to read the file directly from the file system at runtime
// using Node.js's built-in 'fs' and 'path' modules. This is a robust method
// for server-side code.

if (!admin.apps.length) {
  try {
    // 1. Construct the absolute path to the service account file.
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

    // 2. Read the file's contents.
    const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');

    // 3. Parse the string as JSON.
    const serviceAccount = JSON.parse(serviceAccountString);

    // 4. Initialize the Firebase Admin SDK with the parsed credentials.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        // The private key's newlines must be correctly formatted.
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });

    console.log('[Firebase Admin] Initialized successfully using file system read.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Firebase Admin] CRITICAL: Initialization failed:', errorMessage);
    throw new Error(`Firebase Admin SDK initialization failed: ${errorMessage}`);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
