/**
 * Dedication Muse utilities & name sanitisation.
 * Shared across /gift page, unboxing theatrical stage, and keepsake PDF generator.
 */

/**
 * Sanitise recipient name for template interpolation:
 * - Trims leading/trailing whitespace
 * - Collapses multiple internal spaces to single space
 * - Title-cases each word (e.g. "mum" → "Mum", "grandad arthur" → "Grandad Arthur")
 */
export function sanitiseRecipientName(raw: string): string {
 return raw
 .trim()
 .replace(/\s{2,}/g, ' ')
 .split(' ')
 .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
 .join(' ');
}
