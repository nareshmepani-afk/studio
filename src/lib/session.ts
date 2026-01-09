import { cookies } from "next/headers";
import { adminAuth } from '@/lib/firebase-admin';

// This function is now centralized here.
async function getAuthenticatedUser(sessionCookie: string) {
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
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("firebase-session")?.value;

  if (!sessionCookie) return null;

  try {
    // We use the centralized verifier function
    const decodedToken = await getAuthenticatedUser(sessionCookie);
    return decodedToken;
  } catch (error: any) {
    console.error("Session verification failed:", error.code);
    // If Firebase says the token is expired or invalid, clear the cookie
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
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
    sameSite: "lax",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("firebase-session");
}
