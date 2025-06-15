
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
    .describe('User profile data including demographics, interests, past events, family information, historical context, or specific decades/periods they lived through if relevant.'),
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
    .describe('An array of memory cues (chapter ideas) relevant to the user based on their profile, the current date, and in the specified language. Consider family relationships and historical periods if mentioned in the profile.'),
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
Your goal is to provide evocative chapter ideas for a user's life story.
Given the user profile, the current date, and a target language, generate a list of memory cues in the specified language.

User Profile: {{{userProfile}}}
Current Date: {{{currentDate}}}
Language: {{{language}}}

Generate a list of memory cues (chapter ideas) in {{language}}. These cues should be:
1.  **Personally Relevant**: Focus on events, people, places, and feelings the user would likely want to remember based on their profile.
2.  **Contextually Enriched (If Possible)**: If the user's profile mentions specific historical periods, decades they lived through (e.g., "childhood in the 1960s London", "university during the dot-com boom"), or significant life events (e.g., "immigrated during the 1980s", "experienced a major natural disaster"), try to subtly weave in the general atmosphere, common experiences, or societal shifts of those times into some of the cues. For example, instead of just "Childhood games", it could be "Playing outside: Recollections of popular games and neighborhood life in the [Decade/Era mentioned]". Do NOT invent specific historical facts the user didn't mention, but evoke the *feeling* or general context of the period if their profile provides such hints. If the profile is very generic, focus primarily on personal themes.
3.  **Family Oriented**: If family members or relationships are prominently mentioned, include cues that touch upon these aspects.
4.  **Actionable**: Phrase cues as compelling chapter titles or clear starting points for telling a story. Aim for 5-7 diverse cues.

Return an array of strings.

Example for English ('en') if profile mentions "grew up in the 70s, loved music, and talks about their parents":
[
  "The Soundtrack of My Youth: Bands and Songs that Defined the 70s for Me",
  "School Days and Playground Politics in the Seventies",
  "Lessons My Parents Taught Me: Values That Shaped My Life",
  "Family Holidays: Adventures and Misadventures",
  "First Job Jitters and Early Career Steps in a Changing World"
]

Example for Gujarati ('gu') if profile mentions "lived through the independence movement and has strong family bonds":
[
  "સ્વતંત્રતા ચળવળના દિવસો: મારી યાદો અને અનુભવો",
  "મારા બાળપણનું ગામ: તે સમયનું જીવન અને સમાજ",
  "પરિવારના વડીલો પાસેથી સાંભળેલી વાર્તાઓ અને સંસ્કાર",
  "જીવનના મહત્વપૂર્ણ વળાંકો અને પારિવારિક નિર્ણયો",
  "એ સમયની સામાજિક અને રાજકીય પરિસ્થિતિનો મારા પર પ્રભાવ"
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

