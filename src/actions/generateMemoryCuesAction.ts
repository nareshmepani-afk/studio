
'use server';

import { generateMemoryCues } from '@/ai/flows/generate-memory-cues';
import type { GenerateMemoryCuesInput, GenerateMemoryCuesOutput } from '@/ai/flows/generate-memory-cues';

export async function generateMemoryCuesAction(input: GenerateMemoryCuesInput): Promise<GenerateMemoryCuesOutput> {
  // TODO: Implement the logic to generate memory cues.
  console.log('Generating memory cues...');
  const result = await generateMemoryCues(input);
  return result;
}
