
"use server";

import {getPassPrice, type GetPassPriceInput, type GetPassPriceOutput} from '@/ai/flows/get-pass-price-flow';

export async function getPassPriceAction(input: GetPassPriceInput): Promise<GetPassPriceOutput> {
  try {
    const result = await getPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getPassPriceAction, returning fallback:", error);
    // Fallback logic to prevent server crashes.
    // This provides a default price if the AI flow fails.
    let fallbackCurrency = 'USD';
    if (input.city?.toLowerCase() === 'london' && (input.country?.toLowerCase() === 'uk' || input.country?.toLowerCase() === 'united kingdom')) {
        fallbackCurrency = 'GBP';
    }
    return {
      passPrice: fallbackCurrency === 'GBP' ? 7.99 : 9.99,
      currency: fallbackCurrency,
      coffeePrice: fallbackCurrency === 'GBP' ? 3.50 : 3.00,
      justification: 'Enjoy a full month of shared memories, preserved just for you.',
    };
  }
}
