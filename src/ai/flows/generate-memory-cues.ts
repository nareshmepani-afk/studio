
// use server'

/**
 * @fileOverview This file defines a Genkit flow for generating memory cues based on the current date and user profile data.
 *
 * The flow takes user profile data, the current date, and a target language as input and returns a list of memory cues relevant to the user in that language.
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
    .describe('User profile data including demographics, interests, past events, family information, and historical context if relevant.'),
  currentDate: z
    .string()
    .describe('The current date in ISO format (YYYY-MM-DD).'),
  language: z
    .string()
    .describe('The language for the memory cues (e.g., "en" for English, "gu" for Gujarati).'),
});
export type GenerateMemoryCuesInput = z.infer<typeof GenerateMemoryCuesInputSchema>;

const GenerateMemoryCuesOutputSchema = z.object({
  memoryCues: z
    .array(z.string())
    .describe('An array of memory cues relevant to the user based on their profile, the current date, and in the specified language. Consider family relationships and historical periods if mentioned in the profile.'),
});
export type GenerateMemoryCuesOutput = z.infer<typeof GenerateMemoryCuesOutputSchema>;

export async function generateMemoryCues(input: GenerateMemoryCuesInput): Promise<GenerateMemoryCuesOutput> {
  return generateMemoryCuesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMemoryCuesPrompt',
  input: {schema: GenerateMemoryCuesInputSchema},
  output: {schema: GenerateMemoryCuesOutputSchema},
  prompt: `You are an AI memory cue generator specializing in personal and family history.
Given the user profile, the current date, and a target language, you will generate a list of memory cues that are relevant to the user in the specified language.

User Profile: {{{userProfile}}}
Current Date: {{{currentDate}}}
Language: {{{language}}}

Generate a list of memory cues in {{language}} that would be interesting and relevant to the user.
Focus on events, people, and places that the user would likely want to remember.
If the user profile mentions family members, significant life events (like marriages, births, migrations), or specific historical periods they lived through, try to generate cues that touch upon these aspects.
For example, if their profile mentions "grandparents lived through WWII" or "immigrated in the 1970s", cues could relate to those experiences.
Return an array of strings.

Example for English ('en'):
[
  "That trip to Italy with your family",
  "Your grandparents' stories from their youth",
  "The day your first child was born",
  "A significant cultural event you experienced"
]

Example for Gujarati ('gu'):
[
  "તમારા પરિવાર સાથે ઇટાલીની તે સફર",
  "તમારા દાદા-દાદીની યુવાનીની વાર્તાઓ",
  "તમારા પ્રથમ બાળકનો જન્મ થયો તે દિવસ",
  "તમે અનુભવેલી એક મહત્વપૂર્ણ સાંસ્કૃતિક ઘટના"
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

