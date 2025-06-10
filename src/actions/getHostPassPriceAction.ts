
"use server";

import {getHostPassPrice, type GetHostPassPriceInput, type GetHostPassPriceOutput} from '@/ai/flows/get-host-pass-price-flow';

export async function getHostPassPriceAction(input: GetHostPassPriceInput): Promise<GetHostPassPriceOutput> {
  try {
    const result = await getHostPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getHostPassPriceAction:", error);
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
}
