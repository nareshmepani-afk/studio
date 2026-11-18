// 1. Genkit-specific model references (require provider prefix)
export const GENKIT_MODELS = {
  FLASH: 'googleai/gemini-3.8-flash',
  FLASH_LITE: 'googleai/gemini-3.5-flash-lite',
  FLASH_LATEST: 'googleai/gemini-flash-latest',
  PRO: 'googleai/gemini-pro-latest',
} as const;

// 2. Vertex AI-specific model names (usually no provider prefix)
export const VERTEX_MODELS = {
  FLASH: 'gemini-3.8-flash',
  PRO: 'gemini-2.5-pro',
} as const;

// 3. Replicate (Third-Party) Model Version Hashes
export const REPLICATE_MODELS = {
  MUSICGEN: 'b05b39c70a243e86c07172088f117c014db7f7b11d8c11438965f7c32087c53d',
} as const;

// 4. Raw/General model names for generic or future API libraries
export const RAW_MODELS = {
  FLASH: 'gemini-3.8-flash',
  PRO: 'gemini-2.5-pro',
} as const;

// Registry Lists for HUD Selectors
export const GENKIT_OPTIONS = [
  'googleai/gemini-3.8-flash',
  'googleai/gemini-3.5-flash-lite',
  'googleai/gemini-flash-latest',
  'googleai/gemini-flash-lite-latest',
  'googleai/gemini-pro-latest',
  'googleai/gemini-2.5-pro',
];

export const VERTEX_OPTIONS = [
  'gemini-2.5-pro',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-pro-latest',
  'gemini-flash-latest',
];

export const REPLICATE_OPTIONS = [
  'b05b39c70a243e86c07172088f117c014db7f7b11d8c11438965f7c32087c53d', // MusicGen Large
  '7a7631901c2b4e56b34f9dae97147b4d1ced4d0d5b51a0210b37db895b6c243b', // MusicGen Medium fallback
];
