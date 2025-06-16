
"use server";

import { generateMemoryCues, type GenerateMemoryCuesInput, type GenerateMemoryCuesOutput } from '@/ai/flows/generate-memory-cues';

export async function generateMemoryCuesAction(input: GenerateMemoryCuesInput): Promise<GenerateMemoryCuesOutput> {
  try {
    const result = await generateMemoryCues(input);
    return result;
  } catch (error) {
    console.error("Error generating memory cues:", error);
    // Re-throw the error to be caught by the client-side handler
    throw error;
  }
}
