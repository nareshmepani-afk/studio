
"use server";

import {getHostPassPrice, type GetHostPassPriceInput, type GetHostPassPriceOutput} from '@/ai/flows/get-host-pass-price-flow';

export async function getHostPassPriceAction(input: GetHostPassPriceInput): Promise<GetHostPassPriceOutput> {
  try {
    const result = await getHostPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getHostPassPriceAction, returning fallback:", error);
    // Fallback logic to prevent server crashes.
    // This provides a default price if the AI flow fails.
    let fallbackCurrency = 'USD';
    if (input.city?.toLowerCase() === 'london' && (input.country?.toLowerCase() === 'uk' || input.country?.toLowerCase() === 'united kingdom')) {
        fallbackCurrency = 'GBP';
    }
    return {
      passPrice: fallbackCurrency === 'GBP' ? 12.99 : 14.99,
      lifetimeVaultPrice: fallbackCurrency === 'GBP' ? 195.00 : 249.00,
      currency: fallbackCurrency,
      coffeePrice: fallbackCurrency === 'GBP' ? 3.50 : 3.00,
      justification: 'Unlock a full month of memory creation tools and preserve your precious moments.',
      vaultMicrocopy: 'Equivalent to 60 local coffees — zero monthly rent forever',
    };
  }
}
