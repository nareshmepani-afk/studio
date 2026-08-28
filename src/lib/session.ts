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
  console.log(`SECURITY: Checking whitelist status for email: ${email}`);
  if (!adminDb) {
    console.error("SECURITY: verifyAdminWhitelist: Firebase Admin Firestore (adminDb) is not initialized.");
    return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
  }
  try {
    const docRef = adminDb.collection('admin_users').doc(email.toLowerCase());
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      console.warn(`SECURITY: Access Denied. Email ${email} not found in admin_users whitelist.`);
      return { isValid: false, mfaSetupComplete: false, mfaSecret: null };
    }
    
    const data = docSnap.data();
    if (!data || data.isActive !== true) {
      console.warn(`SECURITY: Access Denied. Admin account ${email} is explicitly disabled or malformed.`);
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

