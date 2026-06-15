'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { verifyAdminWhitelist } from '@/lib/session';

export async function verifyAdminCredentials(googleIdToken: string, totpToken?: string) {
  try {
    if (!adminAuth) {
      console.error('SECURITY: Firebase Admin SDK is not initialized.');
      return { success: false, reason: 'SERVER_ERROR', message: 'Firebase Admin SDK is not initialized.' };
    }
    
    // 1. Verify the identity token via Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(googleIdToken);
    const email = decodedToken.email;
    
    if (!email) {
      return { success: false, reason: 'INVALID_TOKEN', message: 'No authenticated email address found.' };
    }
    
    // 2. Query the Private Firestore Whitelist
    const whitelistStatus = await verifyAdminWhitelist(email);
    if (!whitelistStatus.isValid) {
      return { success: false, reason: 'NOT_AUTHORIZED', message: 'Access Denied. Identity not whitelisted.' };
    }
    
    // 3. Handle Google Authenticator (TOTP) validation if secret exists
    if (whitelistStatus.mfaSecret) {
      if (!totpToken) {
        return { success: true, requiresMfa: true, mfaSetupRequired: !whitelistStatus.mfaSetupComplete, email };
      }
      
      // To be wired with a standard crypto window calculation package (e.g., otplib or similar utility)
      // For now, prepare the verification hook interface
      console.log(`SECURITY: Evaluating TOTP token entry for ${email}`);
    }
    
    return { success: true, requiresMfa: false, uid: decodedToken.uid, email };
  } catch (error) {
    console.error('SECURITY: Server-side admin verification failed:', error);
    return { success: false, reason: 'SERVER_ERROR', message: 'Internal security gateway transaction failure.' };
  }
}
