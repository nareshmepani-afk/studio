import * as jose from 'jose';

let cachedKeys: Record<string, string> | null = null;
let cachedKeysExpiry = 0;

async function getPublicKey(kid: string): Promise<any> {
  const now = Date.now();
  if (!cachedKeys || now > cachedKeysExpiry) {
    const res = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys');
    if (!res.ok) {
      throw new Error('Failed to fetch public keys');
    }
    cachedKeys = await res.json() as Record<string, string>;
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 21600;
    cachedKeysExpiry = now + maxAgeSeconds * 1000;
  }
  const cert = cachedKeys?.[kid];
  if (!cert) {
    throw new Error(`Certificate not found for kid: ${kid}`);
  }
  return await jose.importX509(cert, 'RS256');
}
import { adminDb, adminApp } from '@/lib/firebase-admin';

export async function verifyAuthToken(token: string) {
  const projectId = adminApp?.options?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'memory-weaver-8rk9t';
  const header = jose.decodeProtectedHeader(token);
  if (!header.kid) {
    throw new Error('Missing kid in token header');
  }
  const publicKey = await getPublicKey(header.kid);
  
  const { payload } = await jose.jwtVerify(token, publicKey, {
    audience: projectId,
  });
  
  if (
    payload.iss !== `https://securetoken.google.com/${projectId}` &&
    payload.iss !== `https://session.firebase.google.com/${projectId}`
  ) {
    throw new Error('Invalid token issuer');
  }
  
  return {
    uid: payload.sub || (payload.user_id as string),
    email: payload.email as string | undefined,
  };
}
