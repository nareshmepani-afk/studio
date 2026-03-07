import { cookies } from "next/headers";
import { adminAuth } from '@/lib/firebase-admin';

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

  const sessionCookie = cookieStore.get("firebase-session")?.value;

  if (!sessionCookie) {
    console.log("TESTIMONY: getSession: 'firebase-session' cookie not found.");
    return null;
  }

  console.log("TESTIMONY: getSession: 'firebase-session' cookie found. Proceeding to verification.");

  try {
    const decodedToken = await getAuthenticatedUser(sessionCookie);
    console.log("TESTIMONY: getSession: Session successfully verified for UID:", decodedToken.uid);
    return decodedToken;
  } catch (error: any) {
    console.error("TESTIMONY: getSession: Session verification failed with error:", error);
    // If Firebase says the token is expired or invalid, clear the cookie
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
      console.log("TESTIMONY: getSession: Session cookie is expired. Deleting cookie.");
      cookieStore.delete("firebase-session");
    }
    return null;
  }
}

export async function setSessionCookie(sessionCookie: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set("firebase-session", sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set("firebase-session", "", { expires: new Date(0) });
}
