'use server';

import { getAI } from '@/ai/genkit';
import { z } from 'genkit';
import pRetry from 'p-retry';
import { VertexAI } from '@google-cloud/vertexai';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

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
      - Avoid AI-speak: BANNED words include "odyssey," "lineage," "tapestry," or "shores" (unless refers to a physical beach).
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
 * Server action to polish the description/logline.
 */
export async function polishDescription(description: string): Promise<string> {
  console.log("[AI Weaver] polishDescription triggered");
  const ai = await getAI();

  try {
    const prompt = `
      You are an award-winning Literary Memoirist and Family Historian.
      Your task is to transform raw voice-to-text memory fragments into a "Superior" narrative piece.
      
      STYLE RULES:
      1. INTERNAL WORLD: Explore the "invisible" heritage carried across borders.
      2. HIGH-END METAPHORS: Use grounded but profound metaphors (e.g., "Linguistically silent but culturally loud" or "Our history began not with a map, but with the soil").
      3. BANNED AI-SPEAK: Do NOT use "odyssey," "lineage," "tapestry," "unfamiliar shores," or "unfolding."
      4. PRESERVE AUTHENTICITY: Keep Madhapur, Nairobi, Kutch, and specific facts like "vegetarian" and "Gujarati."
      5. LEGACY TONE: Write as if these words will be read by your grandchildren 50 years from now.
      
      CONSTRAINTS:
      - Aim for 120-170 words.
      - Return ONLY the rhythmic, literary prose. No titles, no bracketed text, no meta-commentary.
      - Ensure the final sentence is as impactful as: "They proved that heritage isn't just the language you speak; it's the persistence you show when the words aren't there."

      RAW MEMORY CONTENT:
      "${description}"
    `;

    console.log("[AI Weaver] Sending Polish prompt to Genkit...");
    const { text } = await pRetry(async () => {
      return await ai.generate(prompt);
    }, { retries: 2 });
    
    if (text) {
      console.log("[AI Weaver] Polish successful");
      return text.trim().replace(/^["']|["']$/g, '').replace(/```[a-z]*\n|```/g, '');
    }
    
    throw new Error("AI returned no text");
  } catch (error: any) {
    console.error("[AI Weaver] Polish Failure:", error.message || error);
    throw new Error(`AI Polish Blocked: ${error.message}`);
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

    // 3. Persist to Firestore
    if (!adminDb) throw new Error("Database connection lost");
    
    const analysisRef = adminDb.collection('users').doc(session.uid).collection('memories').doc(memoryId).collection('analysis').doc('notepad');
    const resultToStore = {
      ...notepadData,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };
    
    await analysisRef.set(resultToStore);

    revalidatePath('/studio');
    console.log("[Director's Notepad] Analysis complete and persisted to subdocument.");
    
    return { success: true, data: resultToStore };

  } catch (error: any) {
    console.error("[Director's Notepad] Analysis Failed:", error);
    return { success: false, message: error.message };
  }
}
