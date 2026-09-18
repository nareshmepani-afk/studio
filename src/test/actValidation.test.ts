import { describe, it, expect, vi } from 'vitest';
import { validateAct1RequiredFields, isAct1Complete, scrollToFirstMissingCatalyst } from '@/lib/curriculum/actValidation';

describe('Act I Validation Shield (Unit & Boundary Tests)', () => {
  const completeValidFields = {
    title: 'The Light Beam Chase',
    location: 'Munich',
    country: 'Germany',
    year: 1884,
    prose: 'I was five years old, lying in bed with a mysterious magnetic compass.',
    description: 'A childhood memory in Munich.'
  };

  it('validates a completely filled Act I set as valid with no missing fields', () => {
    const result = validateAct1RequiredFields(completeValidFields);
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(isAct1Complete(completeValidFields)).toBe(true);
  });

  it('detects missing or whitespace-only title', () => {
    const missingTitle = { ...completeValidFields, title: '   ' };
    const result = validateAct1RequiredFields(missingTitle);
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('Theatrical Title');

    const nullTitle = { ...completeValidFields, title: null };
    expect(validateAct1RequiredFields(nullTitle).isValid).toBe(false);
  });

  it('detects missing or whitespace-only location', () => {
    const missingLocation = { ...completeValidFields, location: '' };
    const result = validateAct1RequiredFields(missingLocation);
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('City / Venue');
  });

  it('detects missing, whitespace-only, or "none" country', () => {
    const missingCountry = { ...completeValidFields, country: '' };
    expect(validateAct1RequiredFields(missingCountry).isValid).toBe(false);
    expect(validateAct1RequiredFields(missingCountry).missing).toContain('Country / Region');

    const noneCountry = { ...completeValidFields, country: 'none' };
    expect(validateAct1RequiredFields(noneCountry).isValid).toBe(false);
    expect(validateAct1RequiredFields(noneCountry).missing).toContain('Country / Region');
  });

  it('detects missing, "none", "0", or empty year', () => {
    expect(validateAct1RequiredFields({ ...completeValidFields, year: '' }).isValid).toBe(false);
    expect(validateAct1RequiredFields({ ...completeValidFields, year: 'none' }).isValid).toBe(false);
    expect(validateAct1RequiredFields({ ...completeValidFields, year: 0 }).isValid).toBe(false);
    expect(validateAct1RequiredFields({ ...completeValidFields, year: '0' }).isValid).toBe(false);
    expect(validateAct1RequiredFields({ ...completeValidFields, year: null }).isValid).toBe(false);
    expect(validateAct1RequiredFields({ ...completeValidFields, year: '1964' }).isValid).toBe(true);
  });

  it('detects missing or too short Story Hook / Prose (< 10 characters)', () => {
    const shortHook = { ...completeValidFields, prose: 'Too short', description: '' };
    const result = validateAct1RequiredFields(shortHook);
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('Story Hook (minimum 10 characters)');
  });

  it('strips HTML tags before counting Story Hook length', () => {
    const htmlStub = { ...completeValidFields, prose: '<p>   <br/>  </p>', description: '' };
    const result = validateAct1RequiredFields(htmlStub);
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('Story Hook (minimum 10 characters)');

    const validHtml = { ...completeValidFields, prose: '<p>This is genuine authentic prose with more than ten characters.</p>', description: '' };
    expect(validateAct1RequiredFields(validHtml).isValid).toBe(true);
  });

  it('accumulates all missing required fields when multiple are absent', () => {
    const emptyFields = {
      title: '',
      location: '',
      country: '',
      year: 'none',
      prose: ''
    };
    const result = validateAct1RequiredFields(emptyFields);
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual([
      'Theatrical Title',
      'City / Venue',
      'Country / Region',
      'Time / Year Anchor',
      'Story Hook (minimum 10 characters)'
    ]);
  });

  describe('Three-Vector Shield Enforcement Simulation', () => {
    it('Vector 1 (ProductionControlBar): blocks next transition when isComplete is false regardless of lowClarity', () => {
      const missingFields = { title: '', location: '', country: 'none', year: 'none', prose: '' };
      const isComplete = isAct1Complete(missingFields);
      const isLowClarity = true; // clarity < 15%
      
      let nextCalled = false;
      let blockedReason = '';

      // Simulated handleNextClick priority logic
      const handleNextClick = () => {
        if (!isComplete) {
          blockedReason = 'CATALYSTS REQUIRED';
          return;
        }
        if (isLowClarity) {
          // double-click override logic only reached if isComplete is true
          nextCalled = true;
        }
      };

      handleNextClick();
      expect(isComplete).toBe(false);
      expect(nextCalled).toBe(false);
      expect(blockedReason).toBe('CATALYSTS REQUIRED');
    });

    it('Vector 2 (ProductionDeck handleNextAct & handleStageJump): blocks stage transition from Act 0 if fields are invalid', () => {
      const invalidState = { title: 'Some Title', location: '', country: '', year: 2020, prose: 'Short' };
      const validState = { ...completeValidFields };

      const simulateStageJump = (currentStage: number, newStage: number, state: any) => {
        if (currentStage === 0 && newStage > 0) {
          const check = validateAct1RequiredFields(state);
          if (!check.isValid) {
            return { allowed: false, missing: check.missing };
          }
        }
        return { allowed: true, targetStage: newStage };
      };

      const blockedJump = simulateStageJump(0, 1, invalidState);
      expect(blockedJump.allowed).toBe(false);
      expect(blockedJump.missing).toContain('City / Venue');
      expect(blockedJump.missing).toContain('Country / Region');
      expect(blockedJump.missing).toContain('Story Hook (minimum 10 characters)');

      const allowedJump = simulateStageJump(0, 1, validState);
      expect(allowedJump.allowed).toBe(true);
      expect(allowedJump.targetStage).toBe(1);
    });

    it('Vector 3 (ProductionRail isActAvailable): marks acts > 0 as unavailable until Act I is complete', () => {
      const isActAvailable = (id: number, memory: any) => {
        if (id === 0) return true;
        return isAct1Complete({
          title: memory?.title,
          location: memory?.narratorLocationAtEvent || memory?.location,
          country: memory?.country,
          year: memory?.dateComponents?.year || memory?.year,
          prose: memory?.prose,
          description: memory?.description
        });
      };

      const draftMemory = { title: '', country: 'none', location: '' };
      expect(isActAvailable(0, draftMemory)).toBe(true);
      expect(isActAvailable(1, draftMemory)).toBe(false);
      expect(isActAvailable(2, draftMemory)).toBe(false);

      const completeMemory = {
        title: 'A Beautiful Memory',
        location: 'Paris',
        country: 'France',
        dateComponents: { year: '1995' },
        prose: 'We walked along the Seine in late autumn when leaves were falling.'
      };
      expect(isActAvailable(0, completeMemory)).toBe(true);
      expect(isActAvailable(1, completeMemory)).toBe(true);
      expect(isActAvailable(2, completeMemory)).toBe(true);
    });
  });

  describe('Act I Validity Change Stability & Bailout Shield', () => {
    it('bails out and preserves previous state reference when validity and missing array match', () => {
      const stateUpdater = (
        prev: { isValid: boolean; missing: string[] } | null,
        isValid: boolean,
        missing: string[]
      ) => {
        if (
          prev &&
          prev.isValid === isValid &&
          prev.missing.length === missing.length &&
          prev.missing.every((m, idx) => m === missing[idx])
        ) {
          return prev; // Bail out! Same reference prevents React re-render cascade.
        }
        return { isValid, missing };
      };

      const initial = stateUpdater(null, false, ['Theatrical Title', 'City / Venue']);
      expect(initial).toEqual({ isValid: false, missing: ['Theatrical Title', 'City / Venue'] });

      // Second dispatch with identical values must return exact same reference
      const nextSame = stateUpdater(initial, false, ['Theatrical Title', 'City / Venue']);
      expect(nextSame).toBe(initial);

      // Dispatch with changed missing items must return new reference
      const nextChanged = stateUpdater(initial, false, ['Theatrical Title']);
      expect(nextChanged).not.toBe(initial);
      expect(nextChanged.missing).toEqual(['Theatrical Title']);

      // Dispatch with valid state must return new reference
      const nextValid = stateUpdater(nextChanged, true, []);
      expect(nextValid.isValid).toBe(true);
      expect(nextValid).not.toBe(nextChanged);

      // Re-dispatch valid state must return same reference
      const nextValidSame = stateUpdater(nextValid, true, []);
      expect(nextValidSame).toBe(nextValid);
    });
  });

  describe('Auto-Scroll to Missing Catalyst Affordance', () => {
    it('gracefully handles missing or empty arrays', () => {
      expect(() => scrollToFirstMissingCatalyst(undefined)).not.toThrow();
      expect(() => scrollToFirstMissingCatalyst([])).not.toThrow();
    });

    it('locates catalyst-location and triggers scrollIntoView and focus for City / Venue', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        focus: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      };

      const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

      scrollToFirstMissingCatalyst(['City / Venue', 'Country / Region']);

      expect(getElementByIdSpy).toHaveBeenCalledWith('catalyst-location');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(mockElement.classList.add).toHaveBeenCalledWith(
        'ring-2',
        'ring-amber-400',
        'ring-offset-2',
        'ring-offset-slate-950',
        'transition-all'
      );

      getElementByIdSpy.mockRestore();
    });

    it('locates catalyst-title when Theatrical Title is missing', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        focus: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };
      const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

      scrollToFirstMissingCatalyst(['Theatrical Title']);
      expect(getElementByIdSpy).toHaveBeenCalledWith('catalyst-title');

      getElementByIdSpy.mockRestore();
    });

    it('locates catalyst-year when Time / Year Anchor is missing', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        focus: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };
      const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

      scrollToFirstMissingCatalyst(['Time / Year Anchor']);
      expect(getElementByIdSpy).toHaveBeenCalledWith('catalyst-year');

      getElementByIdSpy.mockRestore();
    });

    it('locates catalyst-hook when Story Hook is missing', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        focus: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };
      const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

      scrollToFirstMissingCatalyst(['Story Hook (minimum 10 characters)']);
      expect(getElementByIdSpy).toHaveBeenCalledWith('catalyst-hook');

      getElementByIdSpy.mockRestore();
    });
  });
});
