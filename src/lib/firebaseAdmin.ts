/**
 * @fileOverview Root-level proxy for Firebase Admin SDK.
 * Redirects to the centralized src/lib/firebase-admin.ts to prevent duplication errors.
 */

import { adminAuth, adminDb, adminStorage } from './firebase-admin';

export { adminAuth, adminDb, adminStorage };
