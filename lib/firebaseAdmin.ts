
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

console.log('RUNTIME_TESTIMONY: firebaseAdmin module loading.');

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error('RUNTIME_TESTIMONY: SERVICE_ACCOUNT_JSON environment variable is MISSING or EMPTY at runtime.');
} else {
  console.log('RUNTIME_TESTIMONY: SERVICE_ACCOUNT_JSON environment variable is PRESENT at runtime.');
  try {
    const parsedServiceAccount = JSON.parse(serviceAccountJson);
    console.log(`RUNTIME_TESTIMONY: Successfully parsed service account JSON. Project ID: ${parsedServiceAccount.project_id}`);
  } catch (e: any) {
    console.error(`RUNTIME_TESTIMONY: FAILED to parse SERVICE_ACCOUNT_JSON at runtime. Error: ${e.message}`);
    // Log the beginning of the string to see if it looks like JSON, but not the whole thing.
    console.error(`RUNTIME_TESTIMONY: serviceAccountJson starts with: "${serviceAccountJson.substring(0, 30)}..."`);
  }
}

try {
  if (!getApps().length) {
    // The || '{}' is a fallback, but if we reach here with an empty serviceAccountJson, the error logs above should tell us.
    const credentialJson = JSON.parse(serviceAccountJson || '{}');
    
    initializeApp({
      credential: cert(credentialJson),
    });
    console.log('RUNTIME_TESTIMONY: Firebase Admin SDK initialized successfully.');
  }
} catch (error: any) {
  console.error('RUNTIME_TESTIMONY: Firebase Admin SDK initialization FAILED.', error);
}

// This will throw a detailed error if initialization failed.
export const adminAuth = getAuth();
