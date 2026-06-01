'use server';

import { GoogleAuth } from 'google-auth-library';

const serviceAccountRaw = process.env.SERVICE_ACCOUNT_JSON;
let credentials: any;

if (serviceAccountRaw) {
  try {
    const cleanJson = serviceAccountRaw.trim().replace(/^['"]|['"]$/g, '');
    const parsed = JSON.parse(cleanJson);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    credentials = parsed;
  } catch (e) {
    console.error("[TTS] JSON Parse Error for Service Account:", e);
  }
}

/**
 * Mapping of friendly names to Google Cloud TTS Canonical Voice Codes.
 */
const VOICE_MAP: Record<string, string> = {
  // English (Studio)
  'Achird': 'en-US-Studio-O',
  'Achernar': 'en-US-Studio-Q',
  'Charon': 'en-US-Studio-R',
  'Zephyr': 'en-US-Studio-S',
  'Gacrux': 'en-US-Studio-T',
  'Narrator': 'en-US-Studio-O',
  
  // Gujarati (WaveNet)
  'Kiran': 'gu-IN-Wavenet-B', // Male
  'Amani': 'gu-IN-Wavenet-A', // Female
};

/**
 * Server action to synthesize speech using Google Cloud Text-to-Speech (Studio Voices).
 */
export async function synthesizeStudioSpeech(text: string, voiceName: string = 'Achird') {
  if (!credentials) {
    return null;
  }

  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    if (!token) throw new Error("Failed to generate Auth Token for TTS.");

    // Intelligent auto-detection: If text contains Gujarati characters (Unicode U+0A80 to U+0AFF),
    // automatically map it to the authentic Gujarati voice to guarantee native pronunciation.
    const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
    const canonicalVoice = hasGujarati ? 'gu-IN-Wavenet-A' : (VOICE_MAP[voiceName] || voiceName);

    // Phonetic Substitution Map for high-fidelity English Studio voices
    // We map transliterated words to their phonetic spellings so the English voice
    // pronounces them with an authentic native accent, completely avoiding SSML validation crashes!
    const PHONETIC_MAP: Record<string, string> = {
      'himmat': 'himmut',
      'kutch': 'kuch',
      'sanskar': 'sun-skaar',
      'varta': 'vaar-tha',
      'rotli': 'roat-li',
      'dhokla': 'dhoak-la',
      'khichdi': 'khich-ri',
      'garba': 'gur-bah'
    };

    let phoneticText = text;
    // Remove markdown highlights (asterisks) for clean TTS processing
    phoneticText = phoneticText.replace(/\*/g, '');

    // Replace words case-insensitively with their phonetic spellings
    for (const [word, phonetic] of Object.entries(PHONETIC_MAP)) {
      const wordRegex = new RegExp(`\\b(${word})\\b`, 'gi');
      phoneticText = phoneticText.replace(wordRegex, (match) => {
        // Match casing (Capitalized vs lowercase)
        if (match[0] === match[0].toUpperCase()) {
          return phonetic[0].toUpperCase() + phonetic.slice(1);
        }
        return phonetic;
      });
    }

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: phoneticText },
        voice: {
          languageCode: canonicalVoice.startsWith('gu-IN') ? 'gu-IN' : 'en-US',
          name: canonicalVoice,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      }),
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error("[TTS API Error]", errData);
        throw new Error(`Cloud TTS API Failed: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Return base64 audioContent
    return data.audioContent;
  } catch (error: any) {
    console.warn("[TTS Action Failure - Resilient Bypass Active]", error.message || error);
    return null;
  }
}
