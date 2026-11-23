'use server';

import { getAI } from '@/ai/genkit';
import { getActiveModel } from '@/ai/models.server';
import { GENKIT_MODELS, buildGenkitConfig } from '@/ai/models';
import { z } from 'genkit';
import pRetry from 'p-retry';
import { VertexAI } from '@google-cloud/vertexai';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { ScriptBlock } from '@/types';
import { cookies } from 'next/headers';
import {
  buildAllowedYearSet,
  sanitizeProseTemporalFidelity,
  sanitizeSensoryAnchorTemporalFidelity,
} from '@/lib/truthShield';
import { enforceBritishEnglish } from '@/lib/dictionary/diasporaVoiceShield';

// Parse service account for Vertex AI SDK
const serviceAccountRaw = process.env.SERVICE_ACCOUNT_JSON;
let credentials: any;
if (serviceAccountRaw) {
  try {
    const cleanJson = serviceAccountRaw.trim().replace(/^['"]|['"]$/g, '');
    credentials = JSON.parse(cleanJson);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  } catch (e) {
    console.error("[AI Weaver] Vertex AI Auth Parse Error:", e);
  }
}

/**
 * Server action to expand sensory bullets into rich prose.
 * Uses Genkit (Google AI) which is already configured with an API Key.
 */
/**
 * Internal synchronous helper for stripping screenplay cues inside server actions.
 */
function sanitizeProse(text: string): string {
  if (!text) return "";
  let cleaned = text
    // Strip leading camera/scene cut phrases (e.g. "Cut to a frame of ", "Cut to ")
    .replace(/^(?:Cut to\s*(?:a\s*frame\s*of|a\s*shot\s*of|a|the)?|Wide shot(?:\s*of|\s*:)?|Close-up(?:\s*on|\s*:)?|Pan to|Zoom in on|Zoom to|Hard freeze on|Fade in(?:\s*:)?|Dissolve to)\s*/i, '')
    // Strip inline camera/lens/stage directives (e.g. "The lens zooms past ", "Cut to ")
    .replace(/\b(?:Cut to\s*(?:a\s*frame\s*of|a\s*shot\s*of|a|the)?|Wide shot(?:\s*of|\s*:)?|Close-up(?:\s*on|\s*:)?|Pan to|Zoom in on|Zoom to|The lens zooms(?:\s*past|\s*in|\s*to)?|Hard freeze on|Fade in(?:\s*:)?|Dissolve to)\s*/gi, '')
    // Strip stage directions in brackets or parentheses (e.g. [Fade in], (pause))
    .replace(/\[(?:Fade in|Fade out|Wide shot|Close up|Cut to|Camera|Interior|Exterior|Dissolve).*?\]/gi, '')
    .replace(/\((?:pause|camera|wide shot|close up|zoom).*?\)/gi, '')
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return enforceBritishEnglish(cleaned);
}

function extractRetryErrorMessage(err: any): string {
  return err?.error?.message || err?.message || String(err || 'Unknown AI error');
}

/**
 * Server action to strip screenplay, camera, film editing cues,
 * and stage notes from generated narrative prose.
 */
export async function stripScreenplayCues(text: string): Promise<string> {
  return sanitizeProse(text);
}

export async function expandWithAI(
  description: string, 
  sensoryConfig: any[], 
  sensoryValues: Record<string, string>,
  emotionTags: string[],
  currentProse: string,
  isRewriteOfSelection: boolean = false,
  visionIntent?: { type: string | null; label: string | null }
): Promise<{ poetic?: string; direct?: string; nostalgic?: string; master?: string }> {
  console.log("[AI Weaver] expandWithAI triggered");
  
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('dev_simulate_script_corruption')?.value === 'true') {
      console.warn("[AI Weaver] [SIMULATION] Injecting script corruption into cinematic takes!");
      return {
        poetic: "ERROR: [CORRUPTED_STREAM] 0xEF4B3908 - Buffer overflow. Memory trace fragmented. Please re-run alignment.",
        direct: "ERROR: [CORRUPTED_STREAM] 0xEF4B3908 - Buffer overflow. Memory trace fragmented. Please re-run alignment.",
        nostalgic: "ERROR: [CORRUPTED_STREAM] 0xEF4B3908 - Buffer overflow. Memory trace fragmented. Please re-run alignment.",
      };
    }
  } catch (e) {
    // Ignore context/cookie reading errors
  }

  const ai = await getAI();
  const activeModel = await getActiveModel('genkit');
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  console.log("[AI Weaver] API Key Signature:", key ? `${key.substring(0, 5)}...${key.substring(key.length - 4)}` : "MISSING");
  
  try {
    const sensoryDetailsStr = (sensoryConfig || []).map(s => {
       const val = sensoryValues?.[s.id];
       if (val) return `${s.label}: ${val}`;
       return null;
    }).filter(Boolean).join('\n');

    const sharedContext = `
      You are an award-winning Literary Memoirist and Family Historian specializing in "Literary Depth."
      Your task is to transform raw memory fragments into a narrative that explores the internal world and the "invisible" heritage carried across borders.
      
      [DIRECTOR'S INTENT]
      The Director has chosen a specific "Vision" for this story: ${visionIntent?.label || 'General Narrative'} (${visionIntent?.type || 'Standard'}).
      ${visionIntent?.type === 'soul' ? 'Focus on the internal, emotional truth and spiritual resonance.' : 
        visionIntent?.type === 'sensory' ? 'Prioritize vivid physical sensations, scents, and ambient sounds.' :
        visionIntent?.type === 'cinematic' ? 'Use dramatic pacing and striking sensory metaphors.' : 
        'Maintain a balanced literary tone.'}

      [INCOMING DATA]
      "Description": ${description}
      "Emotion Tags": ${(emotionTags || []).length > 0 ? emotionTags.join(', ') : 'None specified'}
      "Context": ${
        isRewriteOfSelection 
          ? `(Focusing on this specific segment): "${currentProse}"` 
          : `"${currentProse || 'Empty'}"`
      }
      "Sensory Details": 
      ${sensoryDetailsStr || 'None provided'}
      
      STYLE RULES (THE GOLD STANDARD):
      - Write strictly in FIRST-PERSON SPOKEN PROSE for a single narrator speaking directly into a teleprompter / camera.
      - ABSOLUTELY NO SCREENPLAY OR CAMERA CUES: You are WRITING SPOKEN MONOLOGUE, NOT A FILM SCRIPT. NEVER include screenplay directives, camera directions, lens movements, or stage cues anywhere in the text (e.g. NEVER write "Cut to...", "Cut to a frame of...", "The lens zooms...", "Wide shot", "Close-up", "Pan to"). Every single word MUST be spoken aloud by the narrator.
      - Use high-contrast metaphors (e.g., "not a map, but the soil").
      - Focus on the "Linguistically silent but culturally loud" quality of migration.
      - Avoid AI-speak: BANNED words include "odyssey," "lineage," "tapestry," "vibrant," "testament," "unfolding," "interwoven," "symphony," or "shores" (unless refers to a physical beach).
      - BRITISH ENGLISH (en-GB) ONLY (Rule 20.3): Enforce British/Commonwealth English spelling throughout (e.g. colour, favourite, theatre, realise, centre, honour, travelling).
      - DIASPORA VOICE SHIELD: Preserve all South Asian, Gujarati, Punjabi, Hindi, and East African heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji) verbatim without anglicising or replacing them.
      - PROPER-NOUN & CULTURAL-FRAMING FIDELITY: Preserve every proper noun (places, towns, family names, languages, landmarks) verbatim as written by the narrator — never alter spelling, substitute neighbouring regions, or invent biographical slogans, family mantras, or cultural clichés not present in the narrator's input.
      - Write for future generations.
    `;

    const takeSpecs: Array<{ key: 'poetic' | 'direct' | 'nostalgic' | 'master'; instruction: string }> = [
      {
        key: 'poetic',
        instruction: 'Take 1 ("poetic"): Internal world focus. Reflective and deeply metaphorical spoken monologue (100-140 words).'
      },
      {
        key: 'direct',
        instruction: 'Take 2 ("direct"): Humanity and persistence focus. Documentary-style spoken monologue with authentic weight (100-140 words).'
      },
      {
        key: 'nostalgic',
        instruction: 'Take 3 ("nostalgic"): Ancestral and generational focus. Passing down the family values and lessons reflected in the narrator\'s own words (100-140 words).'
      },
      {
        key: 'master',
        instruction: 'Take 4 ("master"): THE MEMORY WEAVE (Master Fusion Synthesis). A harmonized monologue that seamlessly fuses authentic personal voice, emotional depth, sensory physical texture, and dynamic rhythm into a single master score (100-140 words).'
      }
    ];

    console.log(`[AI Weaver] Launching 4 parallel Sensory Takes on ${activeModel} (thinkingBudget: 0)...`);
    const settled = await Promise.allSettled(
      takeSpecs.map(({ key: takeKey, instruction }) =>
        pRetry(
          async () => {
            const singlePrompt = `${sharedContext}\n\n[ASSIGNED TAKE]\n${instruction}\nReturn ONLY the single spoken paragraph (100-140 words). No JSON wrapper, no preamble, no quotes.`;
            const res = await ai.generate({
              prompt: singlePrompt,
              model: activeModel,
              config: buildGenkitConfig(activeModel, {
                maxOutputTokens: 450,
                temperature: 0.7,
              }),
            });
            // Support either direct text response or legacy mocked structured output
            if (res?.output && typeof res.output === 'object' && (res.output as any)[takeKey]) {
              return String((res.output as any)[takeKey]);
            }
            const rawText = (res?.text || '').trim().replace(/^```(?:markdown|text)?\s*|\s*```$/g, '').replace(/^"|"$/g, '').trim();
            if (!rawText) throw new Error(`Empty response for take ${takeKey}`);
            return rawText;
          },
          {
            retries: 1,
            onFailedAttempt: (error: any) =>
              console.warn(`[AI Weaver] Sensory take (${takeKey}) attempt ${error.attemptNumber} failed: ${extractRetryErrorMessage(error)}`),
          }
        )
      )
    );

    const fallbackTake = sanitizeProse(currentProse || description || 'A treasured memory preserved in spoken voice.');
    const resolved: Record<'poetic' | 'direct' | 'nostalgic' | 'master', string> = {
      poetic: '',
      direct: '',
      nostalgic: '',
      master: '',
    };

    let successCount = 0;
    takeSpecs.forEach(({ key: takeKey }, idx) => {
      const item = settled[idx];
      if (item.status === 'fulfilled' && item.value) {
        resolved[takeKey] = sanitizeProse(item.value);
        successCount++;
      } else {
        resolved[takeKey] = fallbackTake;
      }
    });

    if (successCount === 0) {
      const firstErr = settled.find((s): s is PromiseRejectedResult => s.status === 'rejected')?.reason;
      throw firstErr || new Error('AI returned empty output across all parallel takes');
    }

    console.log(`[AI Weaver] Successfully generated ${successCount}/4 parallel cinematic takes.`);
    return {
      poetic: resolved.poetic,
      direct: resolved.direct,
      nostalgic: resolved.nostalgic,
      master: resolved.master || resolved.poetic,
    };
  } catch (error: any) {
    console.error("[AI Weaver] Connection Failure:", error.message || error);
    throw new Error(`AI Bridge Blocked: ${error.message || 'Check Vertex AI Status'}`);
  }
}

