import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/ai/genkit';
import pRetry from 'p-retry';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-internal-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: 'online',
      endpoint: '/api/gift/polish-dedication',
      method: 'POST',
      description: 'Memory Weaver AI Dedication Muse for Heirloom Keepsake Cards',
      usage: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          message: 'Raw text written by user',
          tone: 'heartfelt | poetic | celebratory | understated (optional, default: heartfelt)',
          recipientName: 'Recipient name (optional)',
          unboxingLanguage: 'en | gu | pa | hi (optional)',
        },
      },
      version: '1.1.0-beta',
    },
    { headers: CORS_HEADERS }
  );
}

/**
 * Server-side prose sanitizer per Rule 11 (Probabilistic Prompt Guard & Regex Sanitizer)
 */
function sanitizeDedication(text: string): string {
  if (!text) return '';
  return text
    .replace(/^["'“]|["'”]$/g, '') // strip outer quotation marks
    .replace(/\[(?:Fade in|Fade out|Wide shot|Close up|Cut to|Camera|Interior|Exterior|Dissolve).*?\]/gi, '')
    .replace(/\((?:pause|camera|wide shot|close up|zoom).*?\)/gi, '')
    .replace(/^(?:Polished dedication|Here is the polished dedication|Elevated text|Dedication):\s*/i, '')
    .trim();
}

/**
 * Heuristic polish fallback when AI models are temporarily unreachable
 */
function heuristicPolish(rawText: string, recipientName?: string): string {
  let cleaned = rawText.trim();
  if (!cleaned) return '';

  // Fix capitalization of first character
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Ensure trailing punctuation
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  // Prepend recipient greeting if not already present
  const name = recipientName?.trim();
  if (name && !new RegExp(`^(Dear|To|For|Dearest)\\s+${name}`, 'i').test(cleaned)) {
    cleaned = `Dear ${name}, ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      message = '',
      tone = 'heartfelt',
      recipientName = '',
      unboxingLanguage = 'en',
    } = body;

    const trimmedInput = message.trim();
    if (!trimmedInput) {
      return NextResponse.json(
        { error: 'Message text is required for AI polishing.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Tone instruction descriptors
    const TONE_GUIDES: Record<string, string> = {
      heartfelt: 'Warm, emotional, intimate, and deeply appreciative. Focus on love, family gratitude, and enduring memories.',
      poetic: 'Lyrical, reflective, and reverent. Focus on the passage of time, heritage roots, and timeless wisdom.',
      celebratory: 'Joyful, uplifting, and triumphant. Perfect for milestone birthdays (70th, 80th), retirements, and golden celebrations.',
      understated: 'Short, dignified, classic, and elegant. Timeless and graceful without excessive sentimentality.',
    };

    const toneGuide = TONE_GUIDES[tone] || TONE_GUIDES.heartfelt;

    const prompt = `
You are the Memory Weaver Heirloom Dedication Muse.
Your task is to elevate a personal gift dedication message for a 5"×7" physical keepsake card.

[RAW DRAFT WRITTEN BY USER]
${trimmedInput}

[ELEVATION GUIDELINES]
- TONE: ${toneGuide}
${recipientName ? `- RECIPIENT: Addressed to "${recipientName}". Ensure it opens or addresses them warmly.` : ''}
- ORTHOGRAPHY: British English (UK) spelling exclusively (honour, favourite, centre, realise, colour).
- PRESERVATION: Retain all personal details, relationships, inside jokes, and authentic memories from the draft. Do not invent false biographical facts.
- CARD FIT: Concise, elegant length (approx. 120–220 characters) suitable for a luxury printed card.
- CLEAN OUTPUT: Return ONLY the final polished dedication text. Do not include quotes, preamble, or commentary.
`;

    let polishedText = '';

    try {
      const ai = await getAI();
      const { text: resultText } = await pRetry(
        async () => {
          return await ai.generate(prompt);
        },
        { retries: 2 }
      );

      polishedText = sanitizeDedication(resultText || '');
    } catch (aiErr: any) {
      console.warn('[polish-dedication] Genkit call failed, applying heuristic fallback:', aiErr.message);
      polishedText = heuristicPolish(trimmedInput, recipientName);
    }

    if (!polishedText || polishedText.length < 10) {
      polishedText = heuristicPolish(trimmedInput, recipientName);
    }

    return NextResponse.json(
      {
        success: true,
        polishedText,
        tone,
        charCount: polishedText.length,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Error in polish-dedication route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to polish dedication message.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
