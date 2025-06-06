
"use server";

import {getPassPrice, type GetPassPriceInput, type GetPassPriceOutput} from '@/ai/flows/get-pass-price-flow';

export async function getPassPriceAction(input: GetPassPriceInput): Promise<GetPassPriceOutput> {
  try {
    const result = await getPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getPassPriceAction:", error);
    // Provide a default/fallback pricing in case of AI error
    // Determine currency based on input, or default if not possible
    let fallbackCurrency = 'USD';
    if (input.city?.toLowerCase() === 'london' && (input.country?.toLowerCase() === 'uk' || input.country?.toLowerCase() === 'united kingdom')) {
        fallbackCurrency = 'GBP';
    }

    return {
      passPrice: fallbackCurrency === 'GBP' ? 7.99 : 9.99, // Fallback price
      currency: fallbackCurrency,
      coffeePrice: 0,
      justification: 'Enjoy a month of shared memories with our standard access pass.',
    };
  }
}