/**
 * Server action to get 2-3 atmospheric enhancements to make a hook "Cinema Ready".
 */
export async function getAtmosphericPolish(description: string): Promise<string[]> {
  console.log("[AI Weaver] getAtmosphericPolish triggered");
  const ai = await getAI();
  try {
    const prompt = `
      You are the "Script Supervisor" for Chronicle Cinema. 
      Analyze this Story Hook and suggest exactly 3 atmospheric enhancements to make it "Cinema Ready."
      Enhancements should focus on Sensory Anchors (Aroma, Sound, Visual).
      
      [STORY HOOK]
      "${description}"
      
      Return the suggestions as a JSON array of strings. 
      Example: ["Incorporate the sharp scent of ozone before the rain", "Add the rhythmic ticking of a grandfather clock", "Describe the amber glow of the setting sun hitting the floorboards"]
    `;

    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        output: {
          schema: z.array(z.string()),
        },
      });
    }, { retries: 2 });

    return output || [];
  } catch (error) {
    console.error("[AI Weaver] Atmospheric Polish Failure:", error);
    return ["Add a specific scent memory", "Incorporate an ambient sound cue", "Highlight a unique visual detail"];
  }
}

/**
 * Server action to fuse the original script/hook with the video transcript.
 * This is the "Fusion Protocol."
 */
export async function fuseVideoStory(hook: string, transcript: string): Promise<string> {
  console.log("[AI Weaver] fuseVideoStory (Fusion Protocol) triggered");
  const ai = await getAI();
  const activeModel = await getActiveModel('genkit');
  try {
    const prompt = `
      You are the "Lead Editor" and "Auteur" for Chronicle Cinema. 
      Your task is the "Fusion Protocol": blend the original "Director's Intent" (Hook) with the "Actual Performance" (Transcript) into a cohesive, prestigious "Video Story."
      
      [DIRECTOR'S INTENT / HOOK]
      "${hook}"
      
      [ACTUAL PERFORMANCE / TRANSCRIPT]
      "${transcript}"
      
      RULES:
      1. PRESTIGE TONE: The final story must feel like a narrated cinematic memoir.
      2. COHESION: Resolve any discrepancies between the intent and the performance.
      3. LITERARY DEPTH: Use high-end metaphors. 
      4. BANNED WORDS: "odyssey", "tapestry", "lineage", "vibrant", "testament", "unfolding".
      5. Length: 150-200 words.
      
      Return ONLY the fused prose.
    `;

    const { text } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: activeModel,
        config: buildGenkitConfig(activeModel, { maxOutputTokens: 500 }),
      });
    }, { retries: 2 });

    return text?.trim() || "";
  } catch (error) {
    console.error("[AI Weaver] Fusion Protocol Failure:", error);
    return `${hook}\n\n(Transcript: ${transcript})`;
  }
}

/**
 * Server action to automatically generate theatrical poster metadata.
 */
export async function generatePosterAesthetics(
  title: string,
  description: string,
  storyProse: string,
  tags: string[]
): Promise<{
  chapterTitle: string;
  posterStyle: 'cinematic' | 'modern' | 'minimalist';
  director: string;
  producer: string;
  starring: string;
  billingLine: string;
}> {
  const ai = await getAI();
  try {
    const prompt = `
      You are the Lead Creative Director for "Chronicle Cinema." 
      Based on the following story data, generate high-end theatrical poster metadata.
      
      [STORY DATA]
      Title: ${title}
      Description: ${description}
      Narrative: ${storyProse}
      Tags: ${tags.join(', ')}
      
      Return the output as a JSON object with this exact structure:
      {
        "chapterTitle": "string (A punchy, thematic chapter title)",
        "posterStyle": "cinematic" | "modern" | "minimalist",
        "director": "string (A prestigious directorial name or 'Chronicle Cinema')",
        "producer": "string (A prestigious producer name)",
        "starring": "string (Key figures from the memory)",
        "billingLine": "string (A cinematic tagline for the bottom of the poster)"
      }
    `;

    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        output: {
          schema: z.object({
            chapterTitle: z.string(),
            posterStyle: z.enum(['cinematic', 'modern', 'minimalist']),
            director: z.string(),
            producer: z.string(),
            starring: z.string(),
            billingLine: z.string(),
          }),
        },
      });
    }, { retries: 2 });

    if (output) {
      return output;
    }

    throw new Error("Failed to generate poster aesthetics");
  } catch (error: any) {
    console.error("Error generating poster aesthetics:", error.message || error);
    return {
      chapterTitle: title || "Untitled Memory",
      posterStyle: 'cinematic',
      director: "Chronicle Cinema",
      producer: "Memory Weaver Studio",
      starring: "The Ancestors",
      billingLine: "A story etched in time."
    };
  }
}
/**
 * Server action to generate a "Podcast-style" interview question based on the script.
 */
