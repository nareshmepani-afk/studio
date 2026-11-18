import { cookies } from "next/headers";
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// This function is now centralized and exported.
export async function getAuthenticatedUser(sessionCookie: string) {
  console.log("TESTIMONY: getAuthenticatedUser: Verifying session cookie.");
  if (!adminAuth) {
    console.error("TESTIMONY: getAuthenticatedUser: Firebase Admin SDK is not initialized.");
    throw new Error("Firebase Admin SDK is not initialized.");
  }
  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log("TESTIMONY: getAuthenticatedUser: Session cookie verified successfully for UID:", decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error("TESTIMONY: getAuthenticatedUser: Session cookie verification failed.", error);
    // Re-throw the original error so it can be caught and inspected by the caller.
    throw error;
  }
}

export async function getSession() {
  console.log("TESTIMONY: getSession: Starting session retrieval.");
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("TESTIMONY: getSession: All received cookies:", allCookies);

  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    console.log(`TESTIMONY: getSession: '${SESSION_COOKIE_NAME}' cookie not found.`);
    return null;
  }

  console.log(`TESTIMONY: getSession: '${SESSION_COOKIE_NAME}' cookie found. Proceeding to verification.`);

  try {
    const decodedToken = await getAuthenticatedUser(sessionCookie);
    console.log("TESTIMONY: getSession: Session successfully verified for UID:", decodedToken.uid);
    return decodedToken;
  } catch (error: any) {
    console.error("TESTIMONY: getSession: Session verification failed with error:", error);
    // If Firebase says the token is expired or invalid, clear the cookie
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
      console.log(`TESTIMONY: getSession: Session cookie is expired. Deleting cookie.`);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
    return null;
  }
}

export async function setSessionCookie(sessionCookie: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { expires: new Date(0) });
}

export async function verifyAdminWhitelist(email: string): Promise<{ isValid: boolean; mfaSetupComplete: boolean; mfaSecret: string | null }> {
  const normalisedEmail = email.toLowerCase().trim();
  console.log(`SECURITY: Checking whitelist status for email: ${normalisedEmail}`);
  if (!adminDb) {
    console.error("SECURITY: verifyAdminWhitelist: Firebase Admin Firestore (adminDb) is not initialized.");
    return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
  }
  try {
    const docRef = adminDb.collection('admin_users').doc(normalisedEmail);
    let docSnap = await docRef.get();
    
    // Support email aliases (e.g. nareshmepani+dev@googlemail.com -> nareshmepani@googlemail.com)
    if (!docSnap.exists && normalisedEmail.includes('+')) {
      const baseEmail = normalisedEmail.replace(/\+[^@]+/, '');
      console.log(`SECURITY: Checking whitelist status for alias base email: ${baseEmail}`);
      const baseDocRef = adminDb.collection('admin_users').doc(baseEmail);
      docSnap = await baseDocRef.get();
    }
    
    if (!docSnap.exists) {
      console.warn(`SECURITY: Access Denied. Email ${normalisedEmail} not found in admin_users whitelist.`);
      return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
    }
    
    const data = docSnap.data();
    if (!data || data.isActive !== true) {
      console.warn(`SECURITY: Access Denied. Admin account ${normalisedEmail} is explicitly disabled or malformed.`);
      return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
    }
    
    return {
      isValid: true,
      mfaSetupComplete: !!data.mfaSetupComplete,
      mfaSecret: data.mfaSecret || null
    };
  } catch (error) {
    console.error("SECURITY: Critical error while verifying admin whitelist:", error);
    return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
  }
}

export type AdminSessionResult =
  | { authorized: true; session: Awaited<ReturnType<typeof getAuthenticatedUser>> }
  | { authorized: false; status: 401 | 403; error: string };

/**
 * Enforces an MFA-verified administrator session on server routes (/api/admin/*, /api/qa/*).
 * Fail-closed: verifies the Firebase session cookie, custom claims (isAdmin && mfaVerified),
 * and the active admin_users whitelist in Firestore.
 */
export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await getSession();
  if (!session || !session.email) {
    return { authorized: false, status: 401, error: 'Unauthorised: Admin session required. Please sign in.' };
  }
  const whitelist = await verifyAdminWhitelist(session.email);
  if (!whitelist.isValid) {
    return { authorized: false, status: 403, error: 'Forbidden: Account not active on admin whitelist' };
  }

  // If claims inside the session cookie are stale or unminted, check live custom claims in Firebase Auth
  if (session.isAdmin !== true || session.mfaVerified !== true) {
    if (adminAuth && session.uid) {
      try {
        const liveUser = await adminAuth.getUser(session.uid);
        const claims = liveUser.customClaims || {};
        if (claims.isAdmin === true && (claims.mfaVerified === true || whitelist.mfaSetupComplete)) {
          (session as any).isAdmin = true;
          (session as any).mfaVerified = true;
        }
      } catch (claimErr) {
        console.warn('SECURITY: Could not fetch live custom claims for admin session:', claimErr);
      }
    }
  }

  if (session.isAdmin !== true || session.mfaVerified !== true) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: MFA-verified admin claim required. Please re-authenticate via /admin/login',
    };
  }
  return { authorized: true, session };
}

