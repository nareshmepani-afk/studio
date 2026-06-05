import { cookies } from 'next/headers';

/**
 * Chronicle Cinema - Central AI & Third-Party API Model Registry
 * 
 * To prevent future API endpoint shutdowns (e.g. model deprecations leading to 404s),
 * all API libraries (Genkit, Vertex AI, Replicate, etc.) must use this registry.
 */

// 1. Genkit-specific model references (require provider prefix)
export const GENKIT_MODELS = {
  FLASH: 'googleai/gemini-flash-latest',
  PRO: 'googleai/gemini-pro-latest',
} as const;

// 2. Vertex AI-specific model names (usually no provider prefix)
export const VERTEX_MODELS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
} as const;

// 3. Replicate (Third-Party) Model Version Hashes
export const REPLICATE_MODELS = {
  MUSICGEN: 'b05b39c70a243e86c07172088f117c014db7f7b11d8c11438965f7c32087c53d',
} as const;

// 4. Raw/General model names for generic or future API libraries
export const RAW_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-1.5-pro',
} as const;

// Registry Lists for HUD Selectors
export const GENKIT_OPTIONS = [
  'googleai/gemini-flash-latest',
  'googleai/gemini-pro-latest',
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.5-pro',
  'googleai/gemini-1.5-flash',
  'googleai/gemini-1.5-pro',
];

export const VERTEX_OPTIONS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.0-pro',
];

export const REPLICATE_OPTIONS = [
  'b05b39c70a243e86c07172088f117c014db7f7b11d8c11438965f7c32087c53d', // MusicGen Large
  '7a7631901c2b4e56b34f9dae97147b4d1ced4d0d5b51a0210b37db895b6c243b', // MusicGen Medium fallback
];

/**
 * Resolves the active model ID, respecting any developer HUD hot-swap overrides.
 */
export async function getActiveModel(service: 'genkit' | 'vertex' | 'replicate'): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const cookieStore = await cookies();
      const override = cookieStore.get(`dev_model_${service}`)?.value;
      if (override) {
        console.log(`[Models Registry] Hot-swap override in effect for ${service}: ${override}`);
        return override;
      }
    } catch (e) {
      // Cookies might not be readable in all contexts (e.g. static builds)
    }
  }

  // Fallback to defaults
  switch (service) {
    case 'genkit':
      return GENKIT_MODELS.FLASH;
    case 'vertex':
      return VERTEX_MODELS.PRO;
    case 'replicate':
      return REPLICATE_MODELS.MUSICGEN;
  }
}