/**
 * Helper function to retrieve a non-repeating fallback question from a pool of atmospheric cues.
 */
function getFallbackQuestion(history: string[], language: 'en' | 'gu'): string {
  const englishFallbacks = [
    "Tell me more about that moment; what do you remember most clearly?",
    "Could you elaborate on the most vivid part of this memory for me?",
    "How did that experience make you feel at the time?",
    "Are there any specific sounds or scents that stand out when you think about it?",
    "Who else was there with you, and how did they react?",
    "What is the single most important detail you want to preserve from this memory?"
  ];

  const gujaratiFallbacks = [
    "તમારી આ યાદ વિશે મને વધુ કહો; તમને સૌથી વધુ સ્પષ્ટપણે શું યાદ છે?",
    "શું તમે મારી માટે આ યાદના સૌથી આબેહૂબ ભાગ વિશે વિગતવાર જણાવી શકો છો?",
    "તે સમયે આ અનુભવે તમને કેવો અહેસાસ કરાવ્યો હતો?",
    "જ્યારે તમે આ વિશે વિચારો છો ત્યારે કોઈ ખાસ અવાજ અથવા સુગંધ યાદ આવે છે?",
    "તમારી સાથે ત્યાં બીજું કોણ હતું, અને તેમની પ્રતિક્રિયા શું હતી?",
    "આ યાદમાંથી તમે કઈ એક સૌથી મહત્વપૂર્ણ વિગત સાચવી રાખવા માંગો છો?"
  ];

  const englishOutros = [
    "You've shared some beautiful layers. As you bring your take to a close, what final reflection or legacy would you like to summarize?",
    "Take a deep breath. Share any final thoughts on how this memory shapes who you are today before wrapping up.",
    "Think about the future generations listening to this. What is the parting advice you want to leave them with?"
  ];

  const gujaratiOutros = [
    "તમે ખૂબ જ સુંદર વિગતો શેર કરી છે. તમારી આ વાત પૂર્ણ કરતા પહેલા, તમે કઈ અંતિમ વિગત અથવા વારસો સાચવવા માંગો છો?",
    "ઊંડો શ્વાસ લો. આ યાદ આજે તમારા વ્યક્તિત્વને કેવી રીતે આકાર આપે છે તે વિશેના અંતિમ વિચારો જણાવીને વાત પૂર્ણ કરો.",
    "ભવિષ્યની પેઢીઓ માટે તમે કઈ છેલ્લી સલાહ કે સંદેશ છોડવા માંગો છો?"
  ];

  // Normalize history to check for existing questions
  const historyText = history.map(h => h.replace(/^AI:\s*/i, '').trim().toLowerCase());

  // Determine if we should serve an outro question (after 6 questions have been asked)
  const isOutroStage = historyText.length >= 6;
  const pool = isOutroStage 
    ? (language === 'gu' ? gujaratiOutros : englishOutros)
    : (language === 'gu' ? gujaratiFallbacks : englishFallbacks);

  // Find a question in the selected pool that isn't in history
  for (const q of pool) {
    if (!historyText.includes(q.toLowerCase().trim())) {
      return q;
    }
  }

  // If all questions in the pool have been used, return a random one from the pool
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateInterviewQuestion(
  script: string,
  history: string[] = [],
  language: 'en' | 'gu' = 'en',
  strategy: 'strict' | 'fluid' = 'strict'
): Promise<string> {
  const ai = await getAI();
  try {
    const isGujarati = language === 'gu';
    const isFluid = strategy === 'fluid';

    const prompt = `
      You are the "AI Interviewer" for Chronicle Cinema, a podcast-style host that helps users record deep, personal memories.
      
      [CURRENT SCRIPT]
      ${script || "No script yet. We are just starting."}
      
      [CONVERSATION HISTORY]
      ${history.length > 0 ? history.join('\n') : "Beginning of conversation."}
      
      [LANGUAGE & STRATEGY]
      Target Language: ${isGujarati ? 'Gujarati' : 'English'}
      Strategy: ${isFluid ? 'Fluid (Code-switching permitted)' : 'Strict (Stay entirely in target language)'}
      
      YOUR GOAL:
      Generate ONE inquisitive, warm, and professional follow-up question that helps the user elaborate on the emotional or sensory details of their story.
      
      RULES:
      1. Be concise (max 40 words).
      2. Use a "Podcast Host" tone (Warm, curiosity-driven).
      3. ${isGujarati ? 'Primary script: GUJARATI.' : 'Primary script: ENGLISH.'}
      4. ${isFluid ? 'CODE-SWITCHING: You are encouraged to intersperse English words/phrases within Gujarati sentences if it feels like a modern, natural conversation.' : 'NO CODE-SWITCHING: Stick strictly to the target language.'}
      5. Reference specific details from the script if available.
      
      Return ONLY the question text ${isGujarati ? 'in Gujarati script' : ''}.
    `;

    const { text } = await pRetry(async () => {
      return await ai.generate(prompt);
    }, { retries: 2 });

    const trimmedText = text?.trim();
    
    // Check if the generated text is a duplicate of a previously asked question
    const historyText = history.map(h => h.replace(/^AI:\s*/i, '').trim().toLowerCase());
    if (trimmedText && !historyText.includes(trimmedText.toLowerCase())) {
      return trimmedText;
    }

    return getFallbackQuestion(history, language);
  } catch (error: any) {
    console.error("Failed to generate interview question:", error);
    return getFallbackQuestion(history, language);
  }
}

/**
 * Server action to analyze a camera frame for lighting and composition.
 */
export async function analyzeFraming(
  imageBase64: string,
  language: 'en' | 'gu' = 'en'
): Promise<string> {
  const ai = await getAI();
  try {
    const isGujarati = language === 'gu';
    
    // Clean base64 if it includes the data URI prefix
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const contentType = imageBase64.split(';')[0]?.split(':')[1] || 'image/jpeg';

    const prompt = `
      You are the "AI Lead Director" for Chronicle Cinema. 
      Analyze this camera frame for the following:
      1. COMPOSITION: Is the subject centered? Are they too close or too far?
      2. LIGHTING: Is it too dark, too bright, or uneven?
      3. BACKGROUND: Is there anything distracting?
      
      YOUR GOAL:
      Give ONE or TWO short, professional directing instructions to the user to improve their shot.
      
      RULES:
      1. Be concise (max 25 words).
      2. Tone: Warm, constructive, professional director.
      3. Language: ${isGujarati ? 'GUJARATI script' : 'ENGLISH'}.
      
      Return ONLY the instruction text.
    `;

    const { text } = await pRetry(async () => {
      // @ts-ignore - Genkit multimodal array format
      return await ai.generate([
        { text: prompt },
        { media: { url: `data:${contentType};base64,${base64Data}`, contentType } }
      ]);
    }, { retries: 2 });

    return text?.trim() || (isGujarati ? "બધું સારું લાગે છે, ચાલો રેકોર્ડિંગ શરૂ કરીએ." : "Everything looks good, let's start recording.");
  } catch (error: any) {
    console.error("[AI Director] Framing Analysis Failure:", error);
    return language === 'gu' ? "તમારી ફ્રેમિંગ સારી લાગે છે. ચાલો આગળ વધીએ." : "Your framing looks good. Let's proceed.";
  }
}

/**
 * Server action to generate the Director's Notepad using Vertex AI Multimodal.
 * Watch the video and extract transcript, emotional beats, entities, and chapters.
 */
export async function generateDirectorsNotepad(memoryId: string, videoUrl: string): Promise<any> {
  console.log(`[Director's Notepad] Generating analysis for memory: ${memoryId}`);
  
  if (!credentials) {
    throw new Error("Vertex AI credentials missing.");
  }

  const session = await getSession();
  if (!session?.uid) throw new Error("Unauthorized");

  try {
    if (!videoUrl || videoUrl.startsWith('blob:')) {
      console.log("[Director's Notepad] Skipping remote analysis for local blob URL.");
      return null;
    }

    // 1. Convert HTTP Video URL to GCS URI
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{pathEncoded}?alt=media...
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const urlObj = new URL(videoUrl);
    const pathPart = urlObj.pathname.split('/o/')[1];
    if (!pathPart) throw new Error("Invalid video URL format for GCS mapping");
    const filePath = decodeURIComponent(pathPart.split('?')[0]);
    const gcsUri = `gs://${bucket}/${filePath}`;

    console.log(`[Director's Notepad] Target GCS URI: ${gcsUri}`);

    // 2. Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: credentials.project_id,
      location: 'us-central1',
    });

    const activeModel = await getActiveModel('vertex');
    const model = vertexAI.getGenerativeModel({
      model: activeModel, 
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `
      You are the "Script Supervisor" and "Lead Director" for Chronicle Cinema.
      Watch this recorded video memory and generate a "Director's Notepad" in JSON format.
      
      [CHRONICLE CINEMA CHAPTER BLUEPRINT]
      1. The Hook: Introduce the setting/roots (e.g. Nairobi/Kutch).
      2. The Inciting Incident: The leap/shift (e.g. migration).
      3. The Struggle: The "meat" of the story (Learning/Adapting).
      4. The Climax: The peak moment or hard lesson.
      5. The Resolution: The legacy reflection.

      [OUTPUT REQUIREMENTS]
      Return a JSON object with this exact structure:
      {
        "transcript": [
          { "startTime": number (seconds), "endTime": number, "text": "string", "speaker": "string" }
        ],
        "emotionalBeats": [
          { "time": number, "label": "string (e.g. Joy, Grit, Nostalgia)", "color": "string (hex code)", "description": "string" }
        ],
        "entities": [
          { "name": "string", "type": "place|person|object|concept", "mention": "Context of mention" }
        ],
        "directorNotes": "string (A professional directorial critique and high-level summary)",
        "suggestedChapters": [
          { "startTime": number, "title": "string", "description": "string", "type": "hook|incident|struggle|climax|resolution" }
        ]
      }

      RULES:
      - Transcribe accurately.
      - Map emotional beats precisely to timestamps.
      - Ensure you provide 3-5 chapters following the blueprint.
      - Keep the tone professional, literary, and cinematic.
    `;

    console.log("[Director's Notepad] Initiating Multimodal Pass...");
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { fileData: { mimeType: 'video/webm', fileUri: gcsUri } }
        ]
      }]
    });

    const response = result.response;
    const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonText) throw new Error("AI returned empty response");
    
    const notepadData = JSON.parse(jsonText);
    notepadData.analyzedAt = new Date().toISOString();

    // 4. Fusion Protocol: Synthesis of Hook + Transcript
    // Fetch original hook from the memory document
    if (!adminDb) throw new Error("Database connection unavailable");
    const memorySnap = await adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).get();
    const memoryData = memorySnap.data();
    const originalHook = memoryData?.description || "";
    const transcriptText = notepadData.transcript.map((t: any) => t.text).join(' ');
    
    console.log("[Director's Notepad] Triggering Fusion Protocol...");
    const videoStory = await fuseVideoStory(originalHook, transcriptText);
    notepadData.videoStory = videoStory;

    // 5. Persist to Firestore
    if (!adminDb) throw new Error("Database connection lost");
    
    const analysisRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).collection('analysis').doc('notepad');
    const resultToStore = {
      ...notepadData,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };
    
    await analysisRef.set(resultToStore);

    // Also update the main memory document with the videoStory for high-level access
    await adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).update({
      videoStory: videoStory
    });

    revalidatePath('/studio');
    console.log("[Director's Notepad] Analysis complete and persisted to subdocument.");
    
    return { success: true, data: resultToStore };

  } catch (error: any) {
    console.error("[Director's Notepad] Analysis Failed:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Server action to analyze the script blocks and suggest sensory catalysts.
 * This is the "Block-Aware" AI integration for the Director's Note.
 */
export async function analyzeCompositionAnchors(blocks: ScriptBlock[]): Promise<Array<{
  blockId: string;
  type: 'aroma' | 'soundscape' | 'visual' | 'polish';
  value: string;
  reasoning: string;
}>> {
  console.log(`[AI Weaver] analyzeCompositionAnchors triggered. Blocks count: ${blocks.length}`);
  const ai = await getAI();
  if (!ai) {
    console.error("[AI Weaver] Failed to initialize Genkit instance");
    return [];
  }

  // Filter out empty blocks to save tokens
  const activeBlocks = blocks.filter(b => b.text.trim().length > 0);
  
  if (activeBlocks.length === 0) {
    return [];
  }

  const scriptContent = activeBlocks.map(b => `[ID: ${b.id}] (${b.type}): ${b.text}`).join('\n\n');

  try {
    const prompt = `
      You are the "Lead Director" and "Sensory Designer" for Chronicle Cinema.
      Your task is to analyze the following sequence of "Script Blocks" and suggest 1 to 3 "Sensory Catalysts" to deepen the immersion.
      
      [CURRENT SCRIPT COMPOSITION]
      ${scriptContent}

      [THE INSTRUCTION]
      Do not invent new story beats. Identify existing blockId keys and propose specific Sensory Catalysts that deepen the immersion of the text already present in those blocks.
      
      [CATALYST TYPES]
      - aroma: A specific scent memory (e.g. "Scent of old books", "Jasmine in the rain")
      - soundscape: A specific audio cue (e.g. "Distant train whistle", "Muffled laughter")
      - visual: A striking visual detail or lighting cue (e.g. "Dust motes in amber light")
      - polish: A suggestion to refine the prose (e.g. "Strengthen the active verb here")

      Return ONLY a JSON array of suggestions. Each suggestion must include:
      - blockId: The exact ID of the block you are targeting.
      - type: One of the catalyst types above.
      - value: The short, evocative catalyst phrase (max 5 words).
      - reasoning: A brief director's note explaining why this catalyst works here (max 15 words).
    `;

    console.log("[AI Weaver] Sending Composition Analysis prompt to Genkit...");
    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        output: {
          schema: z.array(z.object({
            blockId: z.string(),
            type: z.enum(['aroma', 'soundscape', 'visual', 'polish']),
            value: z.string(),
            reasoning: z.string()
          })),
        },
      });
    }, { 
      retries: 2,
      onFailedAttempt: error => console.warn(`[AI Weaver] Composition Analysis Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left: ${extractRetryErrorMessage(error)}`)
    });
    
    if (output) {
      console.log("[AI Weaver] Composition Analysis successful, generated", output.length, "suggestions");
      return output;
    }
    
    return [];
  } catch (error: any) {
    console.error("[AI Weaver] Composition Analysis Failure:", error);
    return [];
  }
}

