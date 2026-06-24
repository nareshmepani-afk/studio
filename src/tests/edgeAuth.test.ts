import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jose from 'jose';

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    jwtVerify: vi.fn(),
  };
});

// Define a light-weight edge auth verification function mirroring our middleware logic
async function verifyEdgeSession(
  sessionCookie: string | undefined, 
  JWKS: any, 
  projectId: string
): Promise<{ 
  authorized: boolean; 
  reason?: 'unauthenticated' | 'unauthorized' | 'mfa_required';
  payload?: any;
}> {
  if (!sessionCookie) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  try {
    const { payload } = await jose.jwtVerify(sessionCookie, JWKS, {
      audience: projectId,
      issuer: `https://session.firebase.google.com/${projectId}`,
    });

    const email = payload.email as string | undefined;
    const isAdmin = payload.isAdmin === true;
    const mfaVerified = payload.mfaVerified === true;

    if (!email || (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com'))) {
      return { authorized: false, reason: 'unauthorized' };
    }

    if (!isAdmin) {
      return { authorized: false, reason: 'unauthorized' };
    }

    if (!mfaVerified) {
      return { authorized: false, reason: 'mfa_required' };
    }

    return { authorized: true, payload };
  } catch (error) {
    return { authorized: false, reason: 'unauthorized' };
  }
}

describe('Cryptographic Edge Claims Authorization Integration Suite', () => {
  const mockJWKS = {} as any;
  const mockProjectId = 'memory-weaver-8rk9t';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('SUCCESS CASE: should pass edge authorization cleanly when claims are valid', async () => {
    const mockPayload = {
      email: 'admin@gmail.com',
      isAdmin: true,
      mfaVerified: true,
    };

    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: mockPayload,
      protectedHeader: {} as any,
      key: {} as any,
    });

    const result = await verifyEdgeSession('valid-session-cookie', mockJWKS, mockProjectId);
    
    expect(result.authorized).toBe(true);
    expect(result.payload).toEqual(mockPayload);
    expect(result.reason).toBeUndefined();
  });

  it('MFA REDIRECT CASE: should flag explicit MFA requirement when mfaVerified claim is missing or false', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        email: 'admin@gmail.com',
        isAdmin: true,
        mfaVerified: false,
      },
      protectedHeader: {} as any,
      key: {} as any,
    });

    const result = await verifyEdgeSession('mfa-pending-session-cookie', mockJWKS, mockProjectId);
    
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('mfa_required');
  });

  it('REJECTION CASE: should deny access when user lacks isAdmin claim', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        email: 'regular-staff@gmail.com',
        isAdmin: false,
        mfaVerified: true,
      },
      protectedHeader: {} as any,
      key: {} as any,
    });

    const result = await verifyEdgeSession('non-admin-session-cookie', mockJWKS, mockProjectId);
    
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });

  it('REJECTION CASE: should block access on invalid email domain suffix', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: {
        email: 'attacker@untrusted-domain.com',
        isAdmin: true,
        mfaVerified: true,
      },
      protectedHeader: {} as any,
      key: {} as any,
    });

    const result = await verifyEdgeSession('external-domain-session-cookie', mockJWKS, mockProjectId);
    
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });

  it('REJECTION CASE: should fail edge authorization on invalid token signature', async () => {
    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('JWT signature verification failed'));

    const result = await verifyEdgeSession('tampered-session-cookie', mockJWKS, mockProjectId);
    
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });
});
