'use server';

import { adminDb, adminAuth, adminApp } from '@/lib/firebase-admin';
import { UserJourneySnapshot } from '@/types/adminCrm';
import { cookies } from 'next/headers';
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

/**
 * Helper to verify that the calling user is an authorized Administrator.
 */
async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return false;
    const projectId = adminApp?.options?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'memory-weaver-8rk9t';
    const header = jose.decodeProtectedHeader(sessionCookie);
    if (!header.kid) return false;

    const publicKey = await getPublicKey(header.kid);
    const { payload } = await jose.jwtVerify(sessionCookie, publicKey, {
      audience: projectId,
      issuer: `https://session.firebase.google.com/${projectId}`,
    });

    // Check custom claims for admin privileges
    return !!payload.admin;
  } catch (error) {
    console.error('[CRM Auth verification failed]:', error);
    return false;
  }
}

/**
 * Fetch all compiled user journeys with pagination and pull-based caching metrics.
 */
export async function getUserJourneys(): Promise<{ success: boolean; data?: UserJourneySnapshot[]; error?: string }> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required' };
  }

  if (!adminDb) {
    return { success: false, error: 'Database connection offline' };
  }

  try {
    const snapshot = await adminDb.collection('user_journeys')
      .orderBy('lastActive', 'desc')
      .limit(50)
      .get();

    const journeys: UserJourneySnapshot[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const timeline = data.timeline || [];
      const stats = data.stats || {};
      
      return {
        userId: doc.id,
        userEmail: data.email || 'anonymous@studio.com',
        userTier: data.userTier || 'Standard',
        activeSession: {
          currentStep: data.currentStep || 'idle',
          currentInviteId: data.currentInviteId || '',
          lastHeartbeat: data.lastActive ? Math.floor(data.lastActive.toDate().getTime() / 1000) : 0,
        },
        storageMetrics: {
          totalBytesUsed: stats.totalBytesUsed || 0,
          reelsCompiledCount: stats.reelsCompiledCount || timeline.filter((e: any) => e.eventAction === 'stitch_started').length,
        }
      };
    });

    return { success: true, data: journeys };
  } catch (error: any) {
    console.error('[CRM Actions Error]: Fetching user journeys failed:', error);
    return { success: false, error: error.message || 'Internal server error' };
  }
}
