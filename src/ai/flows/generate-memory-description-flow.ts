
'use server';
/**
 * @fileOverview A Genkit flow to generate memory description suggestions.
 *
 * This flow takes a memory's title, category, and date as input,
 * and returns a list of potential description suggestions.
 *
 * @exported
 * - `generateMemoryDescription`: The main function to generate description suggestions.
 * - `GenerateMemoryDescriptionInput`: The input type for the generateMemoryDescription function.
 * - `GenerateMemoryDescriptionOutput`: The output type for the generateMemoryDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMemoryDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the memory.'),
  category: z.string().optional().describe('The category of the memory (e.g., Travel, Family).'),
  date: z.string().optional().describe('The date of the memory (ISO format, e.g., YYYY-MM-DD).'),
  userProfileNotes: z.string().optional().describe('Brief notes about the user (e.g., interests, personality traits) to help personalize the description. Max 1-2 sentences.'),
});
export type GenerateMemoryDescriptionInput = z.infer<typeof GenerateMemoryDescriptionInputSchema>;

const GenerateMemoryDescriptionOutputSchema = z.object({
  descriptionSuggestions: z
    .array(z.string())
    .describe('An array of 2-3 distinct memory description suggestions. Each suggestion should be 1-3 sentences long.'),
});
export type GenerateMemoryDescriptionOutput = z.infer<typeof GenerateMemoryDescriptionOutputSchema>;

export async function generateMemoryDescription(input: GenerateMemoryDescriptionInput): Promise<GenerateMemoryDescriptionOutput> {
  return generateMemoryDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMemoryDescriptionPrompt',
  input: {schema: GenerateMemoryDescriptionInputSchema},
  output: {schema: GenerateMemoryDescriptionOutputSchema},
  prompt: `You are an expert creative writer specializing in crafting engaging and evocative memory descriptions.
Given the title of a memory, its category (if provided), the date it occurred (if provided), and optional user profile notes, generate 2-3 distinct description suggestions.
Each suggestion should be 1-3 sentences long and capture the essence of the memory.
Aim for varied tones: some could be reflective, some joyful, some adventurous, etc., depending on the input.

Memory Title: {{{title}}}
{{#if category}}Memory Category: {{{category}}}{{/if}}
{{#if date}}Memory Date: {{{date}}}{{/if}}
{{#if userProfileNotes}}User Profile Notes: {{{userProfileNotes}}} (Use these notes to subtly tailor the tone or focus if relevant, but don't directly quote them. E.g., if user likes humor, one suggestion could be witty. If user is reflective, one could be more thoughtful.){{/if}}

Generate 2-3 distinct description suggestions.

Example output format:
{
  "descriptionSuggestions": [
    "A truly unforgettable day exploring [details from title/category]. The weather was perfect and the company even better!",
    "Reflecting on this moment from [date if provided, otherwise context from title]. So many emotions captured here.",
    "Still laughing about what happened when [reference title/category]. Definitely one for the books!"
  ]
}
`,
});

const generateMemoryDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMemoryDescriptionFlow',
    inputSchema: GenerateMemoryDescriptionInputSchema,
    outputSchema: GenerateMemoryDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.descriptionSuggestions || output.descriptionSuggestions.length === 0) {
        // Fallback if AI returns empty or invalid output
        return { descriptionSuggestions: [`A memorable moment: ${input.title}.`, `Thinking back to ${input.title}.`, `An interesting experience related to ${input.title}.`] };
    }
    return output;
  }
);
