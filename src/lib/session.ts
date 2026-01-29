import { cookies } from "next/headers";
import { adminAuth } from '@/lib/firebase-admin';

// This function is now centralized and exported.
export async function getAuthenticatedUser(sessionCookie: string) {
  if (!adminAuth) {
    throw new Error("Firebase Admin SDK is not initialized.");
  }
  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    // Re-throw the original error so it can be caught and inspected by the caller.
    throw error;
  }
}

export async function getSession() {
  console.log("getSession: Attempting to retrieve session...");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("firebase-session")?.value;

  if (!sessionCookie) {
    console.log("getSession: No 'firebase-session' cookie found.");
    return null;
  }

  console.log("getSession: Found 'firebase-session' cookie. Verifying...");

  try {
    const decodedToken = await getAuthenticatedUser(sessionCookie);
    console.log("getSession: Session verification successful. UID:", decodedToken.uid);
    return decodedToken;
  } catch (error: any) {
    console.error("getSession: Session verification failed. Full error:", error);
    // If Firebase says the token is expired or invalid, clear the cookie
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
      console.log("getSession: Session cookie expired. Deleting cookie.");
      cookieStore.delete("firebase-session");
    }
    return null;
  }
}

export async function setSessionCookie(sessionCookie: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set("firebase-session", sessionCookie, {
    maxAge: expiresIn,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set("firebase-session", "", { expires: new Date(0) });
}
