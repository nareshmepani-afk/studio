'use server';

import { getAI } from '@/ai/genkit';
import { z } from 'genkit';
import pRetry from 'p-retry';
import { VertexAI } from '@google-cloud/vertexai';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { ScriptBlock } from '@/types';

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
export async function expandWithAI(
  description: string, 
  sensoryConfig: any[], 
  sensoryValues: Record<string, string>,
  emotionTags: string[],
  currentProse: string,
  isRewriteOfSelection: boolean = false
): Promise<{ poetic?: string; direct?: string; nostalgic?: string }> {
  console.log("[AI Weaver] expandWithAI triggered");
  const ai = await getAI();
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  console.log("[AI Weaver] API Key Signature:", key ? `${key.substring(0, 5)}...${key.substring(key.length - 4)}` : "MISSING");
  
  try {
    const sensoryDetailsStr = sensoryConfig.map(s => {
       const val = sensoryValues[s.id];
       if (val) return `${s.label}: ${val}`;
       return null;
    }).filter(Boolean).join('\n');

    const prompt = `
      You are an award-winning Literary Memoirist and Family Historian specializing in "Literary Depth."
      Your task is to transform raw memory fragments into a narrative that explores the internal world and the "invisible" heritage carried across borders.
      
      [INCOMING DATA]
      "Description": ${description}
      "Emotion Tags": ${emotionTags.length > 0 ? emotionTags.join(', ') : 'None specified'}
      "Context": ${
        isRewriteOfSelection 
          ? `(Focusing on this specific segment): "${currentProse}"` 
          : `"${currentProse || 'Empty'}"`
      }
      "Sensory Details": 
      ${sensoryDetailsStr || 'None provided'}
      
      STYLE RULES (THE GOLD STANDARD):
      - Use high-contrast metaphors (e.g., "not a map, but the soil").
      - Focus on the "Linguistically silent but culturally loud" quality of migration.
      - Avoid AI-speak: BANNED words include "odyssey," "lineage," "tapestry," "vibrant," "testament," "unfolding," "interwoven," "symphony," or "shores" (unless refers to a physical beach).
      - Write for future generations.
      
      Craft three (3) distinct "Takes" in this literary style. 
      Each Take must be a single, rhythmic, and meaningful paragraph (100-140 words).
      
      Take 1 ("poetic"): Internal world focus. Reflective and deeply metaphorical.
      Take 2 ("direct"): Humanity and persistence focus. Documentary-style but with literary weight.
      Take 3 ("nostalgic"): Ancestral and generational focus. Passing down values like "Learn. Adapt. Endure."
      
      Return strictly JSON:
      {
         "poetic": "string",
         "direct": "string",
         "nostalgic": "string"
      }
    `;

    console.log("[AI Weaver] Sending prompt to Genkit...");
    const { output } = await pRetry(async () => {
      return await ai.generate({
        prompt,
        output: {
          schema: z.object({
            poetic: z.string(),
            direct: z.string(),
            nostalgic: z.string(),
          }),
        },
      });
    }, { retries: 2, onFailedAttempt: error => console.warn(`[AI Weaver] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`) });

    if (output) {
      console.log("[AI Weaver] Successfully generated cinematic takes");
      return output;
    }
    
    throw new Error("AI returned empty output");
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
      return await ai.generate(prompt);
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

    return text?.trim() || (isGujarati ? "તમારી આ યાદ વિશે મને વધુ કહો; તમને સૌથી વધુ સ્પષ્ટપણે શું યાદ છે?" : "Tell me more about that moment; what do you remember most clearly?");
  } catch (error: any) {
    console.error("Failed to generate interview question:", error);
    return language === 'gu' ? "શું તમે મારી માટે આ યાદના સૌથી આબેહૂબ ભાગ વિશે વિગતવાર જણાવી શકો છો?" : "Could you elaborate on the most vivid part of this memory for me?";
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

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro-002', 
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
      onFailedAttempt: error => console.warn(`[AI Weaver] Composition Analysis Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`)
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
    - ${options.sensoryFocus ? `Focus specifically on infusing ${options.sensoryFocus} details.` : 'Ensure a balanced emotional clarity.'}
    - Keep it concise (under 80 words).
    - Maintain the user's core intent but make it feel like a professional film treatment.
    - BANNED: AI clichés like "tapestry," "odyssey," "whispers," "vibrant," "testament," "unfolding."
    
    Return ONLY the polished text. No quotes, no preamble.
  `;

  try {
    const { text } = await pRetry(async () => {
      return await ai.generate(prompt);
    }, { retries: 2 });
    
    const result = text?.trim() || "";
    console.log(`[AI Weaver] polishDescription success. Result length: ${result.length}`);
    return result || description;
  } catch (error: any) {
    console.error(`[AI Weaver] polishDescription Failure [${error.name}]:`, error.message || error);
    return description; // Fallback to original
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
