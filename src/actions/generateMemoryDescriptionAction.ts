
"use server";

import { generateMemoryDescription, type GenerateMemoryDescriptionInput, type GenerateMemoryDescriptionOutput } from '@/ai/flows/generate-memory-description-flow';

export async function generateMemoryDescriptionAction(input: GenerateMemoryDescriptionInput): Promise<GenerateMemoryDescriptionOutput> {
  try {
    const result = await generateMemoryDescription(input);
    return result;
  } catch (error) {
    console.error("Error generating memory description suggestions:", error);
    // Re-throw the error to be caught by the client-side handler
    // Or, provide a more generic fallback if re-throwing is problematic for UI
    throw error;
  }
}
