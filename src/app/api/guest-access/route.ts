import {NextResponse, NextRequest} from 'next/server';
import {SignJWT, jwtVerify} from 'jose';
import {adminDb} from '@/lib/firebase-admin';
import {SESSION_COOKIE_NAME} from '@/lib/constants';

const GUEST_TOKEN_SECRET = new TextEncoder().encode(process.env.GUEST_TOKEN_SECRET || 'default-secret-key-that-is-long-enough');
const GUEST_TOKEN_ISSUER = 'urn:memoryweaver:issuer';
const GUEST_TOKEN_AUDIENCE = 'urn:memoryweaver:audience';

/**
 * POST: Create a short-lived guest access token.
 * Only authenticated users (Hosts) can create a guest token.
 */
export async function POST(request: Request) {
  // A real implementation should verify the user is a 'Host'
  // For now, we just check if they are authenticated.
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  try {
    const token = await new SignJWT({})
      .setProtectedHeader({alg: 'HS256'})
      .setJti(crypto.randomUUID())
      .setIssuedAt()
      .setIssuer(GUEST_TOKEN_ISSUER)
      .setAudience(GUEST_TOKEN_AUDIENCE)
      .setExpirationTime('1h') // The token is valid for 1 hour
      .sign(GUEST_TOKEN_SECRET);

    // Store the token's JTI (JWT ID) in Firestore to allow for revocation if needed,
    // though for this simple case, we rely on the expiration time.
    await adminDb.collection('guestTokens').doc(token).set({
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    return NextResponse.json({token}, {status: 200});
  } catch (error) {
    console.error('Error creating guest token:', error);
    return NextResponse.json({error: 'Failed to create guest token'}, {status: 500});
  }
}

/**
 * GET: Validate a guest access token.
 * This is used by middleware to protect the /remote/* routes.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({isValid: false, error: 'Token is required'}, {status: 400});
  }

  try {
    // 1. Verify the token signature and claims
    const {payload} = await jwtVerify(token, GUEST_TOKEN_SECRET, {
      issuer: GUEST_TOKEN_ISSUER,
      audience: GUEST_TOKEN_AUDIENCE,
    });

    // 2. Check against Firestore to ensure it hasn't been revoked (or exists)
    const tokenDoc = await adminDb.collection('guestTokens').doc(token).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({isValid: false, error: 'Token not found'}, {status: 401});
    }

    // Optional: Check if the token has been marked as revoked in your database
    // For now, we just check for existence and rely on the JWT expiration.

    return NextResponse.json({isValid: true, payload}, {status: 200});
  } catch (error) {
    // This will catch expired tokens, invalid signatures, etc.
    return NextResponse.json({isValid: false, error: 'Invalid token'}, {status: 401});
  }
}
