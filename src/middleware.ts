// src/middleware.ts
// This middleware exists to establish a foundation for future route-based logic (e.g., authentication).
// For now, its purpose is to simply exist correctly, allowing the Next.js server to run without crashing.
// It demonstrates Care (Sorge) by providing a stable ground upon which the rest of the application can Be.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The middleware function. It currently allows all requests to pass through unchanged.
export function middleware(request: NextRequest) {
  // As the project evolves, we will add logic here to protect routes
  // and guide the user, ensuring their journey is seamless.
  return NextResponse.next();
}

// The config object specifies which paths this middleware should apply to.
// We exclude asset paths to ensure efficiency.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
