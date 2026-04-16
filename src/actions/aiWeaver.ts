'use server';

import { getAI } from '@/ai/genkit';
import { z } from 'genkit';
import pRetry from 'p-retry';

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
  history: string[] = []
): Promise<string> {
  const ai = await getAI();
  try {
    const prompt = `
      You are the "AI Interviewer" for Chronicle Cinema, a podcast-style host that helps users record deep, personal memories.
      
      [CURRENT SCRIPT]
      ${script || "No script yet. We are just starting."}
      
      [CONVERSATION HISTORY]
      ${history.length > 0 ? history.join('\n') : "Beginning of conversation."}
      
      YOUR GOAL:
      Generate ONE inquisitive, warm, and professional follow-up question that helps the user elaborate on the emotional or sensory details of their story.
      
      RULES:
      1. Be concise (max 40 words).
      2. Use a "Podcast Host" tone (Warm, curiosity-driven).
      3. Focus on "The Invisible Details" (the feeling, the smell, the quiet moments).
      4. Do NOT say "Great story" or "I'm interested." Just ask the question or give a brief lead-in.
      5. Reference specific details from the script if available.
      
      Return ONLY the question text.
    `;

    const { text } = await pRetry(async () => {
      return await ai.generate(prompt);
    }, { retries: 2 });

    return text?.trim() || "Tell me more about that moment; what do you remember most clearly?";
  } catch (error: any) {
    console.error("Failed to generate interview question:", error);
    return "Could you elaborate on the most vivid part of this memory for me?";
  }
}
