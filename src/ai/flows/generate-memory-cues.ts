// use server'

/**
 * @fileOverview This file defines a Genkit flow for generating memory cues based on the current date and user profile data.
 *
 * The flow takes user profile data and the current date as input and returns a list of memory cues relevant to the user.
 *
 * @exported
 * - `generateMemoryCues`: The main function to generate memory cues.
 * - `GenerateMemoryCuesInput`: The input type for the generateMemoryCues function.
 * - `GenerateMemoryCuesOutput`: The output type for the generateMemoryCues function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMemoryCuesInputSchema = z.object({
  userProfile: z
    .string()
    .describe('User profile data including demographics, interests, and past events.'),
  currentDate: z
    .string()
    .describe('The current date in ISO format (YYYY-MM-DD).'),
});
export type GenerateMemoryCuesInput = z.infer<typeof GenerateMemoryCuesInputSchema>;

const GenerateMemoryCuesOutputSchema = z.object({
  memoryCues: z
    .array(z.string())
    .describe('An array of memory cues relevant to the user based on their profile and the current date.'),
});
export type GenerateMemoryCuesOutput = z.infer<typeof GenerateMemoryCuesOutputSchema>;

export async function generateMemoryCues(input: GenerateMemoryCuesInput): Promise<GenerateMemoryCuesOutput> {
  return generateMemoryCuesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMemoryCuesPrompt',
  input: {schema: GenerateMemoryCuesInputSchema},
  output: {schema: GenerateMemoryCuesOutputSchema},
  prompt: `You are an AI memory cue generator. Given the user profile and the current date, you will generate a list of memory cues that are relevant to the user.

User Profile: {{{userProfile}}}
Current Date: {{{currentDate}}}

Generate a list of memory cues that would be interesting and relevant to the user. Focus on events, people, and places that the user would likely want to remember. Return an array of strings.

Example:
[
  "That trip to Italy",
  "Your graduation",
  "Meeting your best friend"
]
`,
});

const generateMemoryCuesFlow = ai.defineFlow(
  {
    name: 'generateMemoryCuesFlow',
    inputSchema: GenerateMemoryCuesInputSchema,
    outputSchema: GenerateMemoryCuesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
