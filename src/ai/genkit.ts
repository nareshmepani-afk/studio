import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GoogleAuth } from 'google-auth-library';
import { GENKIT_MODELS, getActiveModel } from '@/ai/models';

/**
 * Chronicle Cinema "Dynamic Token Bridge"
 * 
 * To bypass referrer restrictions and Vertex AI billing gaps, we use a 
 * Service Account to generate a temporary OAuth token, which is then 
 * injected into the standard Google AI (Generative Language) plugin.
 */

const serviceAccountRaw = process.env.SERVICE_ACCOUNT_JSON;
let credentials: any;

if (serviceAccountRaw) {
  try {
    const cleanJson = serviceAccountRaw.trim().replace(/^['"]|['"]$/g, '');
    const parsed = JSON.parse(cleanJson);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    credentials = parsed;
  } catch (e) {
    console.error("[Genkit] JSON Parse Error for Service Account:", e);
  }
}

/**
 * Returns a configured Genkit instance with a fresh Service Account token.
 * This is called by Server Actions to ensure a valid connection.
 */
export async function getAI() {
  let customHeaders: Record<string, string> = {};

  if (credentials) {
    try {
      const auth = new GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/generative-language',
          'https://www.googleapis.com/auth/cloud-platform'
        ],
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      const token = tokenResponse.token;
      
      if (token) {
        customHeaders['Authorization'] = `Bearer ${token}`;
      }
      console.log(`[Genkit] Auth Mode: ${Object.keys(customHeaders).length > 0 ? 'Service Account' : 'API Key'}`);
    } catch (err) {
      console.error("[Genkit] Failed to generate Service Account token:", err);
    }
  }

  const activeModel = await getActiveModel('genkit');

  return genkit({
    plugins: [
      googleAI({ 
        apiKey: Object.keys(customHeaders).length > 0 ? false : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        customHeaders
      })
    ],
    model: activeModel,
  });
}

// Keeping a legacy export for compatibility, though getAI() is now preferred for auth-vetted calls
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY })],
  model: GENKIT_MODELS.FLASH,
});
