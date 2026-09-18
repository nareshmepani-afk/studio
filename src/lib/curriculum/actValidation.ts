/**
 * 🏛️ Act Catalyst Validation Shield
 *
 * Provides deterministic, centralised validation for mandatory theatrical catalysts.
 * Enforces strict compliance before permitting stage progression across Studio,
 * ProductionRail, and ProductionDeck.
 *
 * British English Orthography: strictly prioritised and categorised.
 */

export interface Act1Fields {
  title?: string | null;
  location?: string | null;
  country?: string | null;
  year?: string | number | null;
  prose?: string | null;
  description?: string | null;
}

export interface ActValidationResult {
  isValid: boolean;
  missing: string[];
}

/**
 * Validates Act I (The Inciting Memory / Scriptorium) mandatory catalysts.
 * 
 * Required catalysts:
 * 1. Title: non-empty trimmed string.
 * 2. City / Venue (location): non-empty trimmed string.
 * 3. Country / Region (country): non-empty trimmed string !== 'none'.
 * 4. Year: non-empty trimmed string/number !== 'none' && !== '0'.
 * 5. Story Hook / Prose: stripped plain text >= 10 characters.
 */
export function validateAct1RequiredFields(fields: Act1Fields): ActValidationResult {
  const missing: string[] = [];

  // 1. Theatrical Title
  if (!fields.title || !fields.title.trim()) {
    missing.push("Theatrical Title");
  }

  // 2. Coordinates: City / Venue
  if (!fields.location || !fields.location.trim()) {
    missing.push("City / Venue");
  }

  // 3. Coordinates: Country
  if (!fields.country || !fields.country.trim() || fields.country === 'none') {
    missing.push("Country / Region");
  }

  // 4. Time / Year Anchor
  const yearStr = fields.year !== undefined && fields.year !== null 
    ? String(fields.year).trim() 
    : '';
  if (!yearStr || yearStr === 'none' || yearStr === '0') {
    missing.push("Time / Year Anchor");
  }

  // 5. Story Hook / Narrative Prose Monologue
  const rawText = fields.prose || fields.description || '';
  const cleanHook = rawText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanHook || cleanHook.length < 10) {
    missing.push("Story Hook (minimum 10 characters)");
  }

  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * Convenience boolean checker for Act I completeness.
 */
export function isAct1Complete(fields: Act1Fields): boolean {
  return validateAct1RequiredFields(fields).isValid;
}
