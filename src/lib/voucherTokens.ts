/**
 * Crockford Base32 Voucher Token Generator
 *
 * Act V Heirloom Gifting Engine (MW-86 / Ticket #220)
 *
 * Generates human-friendly voucher codes using the Crockford Base32 alphabet,
 * which eliminates transcription ambiguity on physical 5"×7" keepsake printouts.
 *
 * Format:  MW-PASS-XXXX-XXXX  (Director 31-Day Pass)
 *          MW-VAULT-XXXX-XXXX (Generational Vault Lifetime)
 *
 * Alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
 * Excludes: I (confused with 1), L (confused with 1), O (confused with 0), U (prevents vulgarities)
 */

import { adminDb } from '@/lib/firebase-admin';
import type { GiftTier } from '@/types/gift';

// ---------------------------------------------------------------------------
// Crockford Base32 Alphabet (32 unambiguous characters)
// ---------------------------------------------------------------------------

export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Tier prefix mapping for voucher codes */
const TIER_PREFIX: Record<GiftTier, string> = {
  director: 'MW-PASS',
  generational_vault: 'MW-VAULT',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a unique Crockford Base32 voucher code with Firestore collision check.
 *
 * @param tier - The gift tier ('director' | 'generational_vault')
 * @param maxRetries - Maximum collision-retry attempts (default: 5)
 * @returns A unique voucher code string, e.g. "MW-VAULT-7K8P-9Q2M"
 * @throws Error if a unique code cannot be generated after maxRetries
 */
export async function generateVoucherCode(
  tier: GiftTier,
  maxRetries: number = 5
): Promise<string> {
  const prefix = TIER_PREFIX[tier];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const segment1 = generateSegment(4);
    const segment2 = generateSegment(4);
    const code = `${prefix}-${segment1}-${segment2}`;

    // Firestore collision check
    const exists = await checkCodeExists(code);
    if (!exists) {
      return code;
    }

    console.warn(
      `Voucher code collision on attempt ${attempt + 1}: ${code}. Retrying...`
    );
  }

  throw new Error(
    `Failed to generate unique voucher code after ${maxRetries} attempts. ` +
    `This is statistically improbable — investigate potential entropy issues.`
  );
}

/**
 * Validates that a string matches the standard voucher code format.
 *
 * Accepts both auto-generated codes (MW-PASS-XXXX-XXXX, MW-VAULT-XXXX-XXXX)
 * and admin vanity codes matching /^MW-[A-Z0-9-]{3,18}$/.
 *
 * @param code - The voucher code string to validate
 * @returns true if the code matches a valid format
 */
export function isValidVoucherFormat(code: string): boolean {
  // Standard auto-generated format
  const standardPattern = /^MW-(PASS|VAULT)-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
  if (standardPattern.test(code)) return true;

  // Admin vanity format: MW- followed by 3-18 uppercase alphanumeric/hyphen chars
  const vanityPattern = /^MW-[A-Z0-9-]{3,18}$/;
  return vanityPattern.test(code);
}

/**
 * Normalises user input into a canonical voucher code format.
 *
 * - Converts to uppercase
 * - Strips leading/trailing whitespace
 * - Corrects common OCR/transcription confusions:
 *   - 'I' → '1', 'L' → '1' (visually similar)
 *   - 'O' → '0' (visually similar)
 *   - 'U' → 'V' (closest Crockford neighbour)
 *
 * @param input - Raw user-entered voucher code
 * @returns Normalised voucher code string
 */
export function normaliseVoucherCode(input: string): string {
  const trimmed = input.trim().toUpperCase();

  // If prefixed with standard prefixes, isolate prefix from payload segments to prevent corrupting 'VAULT' or 'PASS'
  if (trimmed.startsWith('MW-PASS-')) {
    const payload = trimmed.slice('MW-PASS-'.length);
    const normalisedPayload = payload
      .replace(/I/g, '1')
      .replace(/L/g, '1')
      .replace(/O/g, '0')
      .replace(/U/g, 'V');
    return `MW-PASS-${normalisedPayload}`;
  }

  if (trimmed.startsWith('MW-VAULT-')) {
    const payload = trimmed.slice('MW-VAULT-'.length);
    const normalisedPayload = payload
      .replace(/I/g, '1')
      .replace(/L/g, '1')
      .replace(/O/g, '0')
      .replace(/U/g, 'V');
    return `MW-VAULT-${normalisedPayload}`;
  }

  if (trimmed.startsWith('MW-')) {
    const payload = trimmed.slice('MW-'.length);
    const normalisedPayload = payload
      .replace(/I/g, '1')
      .replace(/L/g, '1')
      .replace(/O/g, '0')
      .replace(/U/g, 'V');
    return `MW-${normalisedPayload}`;
  }

  return trimmed
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V');
}

/**
 * Validates a vanity code for admin minting.
 * Must match /^MW-[A-Z0-9-]{3,18}$/ after normalisation.
 *
 * @param code - The vanity code to validate
 * @returns An object with { valid, reason? }
 */
export function validateVanityCode(code: string): { valid: boolean; reason?: string } {
  const normalised = code.trim().toUpperCase();

  if (!normalised.startsWith('MW-')) {
    return { valid: false, reason: 'Vanity code must start with "MW-".' };
  }

  const vanityPattern = /^MW-[A-Z0-9-]{3,18}$/;
  if (!vanityPattern.test(normalised)) {
    return {
      valid: false,
      reason: 'Vanity code must be MW- followed by 3–18 uppercase letters, digits, or hyphens.',
    };
  }

  // Reject codes that look like auto-generated ones to avoid confusion
  const standardPattern = /^MW-(PASS|VAULT)-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
  if (standardPattern.test(normalised)) {
    return {
      valid: false,
      reason: 'Vanity code must not match the auto-generated format (MW-PASS/VAULT-XXXX-XXXX).',
    };
  }

  return { valid: true };
}

/**
 * Checks whether a voucher code already exists in Firestore.
 *
 * @param code - The voucher code to check
 * @returns true if the code already exists
 */
export async function checkCodeExists(code: string): Promise<boolean> {
  if (!adminDb) return false;

  const docRef = adminDb.collection('gift_vouchers').doc(code);
  const snap = await docRef.get();
  return snap.exists;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a random segment of Crockford Base32 characters.
 *
 * Uses crypto.getRandomValues() for cryptographically secure randomness.
 *
 * @param length - Number of characters in the segment
 * @returns A random Base32 string segment
 */
function generateSegment(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let segment = '';
  for (let i = 0; i < length; i++) {
    // Use modulo 32 to map each byte to a Crockford character
    segment += CROCKFORD_ALPHABET[bytes[i] % 32];
  }

  return segment;
}
