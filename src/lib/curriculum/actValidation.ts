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

/**
 * Smoothly scrolls the viewport to the first incomplete catalyst element
 * and applies a focused ambient pulse ring to guide the narrator.
 */
export function scrollToFirstMissingCatalyst(missing?: string[]): void {
  if (typeof window === 'undefined' || !missing || missing.length === 0) return;

  const first = missing[0];
  let targetId = '';

  if (first.includes('Title')) {
    targetId = 'catalyst-title';
  } else if (first.includes('City') || first.includes('Venue')) {
    targetId = 'catalyst-location';
  } else if (first.includes('Country') || first.includes('Region')) {
    targetId = 'catalyst-country';
  } else if (first.includes('Time') || first.includes('Year')) {
    targetId = 'catalyst-year';
  } else if (first.includes('Story Hook') || first.includes('Hook')) {
    targetId = 'catalyst-hook';
  }

  if (!targetId) return;

  const el = document.getElementById(targetId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus if element is focusable
    if ('focus' in el && typeof (el as HTMLElement).focus === 'function') {
      setTimeout(() => {
        try {
          (el as HTMLElement).focus({ preventScroll: true });
        } catch {
          // Ignore focus failures on non-inputs
        }
      }, 350);
    }

    // Apply temporary ambient pulse ring
    el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-slate-950', 'transition-all');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-slate-950');
    }, 2200);
  }
}

