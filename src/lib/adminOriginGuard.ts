import { NextResponse } from 'next/server';
import { PRODUCTION_APP_URL, STAGING_APP_URL } from '@/config/environment';

const TRUSTED_ORIGINS = new Set<string>([
  new URL(PRODUCTION_APP_URL).origin,
  new URL(STAGING_APP_URL).origin,
]);

/**
 * Same-origin CSRF guard for state-mutating Admin API endpoints (POST / PATCH / DELETE).
 *
 * - Rejects with HTTP 403 whenever `Sec-Fetch-Site` is present and not `same-origin` (or `none`).
 * - Rejects with HTTP 403 whenever `Origin` is present and does not match the request URL origin
 *   or canonical staging/production origins.
 * - In production runtime (outside Vitest), requires at least one of `Origin` or `Sec-Fetch-Site`
 *   so cross-site form/navigation submissions cannot slip through headerless.
 * - Compatible with plain `new Request('https://...')` invocations in Vitest unit tests.
 */
export function checkSameOriginMutation(req: Request): { ok: true } | { ok: false; status: 403; error: string } {
  const secFetchSite = req.headers.get('sec-fetch-site')?.trim().toLowerCase() || '';
  const originHeader = req.headers.get('origin')?.trim() || '';

  if (secFetchSite && secFetchSite !== 'same-origin') {
    return {
      ok: false,
      status: 403,
      error: `Forbidden: Cross-site mutation blocked (Sec-Fetch-Site: ${secFetchSite}).`,
    };
  }

  let requestOrigin: string | null = null;
  try {
    requestOrigin = new URL(req.url).origin;
  } catch {
    requestOrigin = null;
  }

  if (originHeader) {
    let parsedOrigin: string | null = null;
    try {
      parsedOrigin = new URL(originHeader).origin;
    } catch {
      parsedOrigin = null;
    }
    const matchesRequest = Boolean(parsedOrigin && requestOrigin && parsedOrigin === requestOrigin);
    const matchesTrusted = Boolean(parsedOrigin && TRUSTED_ORIGINS.has(parsedOrigin));
    if (!matchesRequest && !matchesTrusted) {
      return {
        ok: false,
        status: 403,
        error: `Forbidden: Cross-origin mutation blocked (Origin: ${originHeader}).`,
      };
    }
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.VITEST &&
    !secFetchSite &&
    !originHeader
  ) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: Missing Origin or Sec-Fetch-Site header on admin mutation.',
    };
  }

  return { ok: true };
}

export function assertSameOriginMutation(
  req: Request,
  headers?: Record<string, string>
): NextResponse | null {
  const verdict = checkSameOriginMutation(req);
  if (!verdict.ok) {
    return NextResponse.json(
      { success: false, error: verdict.error },
      { status: verdict.status, headers }
    );
  }
  return null;
}
