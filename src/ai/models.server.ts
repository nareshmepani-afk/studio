import { cookies } from 'next/headers';
import { GENKIT_MODELS, VERTEX_MODELS, REPLICATE_MODELS } from './models';

/**
 * Resolves the active model ID on the server, respecting any developer HUD hot-swap overrides.
 */
export async function getActiveModel(service: 'genkit' | 'vertex' | 'replicate'): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const cookieStore = await cookies();
      const override = cookieStore.get(`dev_model_${service}`)?.value;
      if (override) {
        console.log(`[Models Registry] Hot-swap override in effect for ${service}: ${override}`);
        return override;
      }
    } catch (e) {
      // Cookies might not be readable in all contexts (e.g. static builds)
    }
  }

  // Fallback to defaults
  switch (service) {
    case 'genkit':
      return GENKIT_MODELS.FLASH;
    case 'vertex':
      return VERTEX_MODELS.PRO;
    case 'replicate':
      return REPLICATE_MODELS.MUSICGEN;
  }
}