/**
 * Polishes the story hook to ensure high Scene Clarity.
 */
export async function polishDescription(description: string, options: { sensoryFocus?: string } = {}): Promise<string> {
  console.log(`[AI Weaver] polishDescription triggered. Payload length: ${description?.length || 0}`);
  
  // Safety guard for Next.js Server Action serialization
  const sensoryFocus = (typeof options.sensoryFocus === 'string') ? options.sensoryFocus : undefined;
  if (!description || description.trim().length < 3) {
    console.log("[AI Weaver] Description too short to polish. Skipping.");
    return description || "";
  }

  const ai = await getAI();
  
  const prompt = `
    You are the "Script Supervisor" for Memory Weaver Studio.
    Refine the following "Story Hook" to make it "Cinema Ready."
    
    [ORIGINAL HOOK]
    ${description}
    
    [INSTRUCTIONS]
    - Improve the rhythm and sensory weight of the prose.
    - ${sensoryFocus ? `Focus specifically on infusing ${sensoryFocus} details.` : 'Ensure a balanced emotional clarity.'}
    - Keep it concise (under 80 words).
    - Maintain the user's core intent as an authentic spoken monologue.
    - ABSOLUTELY NO SCREENPLAY OR CAMERA CUES: Do NOT use camera directions, cut notes, or lens cues (e.g. NEVER write "Cut to...", "Wide shot", "The lens zooms").
    - BRITISH ENGLISH (en-GB) ONLY (Rule 20.3): Enforce British/Commonwealth English spelling (e.g. colour, favourite, theatre, realise, centre).
    - DIASPORA VOICE SHIELD: Preserve all South Asian and diaspora heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji) verbatim.
    - BANNED: AI clichés like "tapestry," "odyssey," "whispers," "vibrant," "testament," "unfolding."
    
    Return ONLY the polished text. No quotes, no preamble.
  `;

  try {
    const { text } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        config: { maxOutputTokens: 250, temperature: 0.4 },
      });
    }, { retries: 2 });
    
    const result = text?.trim() || "";
    console.log(`[AI Weaver] polishDescription success. Result length: ${result.length}`);
    return sanitizeProse(result) || description;
  } catch (error: any) {
    console.error(`[AI Weaver] polishDescription Failure [${error.name}]:`, error.message || error);
    return description; // Fallback to original
  }
}

