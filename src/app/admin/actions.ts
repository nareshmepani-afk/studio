'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyAdminWhitelist, getSession } from '@/lib/session';
import { verifyTotp, generateBase32Secret } from '@/utils/totp';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function verifyAdminCredentials(googleIdToken: string, totpToken?: string) {
  try {
    if (!adminAuth) {
      console.error('SECURITY: Firebase Admin SDK is not initialized.');
      return { success: false, reason: 'SERVER_ERROR', message: 'Firebase Admin SDK is not initialized.' };
    }
    
    const decodedToken = await adminAuth.verifyIdToken(googleIdToken);
    const email = decodedToken.email;
    
    if (!email) {
      return { success: false, reason: 'INVALID_TOKEN', message: 'No authenticated email address found.' };
    }
    
    const whitelistStatus = await verifyAdminWhitelist(email);
    if (!whitelistStatus.isValid) {
      return { success: false, reason: 'NOT_AUTHORIZED', message: 'Access Denied. Identity not whitelisted.' };
    }
    
    let mfaVerified = false;
    if (whitelistStatus.mfaSecret) {
      if (!totpToken) {
        return { success: true, requiresMfa: true, mfaSetupRequired: !whitelistStatus.mfaSetupComplete, email };
      }
      
      const isValidTotp = verifyTotp(whitelistStatus.mfaSecret, totpToken);
      if (!isValidTotp) {
        return { success: false, reason: 'INVALID_MFA', message: 'Invalid Google Authenticator code.' };
      }
      mfaVerified = true;
    } else {
      mfaVerified = false; // No MFA secret set up yet, user needs to enroll
    }
    
    // Set custom user claims in Firebase Auth database
    await adminAuth.setCustomUserClaims(decodedToken.uid, {
      isAdmin: true,
      mfaVerified
    });

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(googleIdToken, { expiresIn });
    
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5 // 5 days
    });
    
    return { success: true, requiresMfa: false, uid: decodedToken.uid, email };
  } catch (error) {
    console.error('SECURITY: Server-side admin verification failed:', error);
    return { success: false, reason: 'SERVER_ERROR', message: 'Internal security gateway transaction failure.' };
  }
}

export async function generateMfaSetupDetails() {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, message: 'Unauthorized session.' };
    }

    const email = session.email;
    const secret = generateBase32Secret();
    const otpauthUri = `otpauth://totp/MemoryWeaver:${email}?secret=${secret}&issuer=MemoryWeaver`;

    return { success: true, secret, otpauthUri, email };
  } catch (error) {
    console.error('SECURITY: Failed to generate MFA setup details:', error);
    return { success: false, message: 'Failed to initialize MFA parameters.' };
  }
}

export async function verifyAndEnrollMfa(secret: string, token: string) {
  try {
    const session = await getSession();
    if (!session || !session.email || !session.uid) {
      return { success: false, message: 'Unauthorized session.' };
    }

    const email = session.email;
    const isValid = verifyTotp(secret, token);

    if (!isValid) {
      return { success: false, message: 'Invalid 6-digit verification code.' };
    }

    if (!adminDb || !adminAuth) {
      return { success: false, message: 'Database services offline.' };
    }

    // Set updated claims on user record in auth database
    await adminAuth.setCustomUserClaims(session.uid, {
      isAdmin: true,
      mfaVerified: true
    });

    await adminDb.collection('admin_users').doc(email.toLowerCase()).update({
      mfaSecret: secret,
      mfaSetupComplete: true,
    });

    return { success: true };
  } catch (error: any) {
    console.error('SECURITY: MFA enrollment transaction failed:', error);
    return { success: false, message: error.message || 'MFA validation transaction failure.' };
  }
}

export async function refreshAdminSessionCookie(googleIdToken: string) {
  try {
    if (!adminAuth) {
      return { success: false, message: 'Admin Auth offline.' };
    }
    const decodedToken = await adminAuth.verifyIdToken(googleIdToken);
    const email = decodedToken.email;
    if (!email) {
      return { success: false, message: 'No email found in token.' };
    }
    const whitelistStatus = await verifyAdminWhitelist(email);
    if (!whitelistStatus.isValid) {
      return { success: false, message: 'Not authorized on whitelist.' };
    }
    
    await adminAuth.setCustomUserClaims(decodedToken.uid, {
      isAdmin: true,
      mfaVerified: whitelistStatus.mfaSetupComplete
    });

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(googleIdToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5
    });

    return { success: true };
  } catch (error) {
    console.error('SECURITY: Failed to refresh session cookie:', error);
    return { success: false, message: 'Failed to refresh secure cookie context.' };
  }
}

export async function listAdminUsers() {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, message: 'Unauthorized session.' };
    }

    const authCheck = await verifyAdminWhitelist(session.email);
    if (!authCheck.isValid) {
      return { success: false, message: 'Access denied.' };
    }

    if (!adminDb) {
      return { success: false, message: 'Database service offline.' };
    }

    const snapshot = await adminDb.collection('admin_users').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: doc.id,
        isActive: !!data.isActive,
        mfaSetupComplete: !!data.mfaSetupComplete,
      };
    });

    return { success: true, users };
  } catch (error: any) {
    console.error('SECURITY: Failed to list admin whitelist users:', error);
    return { success: false, message: error.message || 'MFA query gateway failure.' };
  }
}

export async function toggleAdminUserStatus(targetEmail: string) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, message: 'Unauthorized session.' };
    }

    const authCheck = await verifyAdminWhitelist(session.email);
    if (!authCheck.isValid) {
      return { success: false, message: 'Access denied.' };
    }

    if (!adminDb) {
      return { success: false, message: 'Database service offline.' };
    }

    const docRef = adminDb.collection('admin_users').doc(targetEmail.toLowerCase());
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, message: 'Admin user not found.' };
    }

    const data = docSnap.data();
    const newStatus = !data?.isActive;

    await docRef.update({
      isActive: newStatus,
    });

    return { success: true };
  } catch (error: any) {
    console.error('SECURITY: Failed to toggle admin user status:', error);
    return { success: false, message: error.message || 'MFA toggle transaction failure.' };
  }
}

export async function inviteAdminUser(newEmail: string) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, message: 'Unauthorized session.' };
    }

    const authCheck = await verifyAdminWhitelist(session.email);
    if (!authCheck.isValid) {
      return { success: false, message: 'Access denied.' };
    }

    const emailToInvite = newEmail.trim().toLowerCase();
    if (!emailToInvite.endsWith('@gmail.com') && !emailToInvite.endsWith('@googlemail.com')) {
      return { success: false, message: 'Only Google Workspace accounts (@gmail.com / @googlemail.com) are whitelisted.' };
    }

    if (!adminDb) {
      return { success: false, message: 'Database service offline.' };
    }

    const docRef = adminDb.collection('admin_users').doc(emailToInvite);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { success: false, message: 'User is already invited or whitelisted.' };
    }

    await docRef.set({
      isActive: true,
      mfaSetupComplete: false,
      mfaSecret: null,
    });

    return { success: true };
  } catch (error: any) {
    console.error('SECURITY: Failed to invite admin user:', error);
    return { success: false, message: error.message || 'MFA invite transaction failure.' };
  }
}
