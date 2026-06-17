
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from './lib/constants';
import { serverLog } from './utils/telemetry/serverLogger';

// This secret is still needed for guest passes.
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET || '');

// All routes that require a user to be logged in.
const PROTECTED_ROUTES = [
  '/dashboard', 
  '/add-memory', 
  '/settings', 
  '/requests', 
  '/create', 
  '/studio', 
  '/review'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract incoming x-trace-id header or generate if missing
  const requestHeaders = new Headers(request.headers);
  let traceId = requestHeaders.get('x-trace-id');
  if (!traceId) {
    traceId = `trc_${crypto.randomUUID().replace(/-/g, '')}`;
    requestHeaders.set('x-trace-id', traceId);
  }

  // DEBUG HEADERS FOR FORENSIC INVESTIGATION
  const headersObject: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObject[key] = value;
  });
  console.log("DEBUG_HEADERS_INGESTION:", JSON.stringify(headersObject));

  // Intercept admin subdomain requests
  const forwardHost = request.headers.get("x-forwarded-host");
  const originalHost = request.headers.get("x-original-host") || "";
  const standardHost = request.headers.get("host") || "";
  const hostname = originalHost || (forwardHost ? forwardHost.split(',')[0].trim() : standardHost);

  // Normalize target domain for redirects
  const targetProto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol || "https").replace(':', '');
  const targetDomain = hostname ? `${targetProto}://${hostname}` : request.url;

  if (hostname.startsWith('admin.')) {
    // If the path is exactly '/' or '/login' or '/admin/login'
    if (pathname === '/' || pathname === '/login' || pathname === '/admin/login') {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin/login';
      const response = NextResponse.rewrite(adminUrl, { request: { headers: requestHeaders } });
      response.headers.set('x-debug-detected-host', hostname);
      response.headers.set('x-debug-rewritten-path', '/admin/login');
      response.headers.set('x-trace-id', traceId);
      return response;
    }

    // Allow core assets or requests with dots to pass through
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.set('x-debug-detected-host', hostname);
      response.headers.set('x-debug-rewritten-path', pathname);
      return response;
    }

    // Intercept dashboard requests if the session cookie is missing
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      const loginRedirectUrl = new URL('/admin/login', targetDomain);
      loginRedirectUrl.searchParams.set('reason', 'unauthenticated');
      const response = NextResponse.redirect(loginRedirectUrl);
      response.headers.set('x-debug-detected-host', hostname);
      response.headers.set('x-debug-rewritten-path', '/admin/login');
      return response;
    }

    // If authenticated, allow the clean rewrite into the admin app folder
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

  // Telemetry log for trace interception
  serverLog({
    message: 'DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE',
    severity: 'INFO',
    loggingContext: { traceId },
  });

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const guestPass = request.cookies.get('guest_pass')?.value;

  let response: NextResponse;

  // Legacy Redirect: /prompts -> /studio
  if (pathname.startsWith('/prompts')) {
    const newPath = pathname.replace('/prompts', '/studio');
    response = NextResponse.redirect(new URL(newPath, request.url));
  }
  // 1. Allow storyteller and guest director routes to pass through with sessionId
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
  // 2. Handle guest pass access for the archive.
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
  // 4. If user is NOT logged in and trying to access a protected route, redirect to login.
  else if (!sessionCookie && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', targetDomain);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('reason', 'unauthenticated');
    response = NextResponse.redirect(loginUrl);
  }
  // 5. If none of the above, proceed as normal.
  else {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Force-set Trace ID into outbound response headers
  response.headers.set('x-trace-id', traceId);

  return response;
}

// Global edge middleware matching client requests and api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

