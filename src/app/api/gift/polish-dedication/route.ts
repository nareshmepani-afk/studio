import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/ai/genkit';
import { getActiveModel } from '@/ai/models.server';
import { z } from 'genkit';

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

    const systemPrompt = `
You are the Memory Weaver Heirloom Dedication Muse.
Your task is to take a raw, unpolished gift message written by a user and elevate it into an elegant, deeply moving personal dedication for a 5"×7" physical keepsake card.

Strict Constraints (Mandatory):
1. BRITISH ENGLISH ORTHOGRAPHY (UK): You MUST strictly use British English spelling (e.g. honour, centre, realise, favourite, programme, colour).
2. PRESERVE AUTHENTIC FACTS: Retain all personal details, specific memories, names, cities, relationships, and inside references mentioned in the raw draft. Do NOT invent false biographical facts.
3. PHYSICAL CARD FIT: Keep the final output length strictly between 120 and 230 characters so it fits a 5"×7" vector PDF print layout.
4. TONE GUIDANCE (${tone.toUpperCase()}): ${toneGuide}
${recipientName ? `5. RECIPIENT: The dedication is addressed to "${recipientName}". Ensure it opens or addresses them warmly.` : ''}
6. CLEAN OUTPUT: Output ONLY the final polished dedication text without preamble, commentary, quotation marks, or stage directions.

Raw user draft to elevate:
"${trimmedInput}"
`;

    let polishedText = '';

    try {
      const ai = await getAI();
      const activeModel = await getActiveModel('genkit');

      const response = await ai.generate({
        model: activeModel,
        prompt: systemPrompt,
        config: {
          temperature: 0.35,
          maxOutputTokens: 150,
        },
      });

      polishedText = sanitizeDedication(response.text || '');
    } catch (aiErr: any) {
      console.warn('[polish-dedication] Genkit call failed, applying heuristic fallback:', aiErr.message);
      polishedText = heuristicPolish(trimmedInput, recipientName);
    }

    if (!polishedText) {
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
