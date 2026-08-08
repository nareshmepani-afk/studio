import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from './lib/constants';
import { serverLog } from './utils/telemetry/serverLogger';

const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET || '');

const getProjectId = () => {
  try {
    const sa = process.env.SERVICE_ACCOUNT_JSON;
    if (sa) {
      const parsed = JSON.parse(sa);
      if (parsed.project_id) return parsed.project_id;
    }
  } catch (e) {}
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'memory-weaver-8rk9t';
};

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
    const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 21600; // 6 hours default
    cachedKeysExpiry = now + maxAgeSeconds * 1000;
  }
  const cert = cachedKeys?.[kid];
  if (!cert) {
    throw new Error(`Certificate not found for kid: ${kid}`);
  }
  return await jose.importX509(cert, 'RS256');
}

const PROTECTED_ROUTES = [
  '/dashboard', 
  '/add-memory', 
  '/settings', 
  '/requests', 
  '/create', 
  '/studio', 
  '/review'
];

async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.error("[EDGE DEBUG] SERVICE_ACCOUNT_JSON environment variable missing");
      return null;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256');
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/datastore'
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(privateKey);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[EDGE DEBUG] OAuth token request failed:", errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (error) {
    console.error("[EDGE DEBUG] Error signing OAuth JWT:", error);
    return null;
  }
}

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (record.count >= 100) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Anti-Bot Edge Rate Limiting (100 req/min per IP)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return new NextResponse('Too Many Requests - Anti-Bot Rate Limit Exceeded', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }
  
  const requestHeaders = new Headers(request.headers);
  let traceId = requestHeaders.get('x-trace-id');
  if (!traceId) {
    traceId = `trc_${crypto.randomUUID().replace(/-/g, '')}`;
    requestHeaders.set('x-trace-id', traceId);
  }

  const headersObject: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObject[key] = value;
  });
  console.log("DEBUG_HEADERS_INGESTION:", JSON.stringify(headersObject));

  const forwardHost = request.headers.get("x-forwarded-host");
  const originalHost = request.headers.get("x-original-host") || "";
  const standardHost = request.headers.get("host") || "";
  const hostname = originalHost || (forwardHost ? forwardHost.split(',')[0].trim() : standardHost);

  const targetProto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol || "https").replace(':', '');
  const targetDomain = hostname ? `${targetProto}://${hostname}` : request.url;

  const isAdminSubdomain = hostname.startsWith('admin.');
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminRoute = isAdminSubdomain || isAdminPath;

  if (isAdminRoute) {
    const isExemptPath = 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/__/auth') ||
      pathname.includes('.') ||
      pathname === '/' ||
      pathname === '/login' || 
      pathname === '/admin/login' || 
      pathname === '/mfa-setup' || 
      pathname === '/admin/mfa-setup';

    if (!isExemptPath) {
      const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      console.log("[EDGE DEBUG] sessionCookie present:", !!sessionCookie);
      if (!sessionCookie) {
        const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
        loginRedirectUrl.searchParams.set('reason', 'unauthenticated');
        return NextResponse.redirect(loginRedirectUrl);
      }
      try {
        const projectId = getProjectId();
        
        // Cryptographically verify signature and claims of Firebase Session Cookie
        const header = jose.decodeProtectedHeader(sessionCookie);
        if (!header.kid) {
          throw new Error('Missing kid in session cookie header');
        }
        const publicKey = await getPublicKey(header.kid);
        const { payload } = await jose.jwtVerify(sessionCookie, publicKey, {
          audience: projectId,
          issuer: `https://session.firebase.google.com/${projectId}`,
        });

        const email = payload.email as string | undefined;
        const isAdmin = payload.isAdmin === true;
        const mfaVerified = payload.mfaVerified === true;

        console.log("[EDGE DEBUG] JWT verified - email:", email, "isAdmin:", isAdmin, "mfaVerified:", mfaVerified);
        
        if (!email || (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com'))) {
          console.log("[EDGE DEBUG] invalid email or domain format rejected");
          const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthorized');
          return NextResponse.redirect(loginRedirectUrl);
        }

        if (!isAdmin) {
          console.log("[EDGE DEBUG] unauthorized user access denied (missing isAdmin claim)");
          const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthorized');
          return NextResponse.redirect(loginRedirectUrl);
        }

        if (!mfaVerified) {
          console.log("[EDGE DEBUG] user authorized but requires MFA setup validation");
          const mfaRedirectUrl = new URL(isAdminSubdomain ? '/mfa-setup' : '/admin/mfa-setup', targetDomain);
          return NextResponse.redirect(mfaRedirectUrl);
        }
      } catch (error) {
        console.error("[EDGE DEBUG] cryptographical validation failed:", error);
        const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
        loginRedirectUrl.searchParams.set('reason', 'unauthorized');
        return NextResponse.redirect(loginRedirectUrl);
      }
    }

    if (isAdminSubdomain) {
      if (pathname === '/' || pathname === '/admin') {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionCookie) {
          const loginRedirectUrl = new URL('/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthenticated');
          return NextResponse.redirect(loginRedirectUrl);
        }
      }

      if (pathname === '/login' || pathname === '/admin/login') {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin/login';
        const response = NextResponse.rewrite(adminUrl, { request: { headers: requestHeaders } });
        response.headers.set('x-debug-detected-host', hostname);
        response.headers.set('x-debug-rewritten-path', '/admin/login');
        response.headers.set('x-trace-id', traceId);
        return response;
      }

      if (pathname === '/mfa-setup' || pathname === '/admin/mfa-setup') {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin/mfa-setup';
        const response = NextResponse.rewrite(adminUrl, { request: { headers: requestHeaders } });
        response.headers.set('x-debug-detected-host', hostname);
        response.headers.set('x-debug-rewritten-path', '/admin/mfa-setup');
        response.headers.set('x-trace-id', traceId);
        return response;
      }

      if (pathname.startsWith('/_next') || pathname.includes('.')) {
        const response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set('x-debug-detected-host', hostname);
        response.headers.set('x-debug-rewritten-path', pathname);
        return response;
      }

      if (!pathname.startsWith('/admin')) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = `/admin${pathname === '/' ? '' : pathname}`;
        const response = NextResponse.rewrite(adminUrl, { request: { headers: requestHeaders } });
        response.headers.set('x-debug-detected-host', hostname);
        response.headers.set('x-debug-rewritten-path', adminUrl.pathname);
        response.headers.set('x-trace-id', traceId);
        return response;
      }
    }
  }

  serverLog({
    message: 'DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE',
    severity: 'INFO',
    loggingContext: { traceId },
  });

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const guestPass = request.cookies.get('guest_pass')?.value;

  let response: NextResponse;

  if (pathname.startsWith('/prompts')) {
    const newPath = pathname.replace('/prompts', '/studio');
    response = NextResponse.redirect(new URL(newPath, request.url));
  }
  else if (pathname.startsWith('/remote/') || 
      (pathname.startsWith('/director') && request.nextUrl.searchParams.has('sessionId')) ||
      (pathname.startsWith('/studio/remote-camera') && request.nextUrl.searchParams.has('sessionId')) ||
      (pathname.startsWith('/studio') && request.nextUrl.searchParams.has('sessionId') && request.nextUrl.searchParams.get('mode') === 'guest')) {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  else if (pathname.startsWith('/archive')) {
    if (!guestPass) {
      response = NextResponse.redirect(new URL('/login', targetDomain));
    } else {
      try {
        await jose.jwtVerify(guestPass, GUEST_SECRET);
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        response = NextResponse.redirect(new URL('/login', targetDomain));
        response.cookies.delete('guest_pass');
      }
    }
  }
  else if (!sessionCookie && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', targetDomain);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('reason', 'unauthenticated');
    response = NextResponse.redirect(loginUrl);
  }
  else {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  response.headers.set('x-trace-id', traceId);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
