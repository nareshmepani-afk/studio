
"use server";

import {getHostPassPrice, type GetHostPassPriceInput, type GetHostPassPriceOutput} from '@/ai/flows/get-host-pass-price-flow';

export async function getHostPassPriceAction(input: GetHostPassPriceInput): Promise<GetHostPassPriceOutput> {
  try {
    const result = await getHostPassPrice(input);
    return result;
  } catch (error) {
    console.error("Error in getHostPassPriceAction:", error);
    // Re-throw the error to be caught by the client-side handler
    // Fallback logic will be handled in AuthContext or the calling component
    throw error;
  }
}
