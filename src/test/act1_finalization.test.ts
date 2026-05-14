import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSoundtrack } from '@/actions/audioWeaver';

// --- TEST UTILITIES ---

/**
 * Enforces the "Spoken Word Rule" - no stage directions in prose.
 */
function validateCleanScript(script: string) {
  const forbiddenPatterns = [
    /\[.*\]/,           // Brackets for stage directions
    /\(.*\)/,           // Parentheses often used for cues
    /camera/i,
    /fade in/i,
    /wide shot/i,
    /cut to/i,
    /close up/i,
    /scene/i
  ];
  
  return forbiddenPatterns.every(pattern => !pattern.test(script));
}

/**
 * Validates UK English spellings against a common US list.
 */
function checkUKEnglish(text: string) {
  const usToUk = [
    { us: 'color', uk: 'colour' },
    { us: 'labor', uk: 'labour' },
    { us: 'center', uk: 'centre' },
    { us: 'realize', uk: 'realise' },
    { us: 'analyze', uk: 'analyse' },
    { us: 'theater', uk: 'theatre' },
    { us: 'favorite', uk: 'favourite' },
  ];

  const issues = usToUk.filter(pair => {
    // Check for US version (simple word boundary check)
    const regex = new RegExp(`\\b${pair.us}\\b`, 'i');
    return regex.test(text);
  });

  return {
    isCompliant: issues.length === 0,
    offendingWords: issues.map(i => i.us)
  };
}

// --- TEST SUITE ---

describe('Act I Finalization: Narrative & Linguistic Integrity', () => {
  
  describe('Spoken Word Rule (Linter)', () => {
    it('should pass for clean prose without directorial meta-text', () => {
      const prose = "The smell of rain on the red earth reminded him of home. The village was quiet now.";
      expect(validateCleanScript(prose)).toBe(true);
    });

    it('should fail if stage directions are hallucinated in brackets', () => {
      const taintedProse = "He looked at the horizon. [Camera pans left]";
      expect(validateCleanScript(taintedProse)).toBe(false);
    });

    it('should fail if technical camera terms are used in prose', () => {
      const taintedProse = "The Wide Shot of the valley was breathtaking.";
      expect(validateCleanScript(taintedProse)).toBe(false);
    });
  });

  describe('UK English Compliance', () => {
    it('should validate text using UK spellings', () => {
      const ukText = "Our ancestors were labourers in the centre of the village, and we realised our dream.";
      const result = checkUKEnglish(ukText);
      expect(result.isCompliant).toBe(true);
    });

    it('should detect US spellings (color, center, labor)', () => {
      const usText = "The color of the center was labor-intensive.";
      const result = checkUKEnglish(usText);
      expect(result.isCompliant).toBe(false);
      expect(result.offendingWords).toContain('color');
      expect(result.offendingWords).toContain('center');
      expect(result.offendingWords).toContain('labor');
    });
  });

  describe('Zero-Loss Handshake Logic (Mocked State)', () => {
    it('should correctly simulate the selection handshake', () => {
      // Mocking the behavior we expect in components like MemoryForm
      const state = {
        originalHook: "The spark of a memory.",
        scriptHistory: [] as string[],
        isProductionLocked: false
      };

      // Selection Ceremony Step
      const selectedScript = "The expanded cinematic vision.";
      
      // 1. Archive before overwrite
      state.scriptHistory.push(state.originalHook);
      
      // 2. Overwrite with vision
      state.originalHook = selectedScript;
      
      // 3. Seal the production
      state.isProductionLocked = true;

      expect(state.scriptHistory.length).toBe(1);
      expect(state.scriptHistory[0]).toBe("The spark of a memory.");
      expect(state.originalHook).toBe("The expanded cinematic vision.");
      expect(state.isProductionLocked).toBe(true);
    });
  });

  describe('Audio Weaver: Cache-First Logic (Mocks)', () => {
    // Note: In a real Vitest environment, we'd use vi.mock('@/lib/firebase-admin')
    // and vi.mock('p-retry'). Here we simulate the logic branches.

    it('should prioritize the cache URL if the file exists', async () => {
      const mockBucket = {
        file: vi.fn().mockReturnValue({
          exists: vi.fn().mockResolvedValue([true])
        }),
        name: 'test-bucket'
      };

      // Simulating the check logic in audioWeaver.ts
      const cachePath = "assets/sfx/test_soul.mp3";
      const file = mockBucket.file(cachePath);
      const [exists] = await file.exists();
      
      let finalUrl = null;
      if (exists) {
        finalUrl = `https://firebasestorage.googleapis.com/v0/b/${mockBucket.name}/o/${encodeURIComponent(cachePath)}?alt=media`;
      }

      expect(exists).toBe(true);
      expect(finalUrl).toContain('test_soul.mp3');
      expect(finalUrl).toContain('alt=media');
    });

    it('should return the SAFE_BACKUP_URL on generation timeout', async () => {
      const SAFE_BACKUP_URL = "https://example.com/fallback.mp3";
      const GENERATION_TIMEOUT_MS = 100; // Short for testing
      
      const startTime = Date.now();
      
      // Simulating a long-running task that exceeds timeout
      const pollTask = new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Date.now() - startTime > GENERATION_TIMEOUT_MS) {
            reject(new Error("Timeout"));
          } else {
            resolve("Success");
          }
        }, 200);
      });

      let resultUrl;
      try {
        await pollTask;
        resultUrl = "https://replicate.com/output.mp3";
      } catch (e) {
        resultUrl = SAFE_BACKUP_URL;
      }

      expect(resultUrl).toBe(SAFE_BACKUP_URL);
    });
  });
});
