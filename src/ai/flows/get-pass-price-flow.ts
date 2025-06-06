
'use server';
/**
 * @fileOverview A Genkit flow to determine the price of a 31-day pass based on local coffee prices.
 *
 * @exported
 * - `getPassPrice`: The main function to calculate the pass price.
 * - `GetPassPriceInput`: The input type for the getPassPrice function.
 * - `GetPassPriceOutput`: The output type for the getPassPrice function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getAverageCoffeePriceTool, GetAverageCoffeePriceInputSchema} from '@/ai/tools/get-coffee-price-tool';

// Use the imported schema for defining the input type
export type GetPassPriceInput = z.infer<typeof GetAverageCoffeePriceInputSchema>;

// Define the output schema locally and do not export it as a const
const GetPassPriceOutputSchema = z.object({
  passPrice: z.number().describe('The calculated price for the 31-day pass, rounded to two decimal places.'),
  currency: z.string().describe('The currency of the pass price (e.g., GBP, USD).'),
  coffeePrice: z.number().describe('The average coffee price that was used for the calculation.'),
  justification: z.string().describe('A brief, friendly justification for the pass price based on the coffee price. Max 1-2 sentences.'),
});
export type GetPassPriceOutput = z.infer<typeof GetPassPriceOutputSchema>;

export async function getPassPrice(input: GetPassPriceInput): Promise<GetPassPriceOutput> {
  return getPassPriceFlow(input);
}

const passPricePrompt = ai.definePrompt({
  name: 'getPassPricePrompt',
  tools: [getAverageCoffeePriceTool],
  input: { schema: GetAverageCoffeePriceInputSchema }, // Use the imported schema here
  output: { schema: GetPassPriceOutputSchema }, // Use the local output schema here
  prompt: `You are a pricing assistant for a digital memory sharing app called "Memory Weaver".
Your task is to determine a fair and attractive price for a 31-day access pass. This pass allows users to view memories shared with them by others.
The pricing strategy should be based on the local average price of a cup of coffee. The pass should feel like an affordable treat, roughly equivalent to the cost of 2 to 3 cups of coffee.

Use the 'getAverageCoffeePrice' tool to find the current average coffee price for the user's location.
User's location:
City: {{{city}}}
Country: {{{country}}}

Once the coffee price is obtained, follow these steps:
1.  Calculate a pass price. This price should be between 2.0 and 3.0 times the retrieved coffee price.
2.  Round the final pass price to two decimal places.
3.  Create a short, friendly justification for this price. It should be appealing to the user and highlight the value (e.g., "Enjoy a whole month of shared memories for less than the price of 3 coffees!"). Keep it to 1-2 sentences.
4.  Ensure your output strictly adheres to the GetPassPriceOutputSchema, providing 'passPrice', 'currency', 'coffeePrice' (the value returned by the tool), and 'justification'.
`,
});

const getPassPriceFlow = ai.defineFlow(
  {
    name: 'getPassPriceFlow',
    inputSchema: GetAverageCoffeePriceInputSchema, // Use the imported schema here
    outputSchema: GetPassPriceOutputSchema, // Use the local output schema here
  },
  async (input) => {
    const {output} = await passPricePrompt(input);
    if (!output) {
      console.error('No output from passPricePrompt for input:', input);
      throw new Error('Failed to get a response from the pricing prompt.');
    }
    return output;
  }
);
