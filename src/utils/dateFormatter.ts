export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Resilient Month Formatter Shield
 * Safely formats any month representation (named string, 1-indexed number string,
 * 0-indexed number, number, or shorthand) into a 3-letter uppercase abbreviation (e.g. "MAR").
 * Guarantees zero crashes on undefined, null, empty string, or out-of-range inputs.
 */
export function formatMonthShort(monthValue: string | number | undefined | null): string {
  if (monthValue === undefined || monthValue === null) return '';
  const str = String(monthValue).trim();
  if (!str || str.toLowerCase() === 'none' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'null') {
    return '';
  }

  // 1. Check if numeric 1-12
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 12 && MONTHS[num - 1]) {
      return MONTHS[num - 1].substring(0, 3).toUpperCase();
    }
    if (num === 0 && MONTHS[0]) {
      return MONTHS[0].substring(0, 3).toUpperCase();
    }
  }

  // 2. Check if starts with a known month name (e.g. "March", "october", "Aug")
  const matchIndex = MONTHS.findIndex(m => m.toLowerCase().startsWith(str.toLowerCase().substring(0, 3)));
  if (matchIndex !== -1 && MONTHS[matchIndex]) {
    return MONTHS[matchIndex].substring(0, 3).toUpperCase();
  }

  // 3. Fallback: Safe string slice
  return str.length >= 3 ? str.substring(0, 3).toUpperCase() : str.toUpperCase();
}
