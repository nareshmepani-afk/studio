export const STAGING_COOKIE_NAME = 'mw_staging_access_token';
export const DEFAULT_STAGING_PASSCODE = 'MW-STAGE-2026';
const TOKEN_SALT = 'mw_vault_staging_salt_v1';

export function getStagingPasscode(): string {
  return (process.env.STAGING_ACCESS_PASSCODE || DEFAULT_STAGING_PASSCODE).trim();
}

/**
 * Computes a deterministic SHA-256 hex string from the passcode + salt.
 * Fully compatible with Next.js Edge Runtime, Node.js, and Browser Web Crypto.
 */
export async function computeStagingToken(passcode: string): Promise<string> {
  const normalized = (passcode || '').trim().toUpperCase();
  const data = new TextEncoder().encode(`${normalized}:${TOKEN_SALT}`);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments where crypto.subtle is not accessible
  return Buffer.from(data).toString('base64');
}

/**
 * Verifies if the provided cookie token matches the expected SHA-256 token for the active staging passcode.
 */
export async function isValidStagingToken(tokenValue?: string | null): Promise<boolean> {
  if (!tokenValue) return false;
  const expectedToken = await computeStagingToken(getStagingPasscode());
  return tokenValue.trim() === expectedToken;
}
