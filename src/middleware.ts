import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from './lib/constants';
import { serverLog } from './utils/telemetry/serverLogger';

const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET || '');

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
      pathname.includes('.') ||
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
        const decoded = jose.decodeJwt(sessionCookie);
        const email = decoded.email as string | undefined;
        console.log("[EDGE DEBUG] decoded email from token:", email);
        
        if (!email || (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com'))) {
          console.log("[EDGE DEBUG] invalid email or domain format rejected");
          const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthorized');
          return NextResponse.redirect(loginRedirectUrl);
        }

        const accessToken = await getGoogleAccessToken();
        if (!accessToken) {
          throw new Error("Unable to obtain Google OAuth access token.");
        }

        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'memory-weaver-8rk9t';
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_users/${encodeURIComponent(email.toLowerCase())}`;
        console.log("[EDGE DEBUG] fetching whitelist status from:", url);
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("[EDGE DEBUG] Firestore response status:", res.status);
        if (res.status === 404) {
          console.log("[EDGE DEBUG] user email not whitelisted in firestore (404)");
          const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthorized');
          return NextResponse.redirect(loginRedirectUrl);
        }

        if (!res.ok) {
          throw new Error(`Firestore REST API returned status: ${res.status}`);
        }

        const data = await res.json();
        const isActive = data.fields?.isActive?.booleanValue ?? false;
        const mfaSetupComplete = data.fields?.mfaSetupComplete?.booleanValue ?? false;
        console.log("[EDGE DEBUG] Whitelist data - isActive:", isActive, "mfaSetupComplete:", mfaSetupComplete);

        if (!isActive) {
          console.log("[EDGE DEBUG] user is whitelisted but inactive");
          const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
          loginRedirectUrl.searchParams.set('reason', 'unauthorized');
          return NextResponse.redirect(loginRedirectUrl);
        }

        if (!mfaSetupComplete) {
          console.log("[EDGE DEBUG] user active but requires MFA setup");
          const mfaRedirectUrl = new URL(isAdminSubdomain ? '/mfa-setup' : '/admin/mfa-setup', targetDomain);
          return NextResponse.redirect(mfaRedirectUrl);
        }
      } catch (error) {
        console.error("[EDGE DEBUG] error verifying whitelist:", error);
        console.error("MIDDLEWARE MFA/WHITELIST ERROR:", error);
        const loginRedirectUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', targetDomain);
        loginRedirectUrl.searchParams.set('reason', 'unauthorized');
        return NextResponse.redirect(loginRedirectUrl);
      }
    }

    if (isAdminSubdomain) {
      if (pathname === '/' || pathname === '/login' || pathname === '/admin/login') {
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
