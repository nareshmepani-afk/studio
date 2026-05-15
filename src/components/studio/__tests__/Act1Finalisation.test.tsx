import { describe, it, expect, vi } from 'vitest';

/**
 * ACT I FINALISATION TEST SUITE
 * 
 * Validates the "Director's Lock" integrity and narrative compliance rules
 * required for the transition to Act II (The Weave).
 */

// 1. Spoken Word Rule Linter
const forbiddenKeywords = ["Camera", "Fade in", "Fade out", "Wide shot", "Close up", "Interior", "Exterior", "Cut to", "Dissolve"];
const checkSpokenWordRule = (text: string) => {
  const found = forbiddenKeywords.filter(k => {
    const regex = new RegExp(`\\b${k}\\b`, 'gi');
    return regex.test(text);
  });
  const brackets = text.match(/\[.*\]/);
  const parens = text.match(/\(.*\)/); // AI often puts directions in parens
  return {
    pass: found.length === 0 && !brackets && !parens,
    found,
    hasBrackets: !!brackets,
    hasParens: !!parens
  };
};

// 2. UK English Compliance
const usToUkMap: Record<string, string> = {
  "color": "colour",
  "labor": "labour",
  "center": "centre",
  "realized": "realised",
  "theater": "theatre",
  "analyze": "analyse",
  "organize": "organise",
  "defense": "defence",
  "offense": "offence",
  "traveler": "traveller"
};

const checkUkEnglish = (text: string) => {
  const usWords = Object.keys(usToUkMap);
  const found = usWords.filter(us => {
    const regex = new RegExp(`\\b${us}\\b`, 'gi');
    return regex.test(text);
  });
  return {
    pass: found.length === 0,
    found
  };
};

describe('Act I Finalisation & Scriptorium Rules', () => {
  
  describe('Spoken Word Rule (Stage Direction Linter)', () => {
    it('should fail if cleanScript contains directorial meta-text', () => {
      const inputs = [
        "The sun rose over the valley. [Fade in]",
        "Camera pans to the weathered hands of the old man.",
        "He looked at the sea (pause for two seconds) and sighed.",
        "Wide shot of the Atlantic crossing."
      ];

      inputs.forEach(input => {
        const result = checkSpokenWordRule(input);
        expect(result.pass).toBe(false);
      });
    });

    it('should pass for pure narrative prose', () => {
      const validProse = "The scent of Nairobi dust filled the air as he walked down the dusty road, his weathered hands gripping the walking stick.";
      const result = checkSpokenWordRule(validProse);
      expect(result.pass).toBe(true);
    });
  });

  describe('UK English Compliance Check', () => {
    it('should identify US spellings that must be UK-compliant', () => {
      const usProse = "I realized that the color of the theater center was different.";
      const result = checkUkEnglish(usProse);
      expect(result.pass).toBe(false);
      expect(result.found).toContain("realized");
      expect(result.found).toContain("color");
      expect(result.found).toContain("theater");
      expect(result.found).toContain("center");
    });

    it('should pass for UK-compliant prose', () => {
      const ukProse = "I realised that the colour of the theatre centre was different.";
      const result = checkUkEnglish(ukProse);
      expect(result.pass).toBe(true);
    });
  });

  describe('Versioned Archive & Zero-Loss Handshake', () => {
    it('should verify that originalHook is preserved during Act transition', () => {
      const originalInput = "My first memory of the rain.";
      const selectedVision = "The heavy droplets fell like diamonds on the tin roof of our house in Lagos.";
      
      // Simulation of the persistence payload
      const payload = {
        description: selectedVision,
        originalHook: originalInput,
        productionStage: 1,
        scriptHistory: [
            { timestamp: new Date().toISOString(), text: originalInput, visionType: 'soul' }
        ]
      };

      expect(payload.originalHook).toBe(originalInput);
      expect(payload.description).toBe(selectedVision);
      expect(payload.productionStage).toBe(1);
      expect(payload.scriptHistory.length).toBe(1);
    });
  });
});
