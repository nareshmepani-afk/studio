
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

// Define the output schema for the Host Pass and Lifetime Vault price
const GetHostPassPriceOutputSchema = z.object({
  passPrice: z.number().describe('The calculated price for the 31-day Host Pass, rounded to two decimal places.'),
  lifetimeVaultPrice: z.number().describe('The calculated one-time Lifetime Heirloom Vault price (approx. 60x local coffee price).'),
  currency: z.string().describe('The currency of the pass price (e.g., GBP, USD).'),
  coffeePrice: z.number().describe('The average coffee price that was used for the calculation.'),
  justification: z.string().describe('A brief, friendly justification for the Host Pass price based on the coffee price. Max 1-2 sentences.'),
  vaultMicrocopy: z.string().describe('Microcopy for the Lifetime Vault (e.g., "Equivalent to 60 local coffees — zero monthly rent forever").'),
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
Your task is to determine a fair and attractive price for a 31-day Host Pass and a Lifetime Heirloom Vault based on local coffee prices.
The 31-day Host Pass should be ~3 to 4 times the local coffee price.
The Lifetime Heirloom Vault should be ~60 times the local coffee price (rounded to a clean integer, e.g. 195 or 249).

Use the 'getAverageCoffeePrice' tool to find the current average coffee price for the user's location.
User's location:
City: {{{city}}}
Country: {{{country}}}

Once the coffee price is obtained:
1. Calculate passPrice (3.5x coffee price, rounded to .99 or .00).
2. Calculate lifetimeVaultPrice (60x coffee price, rounded clean).
3. Create justification and vaultMicrocopy ("Equivalent to 60 local coffees — zero monthly rent forever").
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
      let fallbackCurrency = 'USD';
      if (input.city?.toLowerCase() === 'london' && (input.country?.toLowerCase() === 'uk' || input.country?.toLowerCase() === 'united kingdom')) {
          fallbackCurrency = 'GBP';
      }
      const coffee = fallbackCurrency === 'GBP' ? 3.50 : 3.00;
      return {
        passPrice: fallbackCurrency === 'GBP' ? 12.99 : 14.99,
        lifetimeVaultPrice: fallbackCurrency === 'GBP' ? 195.00 : 249.00,
        currency: fallbackCurrency,
        coffeePrice: coffee,
        justification: 'Unlock a full month of memory creation tools for less than 4 coffees!',
        vaultMicrocopy: 'Equivalent to 60 local coffees — zero monthly rent forever',
      };
    }

    const calculatedVault = output.lifetimeVaultPrice || Math.round(output.coffeePrice * 60);
    return {
      ...output,
      lifetimeVaultPrice: calculatedVault,
      vaultMicrocopy: output.vaultMicrocopy || 'Equivalent to 60 local coffees — zero monthly rent forever'
    };
  }
);
