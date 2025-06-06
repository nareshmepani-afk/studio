
/**
 * @fileOverview A tool to get the average coffee price in a city.
 * - getAverageCoffeePriceTool: The Genkit tool definition.
 * - GetAverageCoffeePriceInputSchema: Input schema for the tool.
 * - GetAverageCoffeePriceOutputSchema: Output schema for the tool.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GetAverageCoffeePriceInputSchema = z.object({
  city: z.string().describe('The city to get the coffee price for.'),
  country: z.string().describe('The country where the city is located.'),
});
export type GetAverageCoffeePriceInput = z.infer<typeof GetAverageCoffeePriceInputSchema>;

export const GetAverageCoffeePriceOutputSchema = z.object({
  price: z.number().describe('The average price of a cup of coffee.'),
  currency: z.string().describe('The currency of the price (e.g., GBP, USD).'),
});
export type GetAverageCoffeePriceOutput = z.infer<typeof GetAverageCoffeePriceOutputSchema>;

export const getAverageCoffeePriceTool = ai.defineTool(
  {
    name: 'getAverageCoffeePrice',
    description: 'Gets the average price of a cup of coffee in a given city and country. This is a mock tool and will return a fixed price for London, UK.',
    inputSchema: GetAverageCoffeePriceInputSchema,
    outputSchema: GetAverageCoffeePriceOutputSchema,
  },
  async (input) => {
    // Mock implementation
    if (input.city.toLowerCase() === 'london' && (input.country.toLowerCase() === 'uk' || input.country.toLowerCase() === 'united kingdom')) {
      return { price: 3.50, currency: 'GBP' };
    }
    // Default mock price if not London, UK
    return { price: 3.00, currency: 'USD' };
  }
);