/**
 * Server action to check spelling, grammar, and agreement on user edits
 * without altering the author's voice or rhythm.
 */
export async function checkAndPolishGrammar(text: string): Promise<string> {
  console.log(`[AI Weaver] checkAndPolishGrammar triggered for length ${text?.length || 0}`);
  if (!text || text.trim().length < 5) return text || "";

  try {
    const ai = await getAI();
    const prompt = `
      You are an expert Copyeditor and Teleprompter Proofreader.
      Correct any spelling mistakes, typos, or grammatical agreement errors in the following spoken monologue or memoir recollection.
      
      [TEXT TO PROOFREAD]
      ${text}
      
      [STRICT RULES]
      - Fix spelling mistakes, typos, and grammatical errors (e.g., "helpless three child" -> "helpless three children").
      - Enforce British English (UK) spelling conventions (e.g. colour, favourite, theatre, realise, centre) per Rule 20.
      - DIASPORA VOICE SHIELD: Preserve all South Asian, Gujarati, Punjabi, Hindi, and East African diaspora heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji) verbatim without marking them as errors or anglicising them.
      - Preserve 100% of the author's custom wording, tone, and intended meaning.
      - Do NOT rephrase sentences unnecessarily.
      - ABSOLUTELY NO SCREENPLAY OR CAMERA CUES: Do NOT add camera cues, editing commands, or stage directions per Rule 11.
      
      Return ONLY the corrected spoken text. No preamble, no quotes, no markdown wrappers.
    `;

    const { text: resultText } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        config: { maxOutputTokens: 1500, temperature: 0.1 },
      });
    }, { retries: 2 });
    
    let raw = (resultText?.trim() || text)
      .replace(/^```(?:markdown|text)?\s*|\s*```$/g, '')
      .replace(/^"|"$/g, '')
      .trim();
    const polished = raw || text;
    console.log(`[AI Weaver] checkAndPolishGrammar completed successfully.`);
    return sanitizeProse(polished);
  } catch (error: any) {
    console.error("[AI Weaver] checkAndPolishGrammar failure:", error);
    return text;
  }
}

/**
 * Server action to weave raw bonus memory recollections into rich, sensory memoir prose
 * honoring the author's primary question, observation, or seed while deepening tactile,
 * atmospheric, and generational resonance.
 *
 * Rules:
 * - Rule 11 Screenplay Cue Ban: Strips all stage directions and camera cues via sanitizeProse().
 * - Rule 11 Anti-Trope Ban: Forbids AI clichés ("odyssey", "lineage", "tapestry", "vibrant", "testament", "unfolding", "interwoven", "symphony", "echoes").
 * - Rule 20 UK Orthography: Strictly enforces British English (colour, nourish, realise, honour).
 * - Rule 35.2 / Elder Ergonomics: maxOutputTokens: 250, temperature: 0.35.
 */
export async function weaveBonusNote(
  draftText: string,
  context?: {
    sceneTitle?: string;
    promptQuestion?: string;
    authorName?: string;
  }
): Promise<string> {
  console.log(`[AI Weaver] weaveBonusNote triggered for length ${draftText?.length || 0}`);
  if (!draftText || draftText.trim().length < 5) return draftText || '';

  try {
    const ai = await getAI();
    const prompt = `
      You are an award-winning Literary Memoirist and compassionate Family Biographer.
      Your task is to take an authentic, raw spoken recollection or note from an elder storyteller and weave it into a rich, sensory, and emotionally resonant memoir reflection.

      [STORYTELLER'S RAW NOTE]
      "${draftText.trim()}"

      ${context?.sceneTitle ? `[SCENE THEME]: ${context.sceneTitle}` : ''}
      ${context?.promptQuestion ? `[ORIGINAL PROMPT SEED]: "${context.promptQuestion}"` : ''}

      [STRICT CREATIVE GUIDELINES]
      - First-Person Spoken Voice: Write strictly in first-person singular ("I", "my") as spoken prose meant to be read aloud or recorded.
      - Honour the Core Seed: Preserve the author's primary question, observation, wonder, or memory seed in essence. Do NOT contradict or erase their authentic sentiment.
      - Sensory & Atmospheric Depth: Deepen the tactile, olfactory, acoustic, and atmospheric textures (e.g. warmth of the sun, soil, dust, scent of rain, voices, light).
      - British English (UK) Only: Enforce British English spelling (e.g., colour, favourite, nourish, realise, honour, centre) per Rule 20.
      - DIASPORA VOICE SHIELD: Preserve all South Asian and diaspora heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji) verbatim.
      - Concise & Dignified: Keep the output to a single, lyrical paragraph of approximately 45 to 80 words. Never output an overwhelming essay.
      - ABSOLUTE BAN ON SCREENPLAY / CAMERA CUES (Rule 11): You are writing spoken memoirs, NOT a film script. NEVER write "Cut to...", "Zoom in", "Fade in", "Wide shot", or any stage directions. Every word must be spoken by the narrator.
      - ABSOLUTE BAN ON AI CLICHÉS (Rule 11): NEVER use the following banned words: "odyssey", "lineage", "tapestry", "vibrant", "testament", "unfolding", "interwoven", "symphony", "echoes".

      Return ONLY the woven spoken paragraph. No preamble, no quotes, no markdown wrappers, no bullet points.
    `;

    const { text: resultText } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        config: {
          maxOutputTokens: 250,
          temperature: 0.35,
        },
      });
    }, { retries: 2 });

    let raw = (resultText?.trim() || draftText)
      .replace(/^```(?:markdown|text)?\s*|\s*```$/g, '')
      .replace(/^"|"$/g, '')
      .trim();
    const woven = raw || draftText;
    console.log(`[AI Weaver] weaveBonusNote completed successfully.`);
    return sanitizeProse(woven);
  } catch (error: any) {
    console.error("[AI Weaver] weaveBonusNote failure:", error);
    return draftText;
  }
}

