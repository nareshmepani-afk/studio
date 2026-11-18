export const STAGING_COOKIE_NAME = 'mw_staging_access_token';
export const DEFAULT_STAGING_PASSCODE = 'MW-STAGE-2026';
const TOKEN_SALT = 'mw_vault_staging_salt_v1';

export function getStagingPasscode(): string {
  return (process.env.STAGING_ACCESS_PASSCODE || DEFAULT_STAGING_PASSCODE).trim();
}

export function maskStagingPasscode(passcode: string = getStagingPasscode()): string {
  const clean = (passcode || '').trim();
  if (clean.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(8, clean.length - 4))}${clean.slice(-4)}`;
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

/**
 * Mints a time-limited, cryptographically signed staging invite token (`<expiresAtMs>.<sigHex>`)
 * verifiable in Edge Middleware without exposing the raw master passcode.
 */
export async function computeSignedStagingInviteToken(
  expiresAtMs: number,
  passcode: string = getStagingPasscode()
): Promise<string> {
  const normalized = (passcode || '').trim().toUpperCase();
  const exp = Math.floor(Number(expiresAtMs));
  const payload = `stage_invite:${exp}:${normalized}:${TOKEN_SALT}`;
  const sig = await computeStagingToken(payload);
  return `${exp}.${sig}`;
}

/**
 * Verifies an expiring signed staging invite token (`?stage_token=<expiresAtMs>.<sigHex>`).
 */
export async function verifySignedStagingInviteToken(
  stageToken?: string | null,
  nowMs: number = Date.now()
): Promise<boolean> {
  if (!stageToken || typeof stageToken !== 'string') return false;
  const parts = stageToken.trim().split('.');
  if (parts.length !== 2) return false;
  const [expStr, providedSig] = parts;
  const expMs = Number(expStr);
  if (!Number.isFinite(expMs) || expMs <= nowMs) return false;
  if (!providedSig || providedSig.length < 16) return false;

  const expectedToken = await computeSignedStagingInviteToken(expMs, getStagingPasscode());
  const expectedSig = expectedToken.split('.')[1] || '';
  if (providedSig.length !== expectedSig.length) return false;

  // Constant-time string comparison in Edge/Browser/Node
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}
