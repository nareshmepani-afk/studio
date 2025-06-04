
"use server";

import { generateMemoryCues, type GenerateMemoryCuesInput, type GenerateMemoryCuesOutput } from '@/ai/flows/generate-memory-cues';

export async function generateMemoryCuesAction(input: GenerateMemoryCuesInput): Promise<GenerateMemoryCuesOutput> {
  try {
    const result = await generateMemoryCues(input);
    return result;
  } catch (error) {
    console.error("Error generating memory cues:", error);
    // Return a structured error or rethrow, depending on how you want to handle it client-side
    // For now, returning an empty array of cues on error.
    return { memoryCues: [] };
  }
}
