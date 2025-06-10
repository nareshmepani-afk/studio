
'use server';
/**
 * @fileOverview A Genkit flow to determine the price of a 31-day Host Pass.
 * This pass allows hosts to create and manage memories.
 *
 * @exported
 * - `getHostPassPrice`: The main function to calculate the host pass price.
 * - `GetHostPassPriceInput`: The input type for the getHostPassPrice function (reuses GetAverageCoffeePriceInputSchema).
 * - `GetHostPassPriceOutput`: The output type for the getHostPassPrice function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getAverageCoffeePriceTool, GetAverageCoffeePriceInputSchema} from '@/ai/tools/get-coffee-price-tool';

// Use the imported schema for defining the input type for this flow as well.
export type GetHostPassPriceInput = z.infer<typeof GetAverageCoffeePriceInputSchema>;

// Define the output schema for the Host Pass price
const GetHostPassPriceOutputSchema = z.object({
  passPrice: z.number().describe('The calculated price for the 31-day Host Pass, rounded to two decimal places.'),
  currency: z.string().describe('The currency of the pass price (e.g., GBP, USD).'),
  coffeePrice: z.number().describe('The average coffee price that was used for the calculation.'),
  justification: z.string().describe('A brief, friendly justification for the Host Pass price based on the coffee price. Max 1-2 sentences. Mention it unlocks creation features.'),
});
export type GetHostPassPriceOutput = z.infer<typeof GetHostPassPriceOutputSchema>;

export async function getHostPassPrice(input: GetHostPassPriceInput): Promise<GetHostPassPriceOutput> {
  return getHostPassPriceFlow(input);
}

const hostPassPricePrompt = ai.definePrompt({
  name: 'getHostPassPricePrompt',
  tools: [getAverageCoffeePriceTool],
  input: { schema: GetAverageCoffeePriceInputSchema },
  output: { schema: GetHostPassPriceOutputSchema },
  prompt: `You are a pricing assistant for a digital memory sharing app called "Memory Weaver".
Your task is to determine a fair and attractive price for a 31-day Host Pass. This pass allows users to access all memory creation features, including recording video/audio, full "My Life Journey" chapter access, and a standard storage quota.
The pricing strategy should be based on the local average price of a cup of coffee. The pass should feel like an affordable investment for preserving memories, roughly equivalent to the cost of 3 to 4 cups of coffee.

Use the 'getAverageCoffeePrice' tool to find the current average coffee price for the user's location.
User's location:
City: {{{city}}}
Country: {{{country}}}

Once the coffee price is obtained, follow these steps:
1.  Calculate a Host Pass price. This price should be between 3.0 and 4.0 times the retrieved coffee price.
2.  Round the final pass price to two decimal places.
3.  Create a short, friendly justification for this price. It should be appealing to the user and highlight the value (e.g., "Unlock a full month of memory creation and storage for less than the price of 4 coffees!"). Keep it to 1-2 sentences.
4.  Ensure your output strictly adheres to the GetHostPassPriceOutputSchema, providing 'passPrice', 'currency', 'coffeePrice' (the value returned by the tool), and 'justification'.
`,
});

const getHostPassPriceFlow = ai.defineFlow(
  {
    name: 'getHostPassPriceFlow',
    inputSchema: GetAverageCoffeePriceInputSchema,
    outputSchema: GetHostPassPriceOutputSchema,
  },
  async (input) => {
    const {output} = await hostPassPricePrompt(input);
    if (!output) {
      console.error('No output from getHostPassPricePrompt for input:', input);
      // Provide a default/fallback pricing in case of AI error
      let fallbackCurrency = 'USD';
      if (input.city?.toLowerCase() === 'london' && (input.country?.toLowerCase() === 'uk' || input.country?.toLowerCase() === 'united kingdom')) {
          fallbackCurrency = 'GBP';
      }
      return {
        passPrice: fallbackCurrency === 'GBP' ? 12.99 : 14.99, // Fallback price
        currency: fallbackCurrency,
        coffeePrice: fallbackCurrency === 'GBP' ? 3.50 : 3.00, // Mock coffee price
        justification: 'Unlock a full month of memory creation tools and preserve your precious moments.',
      };
    }
    return output;
  }
);