/**
 * Server action to analyze the script for grammar, spelling, and cinematic clarity.
 */
export async function proofreadScript(blocks: ScriptBlock[]): Promise<Array<{
  blockId: string;
  original: string;
  corrected: string;
  reason: string;
}>> {
  console.log(`[AI Weaver] proofreadScript triggered. Blocks count: ${blocks.length}`);
  const ai = await getAI();
  if (!ai) return [];

  const activeBlocks = blocks.filter(b => b.text.trim().length > 0);
  if (activeBlocks.length === 0) return [];

  const scriptContent = activeBlocks.map(b => `[ID: ${b.id}]: ${b.text}`).join('\n\n');

  try {
    const prompt = `
      You are the "Master Editor" and "Grammarian" for Chronicle Cinema.
      Analyze the following script blocks for:
      1. Spelling and Grammar errors.
      2. AI-speak clichés (e.g., "tapestry", "odyssey", "whispers", "vibrant", "testament", "unfolding").
      3. Overuse of weak adverbs (e.g., "very", "really", "actually", "simply", "just").
      
      [SCRIPT CONTENT]
      ${scriptContent}

      [THE INSTRUCTION]
      Identify errors and provide a "corrected" version for each affected block. 
      Keep the corrected version concise and maintain the user's intent.
      Enforce British English (en-GB) spelling conventions (e.g. colour, favourite, theatre, realise, centre) per Rule 20, and NEVER flag or alter South Asian / Diaspora Voice Shield heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji).
      
      Return strictly a JSON array of objects:
      {
        "blockId": "string",
        "original": "string (the segment with the error)",
        "corrected": "string (the fixed segment)",
        "reason": "string (e.g. 'Spelling error', 'AI cliché detected')"
      }
    `;

    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        output: {
          schema: z.array(z.object({
            blockId: z.string(),
            original: z.string(),
            corrected: z.string(),
            reason: z.string()
          })),
        },
      });
    }, { retries: 2 });
    
    return output || [];
  } catch (error) {
    console.error("[AI Weaver] Proofread Failure:", error);
    return [];
  }
}

/**
 * Generates four distinct variations of the story hook for the Director's Cut ceremony.
 * Upgraded to Cinematic Synthesis Engine V7.0 (Parallel 4-Vision Fan-Out with Zero-Thinking Fast Mode).
 */
