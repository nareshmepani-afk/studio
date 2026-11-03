/**
 * Truth Shield Engine (GOV-MW-162)
 *
 * Deterministic biographical & temporal fidelity guardrails.
 * Prevents AI models from extrapolating or hallucinating unauthorized calendar years,
 * dates, or historical milestones in narrative prose and sensory anchors.
 */

/**
 * Extracts authorized calendar years from user memory text and metadata.
 */
export function buildAllowedYearSet(
  sourceText?: string,
  declaredYear?: string | number | null,
  durationQuantity?: number
): Set<string> {
  const allowed = new Set<string>();
  if (declaredYear !== undefined && declaredYear !== null && declaredYear !== 'Unknown' && declaredYear !== 'none') {
    const num = Number(declaredYear);
    if (!isNaN(num) && num > 1800 && num < 2100) {
      allowed.add(String(num));
      const span = durationQuantity && durationQuantity > 0 ? durationQuantity : 1;
      for (let i = 1; i <= span; i++) {
        allowed.add(String(num + i));
      }
    }
  }

  if (sourceText) {
    const matches = sourceText.match(/\b(18\d\d|19\d\d|20\d\d)\b/g);
    if (matches) {
      matches.forEach(y => allowed.add(y));
    }
  }

  return allowed;
}

/**
 * GOV-MW-162 Truth Shield (Prose Rule):
 * Deterministically replaces unauthorized calendar years in narrative prose.
 * Replaces opening/clause year statements (e.g. "In 1956,") with authentic relative phrasing ("In those early years,")
 * and standalone mentions with ("that era").
 */
export function sanitizeProseTemporalFidelity(
  text: string,
  allowedYears: Set<string>
): string {
  if (!text) return "";
  const yearMatches = text.match(/\b(18\d\d|19\d\d|20\d\d)\b/g);
  if (!yearMatches) return text;

  let cleaned = text;
  const unauthorizedYears = Array.from(new Set(yearMatches)).filter(y => !allowedYears.has(y));

  for (const year of unauthorizedYears) {
    // 1. "In <YEAR>," or "In <YEAR>" at start or inside sentence
    cleaned = cleaned.replace(new RegExp(`\\bIn ${year},?\\b`, 'gi'), 'In those early years,');
    // 2. "By <YEAR>," or "By <YEAR>"
    cleaned = cleaned.replace(new RegExp(`\\bBy ${year},?\\b`, 'gi'), 'By that time,');
    // 3. "During <YEAR>," or "During <YEAR>"
    cleaned = cleaned.replace(new RegExp(`\\bDuring ${year},?\\b`, 'gi'), 'During that era,');
    // 4. "Around <YEAR>," or "Around <YEAR>"
    cleaned = cleaned.replace(new RegExp(`\\bAround ${year},?\\b`, 'gi'), 'Around that time,');
    // 5. "Since <YEAR>," or "Since <YEAR>"
    cleaned = cleaned.replace(new RegExp(`\\bSince ${year},?\\b`, 'gi'), 'Since that era,');
    // 6. Standalone year reference
    cleaned = cleaned.replace(new RegExp(`\\b${year}\\b`, 'g'), 'that era');
  }

  // Clean any double commas or awkward punctuation introduced by replacements
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

/**
 * GOV-MW-162 Truth Shield (Sensory Anchor Chip Rule):
 * Specifically strips unauthorized calendar year suffixes (e.g. "IN 1956", "in 1956", ", 1956")
 * from short sensory chips without inserting sentence clauses.
 * e.g. "RHYTHMIC SOUND OF SEA WAVES IN 1956" -> "RHYTHMIC SOUND OF SEA WAVES"
 */
export function sanitizeSensoryAnchorTemporalFidelity(
  anchor: string,
  allowedYears: Set<string>
): string {
  if (!anchor) return "";
  const yearMatches = anchor.match(/\b(18\d\d|19\d\d|20\d\d)\b/g);
  if (!yearMatches) return anchor;

  let cleaned = anchor;
  const unauthorizedYears = Array.from(new Set(yearMatches)).filter(y => !allowedYears.has(y));

  for (const year of unauthorizedYears) {
    // Strip trailing/intermediate "IN <YEAR>", "in <YEAR>", ", <YEAR>", "(<YEAR>)", or standalone "<YEAR>"
    cleaned = cleaned.replace(new RegExp(`\\s+(?:in|during|of|around|at)?\\s*\\(?${year}\\)?`, 'gi'), '');
    cleaned = cleaned.replace(new RegExp(`\\b${year}\\b`, 'g'), '');
  }

  // Clean trailing punctuation, dangling prepositions, or extra spaces
  cleaned = cleaned
    .replace(/[,\-:–—]\s*$/, '')
    .replace(/\s+(?:in|during|of|around|at)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned;
}
