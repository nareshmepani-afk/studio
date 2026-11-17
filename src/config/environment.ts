/**
 * Single source of truth for Firebase project identity (staging vs production).
 *
 * SECURITY (MW-402..MW-408 production cutover hardening):
 * - Environment decisions MUST be derived from the server-resolved Firebase project ID,
 *   never from client-controllable request headers (Host / X-Forwarded-Host / X-Original-Host),
 *   because those can be spoofed to impersonate the staging host on a production backend.
 * - Resolution FAILS CLOSED: if the project cannot be determined, it is treated as unknown,
 *   and callers must deny privileged behaviour (reCAPTCHA bypass, admin verification, etc.).
 */

export const PRODUCTION_PROJECT_ID = 'memory-weaver-8rk9t';
export const STAGING_PROJECT_ID = 'memory-weaver-dev';
export const PRODUCTION_APP_URL = 'https://memoryweaver.studio';
export const STAGING_APP_URL = 'https://dev.memoryweaver.studio';

/**
 * Resolves the active Firebase project ID. Prefers the Admin SDK app's project ID
 * (authoritative, server-side), then build/runtime env. Returns null when unknown.
 */
export function resolveProjectId(adminProjectId?: string | null): string | null {
  const candidate =
    adminProjectId ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    '';
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isProductionProject(projectId: string | null): boolean {
  return projectId === PRODUCTION_PROJECT_ID;
}

/** True only for the known staging project. Unknown or production projects return false. */
export function isStagingProject(projectId: string | null): boolean {
  return projectId === STAGING_PROJECT_ID;
}

/**
 * Derives the Storage bucket for a project from env, never from a hard-coded other-environment bucket.
 * Returns null when not configured (callers must degrade gracefully).
 */
export function resolveStorageBucket(bucketName?: string | null): string | null {
  const candidate = (bucketName || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim();
  return candidate.length > 0 ? candidate : null;
}

/**
 * Resolves the canonical public origin for customer links, QR codes, emails, and webhooks.
 * Prefers live browser origin, then NEXT_PUBLIC_APP_URL, then optional request host header,
 * then Firebase project identity (returning PRODUCTION_APP_URL on prod, STAGING_APP_URL on staging).
 */
export function resolvePublicAppUrl(hostHeader?: string | null): string {
  const configuredUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');
  if (configuredUrl) {
    return configuredUrl;
  }
  const cleanHost = (hostHeader || '').split(',')[0].trim();
  if (cleanHost) {
    const proto = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1') ? 'http' : 'https';
    return `${proto}://${cleanHost}`;
  }
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin.startsWith('http') &&
    !window.location.origin.startsWith('http://localhost') &&
    !window.location.origin.startsWith('http://127.0.0.1')
  ) {
    return window.location.origin.replace(/\/$/, '');
  }
  return isProductionProject(resolveProjectId()) ? PRODUCTION_APP_URL : STAGING_APP_URL;
}