export async function generateDraftOptions(
  description: string,
  timeframeScope: string = 'Year',
  durationQuantity: number = 1,
  durationUnit: string = 'years',
  narratorAgeAtTime: number = 25,
  memory_date: string = 'Unknown'
): Promise<{
  polishedOriginalHook: string;
  temporalSummary: string;
  visions: Array<{
    visionType: string;
    visionFocus: string;
    cleanScript: string;
    stageDirections: Array<{
      type: 'visual' | 'audio' | 'beat';
      content: string;
      timecode: string;
    }>;
    beatSheet: string[];
    preFlightBrief: {
      sensoryAnchors: string[];
      vocalInstructions: string[];
      heroMoment: string;
    }
  }>
}> {
  const startTimeMs = Date.now();
  console.log(`[AI Weaver] generateDraftOptions V7.0 (Parallel) triggered. Scope: ${timeframeScope} (${durationQuantity} ${durationUnit}), Age: ${narratorAgeAtTime}`);
  
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('dev_simulate_script_corruption')?.value === 'true') {
      console.warn("[AI Weaver] [SIMULATION] Injecting script corruption into draft options!");
      throw new Error("ERROR: [CORRUPTED_METADATA_STREAM] Failed to synthesize clean script draft options due to token corruption.");
    }
  } catch (e: any) {
    if (e.message?.includes("CORRUPTED_METADATA_STREAM")) throw e;
  }

  const safeDescription = (description || '').trim();

  // Mathematical Temporal Span Calculation Engine
  const yearMatch = safeDescription.match(/\b(19\d\d|20\d\d)\b/);
  const parsedAnchorYear = (memory_date !== 'Unknown' && memory_date !== 'none' && !isNaN(Number(memory_date))) 
    ? Number(memory_date) 
    : (yearMatch ? Number(yearMatch[1]) : null);
  
  const endYear = parsedAnchorYear !== null ? parsedAnchorYear + (durationQuantity || 1) : null;
  const estimatedBirthYear = (parsedAnchorYear !== null && narratorAgeAtTime !== undefined) ? (parsedAnchorYear - narratorAgeAtTime) : null;
  
  const anchorYearStr = parsedAnchorYear !== null ? `${parsedAnchorYear}` : (memory_date !== 'Unknown' ? memory_date : 'Historical Era');
  const temporalSpanStr = (parsedAnchorYear !== null && endYear !== null) ? `${parsedAnchorYear}–${endYear}` : anchorYearStr;
  const allowedYears = buildAllowedYearSet(safeDescription, parsedAnchorYear, durationQuantity);

  const rawWordCount = safeDescription.split(/\s+/).filter(Boolean).length;
  const targetScale = Math.max(rawWordCount, 230);
  const targetMin = Math.round(targetScale * 0.85);
  const targetMax = Math.round(targetScale * 1.15);

  const fallbackProse = (await stripScreenplayCues(safeDescription)) as string;
  const cleanedHook = fallbackProse && fallbackProse.length > 0
    ? fallbackProse
    : "A timeless reflection of heritage, survival, and family roots.";
  const defaultTemporalSummary = `Preserved narrative anchors anchored in ${anchorYearStr !== 'Historical Era' ? anchorYearStr : 'the family record'}.`;

  const fallbackVisions: Array<{
    visionType: string;
    visionFocus: string;
    cleanScript: string;
    stageDirections: Array<{ type: 'visual' | 'audio' | 'beat'; content: string; timecode: string }>;
    beatSheet: string[];
    preFlightBrief: { sensoryAnchors: string[]; vocalInstructions: string[]; heroMoment: string };
  }> = [
    {
      visionType: "The Soul-Print",
      visionFocus: "The Soul-Print: Internal resonance & deep family values.",
      cleanScript: cleanedHook,
      stageDirections: [{ type: "audio", content: "Warm ambient acoustic tone", timecode: "00:00" }],
      beatSheet: ["Spiritual Bedrock", "Enduring Heritage"],
      preFlightBrief: {
        sensoryAnchors: ["Family Values", "Heritage Soil"],
        vocalInstructions: ["Speak with reflective warmth", "Maintain steady cadence"],
        heroMoment: "Core value revelation."
      }
    },
    {
      visionType: "The Atmospheric Weave",
      visionFocus: "The Atmospheric Weave: Vivid sensory contrast & physical atmosphere.",
      cleanScript: cleanedHook,
      stageDirections: [{ type: "audio", content: "Documentary room tone", timecode: "00:00" }],
      beatSheet: ["Sensory Contrast", "Physical Landscape"],
      preFlightBrief: {
        sensoryAnchors: ["Environmental Contrast", "Tactile Texture"],
        vocalInstructions: ["Grounded, authentic delivery", "Pause for sensory beats"],
        heroMoment: "Atmospheric shift."
      }
    },
    {
      visionType: "The Flow",
      visionFocus: "Generational Momentum: Effortless teleprompter rhythm & narrative cadence.",
      cleanScript: cleanedHook,
      stageDirections: [{ type: "audio", content: "Subtle rhythmic pulse", timecode: "00:00" }],
      beatSheet: ["Spoken Momentum", "Legacy Arc"],
      preFlightBrief: {
        sensoryAnchors: ["Generational Arc", "Spoken Rhythm"],
        vocalInstructions: ["Maintain natural flow", "Direct teleprompter engagement"],
        heroMoment: "Legacy affirmation."
      }
    },
    {
      visionType: "The Memory Weave",
      visionFocus: "Crown Synthesis: Master fusion of authentic voice, emotional depth, and rhythm.",
      cleanScript: cleanedHook,
      stageDirections: [{ type: "audio", content: "Full cinematic orchestral rise", timecode: "00:00" }],
      beatSheet: ["Master Synthesis", "Crown Monologue"],
      preFlightBrief: {
        sensoryAnchors: ["Master Heritage", "Crown Resolution"],
        vocalInstructions: ["Resonant directorial climax", "Measured concluding pause"],
        heroMoment: "Crown memory synthesis."
      }
    }
  ];

  const visionSpecs = [
    {
      visionType: "The Soul-Print",
      ingressDirective: 'Start with an internal reflection or spiritual bedrock values statement (e.g., "Strength was the only currency my family ever traded in..."). Focus on internal resonance & deep family values.',
    },
    {
      visionType: "The Atmospheric Weave",
      ingressDirective: 'Start directly with a vivid, visceral sensory or environmental contrast (e.g., "Sun-baked earth gave way to the chill of rain on the windowpane..."). Focus on tactile texture & physical atmosphere.',
    },
    {
      visionType: "The Flow",
      ingressDirective: 'Start with spoken momentum or direct narrative action emerging organically from the narrator\'s authentic prose keywords. Focus on effortless teleprompter reading rhythm.',
    },
    {
      visionType: "The Memory Weave",
      ingressDirective: 'Start with a grand master thesis fusing heritage and adaptation. Crown synthesis fusing authentic personal voice, emotional depth, sensory texture, and dynamic rhythm into a master score.',
    },
  ];

  const sharedDirective = `
    DIRECTIVE: CINEMATIC SYNTHESIS ENGINE V7.0 (MATHEMATICAL TEMPORAL HORIZON, DISTINCT INGRESS & WORD-COUNT SCALE PARITY)

    [THE IDENTITY HEADER & NARRATOR PERSPECTIVE]
    - NARRATOR STATUS: Adult reflecting on ${anchorYearStr !== 'Historical Era' ? `the era of ${anchorYearStr}` : 'family roots and memory anchors'}.
    - NARRATOR AGE AT ANCHOR DATE: ${narratorAgeAtTime > 0 ? `${narratorAgeAtTime} YEAR OLD` : 'Not specified (reflect naturally from the narrator\'s prose without inventing an infant or adult age)'}.
    - ESTIMATED BIRTH YEAR: ${estimatedBirthYear !== null && narratorAgeAtTime > 0 ? estimatedBirthYear : 'Not specified'}.
    - THE SEED PRINCIPLE: ${narratorAgeAtTime > 0 && narratorAgeAtTime < 4 ? 'Because age is explicitly < 4, the narrator is the "Seed," not the "Sower." They have ZERO episodic memory. They were carried and shielded.' : 'Narrator is speaking from lived memory and reflective perspective.'}
    - VANTAGE POINT: Frame history with authentic legacy perspective. Prioritize specific family members mentioned in [DATA ANCHORS]. Do not default to "My mother" unless explicitly stated; use inclusive "parents" per user raw input.

    [TIMELESS TEMPORAL CALCULATION HORIZON & ACCURACY MANDATE]
    - ANCHOR YEAR (MEMORY MARK): ${anchorYearStr} (Narrator age: ${narratorAgeAtTime} year old).
    - TIMELINE SPAN HORIZON: ${temporalSpanStr} (${durationQuantity} ${durationUnit}).
    - TEMPORAL FIDELITY RULE: Honor the user's MEMORY MARK anchor year (${anchorYearStr}) as the primary temporal baseline, allowing narrative events to span seamlessly across ${temporalSpanStr}.
    - BAN AMBIGUOUS RELATIVE TEMPORAL PHRASES: NEVER write floating relative phrases like "Rewind thirty years", "A few decades ago", "Thirty years back", or "Some years ago".
    - TIMELESS ORAL HISTORY & ZERO TEMPORAL EXTRAPOLATION RULE (GOV-MW-162): Only use calendar years explicitly declared in [DATA ANCHORS] or the primary anchor (${anchorYearStr}). If recounting earlier ancestral events without an exact calendar year, use respectful relative phrasing ('In those early years,', 'Generations before that turning point,', 'Long before my own memory began,'). Strictly forbidden from inventing unstated calendar years (such as 1956, 1960, etc.).

    [STRICT VOCABULARY & FACTUAL FIDELITY MANDATE - CRITICAL]
    - FACTUAL FIDELITY: Strictly adhere to the exact facts, terminology, and historical details provided in User Memory.
    - NO CONTRADICTORY SYNONYMS: NEVER re-introduce terms or concepts that contradict or modify the user's authentic prose.
    - BANNED CANNED TEMPLATES: NEVER start with "The history I carry...", "My parents describe...", "I was raised on the stories of...", or "The family tells me...".
    - BANNED AI CLICHÉS: NEVER use "odyssey", "lineage", "tapestry", "vibrant", "testament", "unfolding", "interwoven", "symphony".

    [THE SOIL OF TRUTH - DATA ANCHORS]
    - User Memory: "${safeDescription}"
    - STRICT ANCHOR BOUNDARY: Draw strictly from User Memory above; NEVER import outside slogans, family mantras, or biographical details not written by the narrator.

    [FULL-LENGTH SPOKEN MONOLOGUE WORD-COUNT SCALE PARITY MANDATE]
    - TARGET MONOLOGUE LENGTH: Full-length spoken performance monologue targeting ~${targetScale} words (allowable range: ${targetMin} to ${targetMax} words).
    - CLEAN SCRIPT: First-person spoken prose ONLY. No "V.O.", "Narrator:", camera directions, or technical brackets.
    - NO IDENTITY THEFT: Never imply a 1-year-old was an adult, and never invent an infant age when age is unspecified.
    - UK ENGLISH COMPLIANCE & DIASPORA VOICE SHIELD: British spellings ONLY (labour, colour, realise, grey, centre, programme, favourite, honour) and preserve South Asian / diaspora heritage terms (e.g. diya, mandir, masala chai, roti, samosas, ba, bapuji) verbatim.
    - PROPER-NOUN & CULTURAL-FRAMING FIDELITY: Preserve every proper noun (places, towns, family names, languages, landmarks) verbatim as written by the narrator — never alter spelling, substitute neighbouring regions, or invent biographical slogans or cultural clichés not present in User Memory.
  `;

  const SingleVisionSchema = z.object({
    polishedOriginalHook: z.string().optional(),
    temporalSummary: z.string().optional(),
    visionType: z.string(),
    visionFocus: z.string(),
    cleanScript: z.string(),
    stageDirections: z.array(z.object({
      type: z.enum(['visual', 'audio', 'beat']),
      content: z.string(),
      timecode: z.string(),
    })),
    beatSheet: z.array(z.string()),
    preFlightBrief: z.object({
      sensoryAnchors: z.array(z.string()),
      vocalInstructions: z.array(z.string()),
      heroMoment: z.string(),
    }),
  });

  try {
    const ai = await getAI();
    const activeModel = await getActiveModel('genkit');
    console.log(`[AI Weaver] Launching 4 parallel vision calls on model: ${activeModel} (thinkingBudget: 0)`);

    const settled = await Promise.allSettled(
      visionSpecs.map((spec, idx) =>
        pRetry(
          async () => {
            const singleVisionPrompt = `
              ${sharedDirective}

              [ASSIGNED SCORE ANGLE (${idx + 1} OF 4): ${spec.visionType}]
              - OPENING INGRESS & FOCUS: ${spec.ingressDirective}
              - Write a complete ~${targetScale}-word spoken monologue for "${spec.visionType}".
              ${idx === 0 ? '- Also include "polishedOriginalHook" (refined UK English version of the raw input) and "temporalSummary" (1-sentence rationale for the perspective framing).' : ''}
            `;

            const res = await ai.generate({
              prompt: singleVisionPrompt,
              model: activeModel,
              output: {
                schema: SingleVisionSchema,
              },
              config: buildGenkitConfig(activeModel, {
                maxOutputTokens: 2048,
                temperature: 0.75,
              }),
            });

            const out: any = res?.output;
            if (!out) {
              throw new Error(`Empty output for vision ${spec.visionType}`);
            }

            // Support legacy test mocks that return { visions: [...] }
            if (Array.isArray(out.visions) && out.visions.length > 0) {
              const matched = out.visions[idx] || out.visions[0];
              return {
                ...matched,
                visionType: matched.visionType || spec.visionType,
                polishedOriginalHook: out.polishedOriginalHook,
                temporalSummary: out.temporalSummary,
              };
            }

            return {
              ...out,
              visionType: spec.visionType,
            };
          },
          {
            retries: 1,
            onFailedAttempt: (error: any) => {
              console.warn(
                `[AI Weaver] Vision "${spec.visionType}" attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left. Error: ${extractRetryErrorMessage(error)}`
              );
            },
          }
        )
      )
    );

    let resolvedPolishedHook = cleanedHook;
    let resolvedTemporalSummary = defaultTemporalSummary;
    let fulfilledCount = 0;

    const finalVisions = visionSpecs.map((spec, idx) => {
      const result = settled[idx];
      if (result.status === 'fulfilled' && result.value && result.value.cleanScript) {
        fulfilledCount++;
        const v = result.value;
        if (v.polishedOriginalHook && idx === 0) {
          resolvedPolishedHook = sanitizeProseTemporalFidelity(sanitizeProse(v.polishedOriginalHook), allowedYears);
        }
        if (v.temporalSummary && idx === 0) {
          resolvedTemporalSummary = v.temporalSummary;
        }

        return {
          visionType: v.visionType || spec.visionType,
          visionFocus: v.visionFocus || fallbackVisions[idx].visionFocus,
          cleanScript: sanitizeProseTemporalFidelity(sanitizeProse(v.cleanScript), allowedYears),
          stageDirections: Array.isArray(v.stageDirections) && v.stageDirections.length > 0
            ? v.stageDirections
            : fallbackVisions[idx].stageDirections,
          beatSheet: Array.isArray(v.beatSheet) && v.beatSheet.length > 0
            ? v.beatSheet
            : fallbackVisions[idx].beatSheet,
          preFlightBrief: v.preFlightBrief
            ? {
                sensoryAnchors: Array.isArray(v.preFlightBrief.sensoryAnchors)
                  ? v.preFlightBrief.sensoryAnchors.map((a: string) =>
                      sanitizeSensoryAnchorTemporalFidelity(a, allowedYears)
                    )
                  : fallbackVisions[idx].preFlightBrief.sensoryAnchors,
                vocalInstructions: Array.isArray(v.preFlightBrief.vocalInstructions)
                  ? v.preFlightBrief.vocalInstructions
                  : fallbackVisions[idx].preFlightBrief.vocalInstructions,
                heroMoment: v.preFlightBrief.heroMoment || fallbackVisions[idx].preFlightBrief.heroMoment,
              }
            : fallbackVisions[idx].preFlightBrief,
        };
      }

      console.warn(`[AI Weaver] Vision "${spec.visionType}" fell back to resilient template.`);
      return fallbackVisions[idx];
    });

    console.log(
      `[AI Weaver] generateDraftOptions V7.0 completed (${fulfilledCount}/4 AI visions) in ${Date.now() - startTimeMs}ms.`
    );

    return {
      polishedOriginalHook: resolvedPolishedHook,
      temporalSummary: resolvedTemporalSummary,
      visions: finalVisions,
    };
  } catch (error: any) {
    console.error("[AI Weaver] Draft Options Failure. Executing resilient fallback spectrum...", error);
    return {
      polishedOriginalHook: cleanedHook,
      temporalSummary: defaultTemporalSummary,
      visions: fallbackVisions,
    };
  } finally {
    const memory = process.memoryUsage();
    console.log(`[AI Weaver] Memory Snapshot (Draft Options): RSS: ${Math.round(memory.rss / 1024 / 1024)}MB, Heap: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
  }
}

/**
 * Generates a high-end Directorial Pre-Flight Brief for the Recording Floor.
 */
export async function generateDirectorialBrief(
  cleanScript: string,
  stageDirections: any[]
): Promise<{
  sensoryAnchors: string[];
  vocalInstructions: string[];
  soundscapeIntegration: string;
  heroMoment: string;
} | null> {
  console.log("[AI Weaver] generateDirectorialBrief triggered");
  const ai = await getAI();
  
  try {
    const audioCues = (stageDirections || [])
      .filter(sd => sd.type === 'audio')
      .map(sd => sd.content)
      .join(', ');

    const prompt = `
      ACT AS: A High-End Documentary Script Supervisor.
      
      [INPUT]
      Locked Script: "${cleanScript}"
      Audio Cues: "${audioCues || 'Ambient room tone'}"
      
      [TASK]
      Generate a structured "Director's Brief" to guide the speaker during the recording session. 
      This brief serves as a side-car guide for performance, not for the spoken text.
      
      [OUTPUT REQUIREMENTS (UK English Only)]
      1. Sensory Anchors (Aroma & Texture): Identify 2-3 specific sensory memories from the text and provide "Performance Anchors" to help the speaker "feel" the scene.
      2. Vocal Rhythm & Pacing: Provide 3 specific instructions on tone or pacing.
      3. The Soundscape Sync: Map the audio cues to specific performance advice.
      4. Eye-Contact Strategy: Pick the "North Star" sentence of the script for a "Direct-to-Lens" moment.
      
      CONSTRAINT: Strictly no camera placeholders or technical jargon. Focus on the emotional and sensory state of the speaker. Use UK English (e.g., colour, realised, centre).
      
      Return strictly JSON matching this schema:
      {
        "preFlightBrief": {
          "sensoryAnchors": ["string", "string", "string"],
          "vocalInstructions": ["string", "string", "string"],
          "soundscapeIntegration": "string",
          "heroMoment": "string"
        }
      }
    `;

    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        model: GENKIT_MODELS.FLASH_LITE,
        output: {
          schema: z.object({
            preFlightBrief: z.object({
              sensoryAnchors: z.array(z.string()),
              vocalInstructions: z.array(z.string()),
              soundscapeIntegration: z.string(),
              heroMoment: z.string()
            })
          })
        }
      });
    }, { retries: 2 });

    if (output?.preFlightBrief) {
      const allowedYears = buildAllowedYearSet(cleanScript);
      if (Array.isArray(output.preFlightBrief.sensoryAnchors)) {
        output.preFlightBrief.sensoryAnchors = output.preFlightBrief.sensoryAnchors.map((a: string) =>
          sanitizeSensoryAnchorTemporalFidelity(a, allowedYears)
        );
      }
    }
    return output?.preFlightBrief || null;
  } catch (error) {
    console.error("[AI Weaver] generateDirectorialBrief failure:", error);
    return null;
  } finally {
    const memory = process.memoryUsage();
    console.log(`[AI Weaver] Memory Snapshot (Directorial Brief): RSS: ${Math.round(memory.rss / 1024 / 1024)}MB, Heap: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
  }
}
