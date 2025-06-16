
"use server";

import {getPassPrice, type GetPassPriceInput, type GetPassPriceOutput} from '@/ai/flows/get-pass-price-flow';

export async function getPassPriceAction(input: GetPassPriceInput): Promise<GetPassPriceOutput> {
  try {
    const result = await getPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getPassPriceAction:", error);
    // Re-throw the error to be caught by the client-side handler
    // Fallback logic will be handled in AuthContext or the calling component
    throw error;
  }
}
