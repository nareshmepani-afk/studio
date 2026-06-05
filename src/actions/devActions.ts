'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Sets a hot-swap override for a specific AI service model.
 */
export async function setDevModelOverride(service: 'genkit' | 'vertex' | 'replicate', model: string) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized: Dev actions are restricted to development mode.');
  }
  
  const cookieStore = await cookies();
  cookieStore.set(`dev_model_${service}`, model, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
  
  console.log(`[Dev Actions] Model override set: dev_model_${service} = ${model}`);
  revalidatePath('/');
}

/**
 * Clears all model overrides and simulation flags.
 */
export async function clearDevModelOverrides() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized: Dev actions are restricted to development mode.');
  }

  const cookieStore = await cookies();
  cookieStore.delete('dev_model_genkit');
  cookieStore.delete('dev_model_vertex');
  cookieStore.delete('dev_model_replicate');
  cookieStore.delete('dev_simulate_transcoder_error');
  cookieStore.delete('dev_simulate_script_corruption');
  
  console.log('[Dev Actions] Cleared all model and simulation overrides.');
  revalidatePath('/');
}

/**
 * Fetches the currently active overrides.
 */
export async function getDevModelOverrides() {
  if (process.env.NODE_ENV !== 'development') {
    return {
      genkit: null,
      vertex: null,
      replicate: null,
      simulateTranscoderError: false,
      simulateScriptCorruption: false,
    };
  }

  const cookieStore = await cookies();
  return {
    genkit: cookieStore.get('dev_model_genkit')?.value || null,
    vertex: cookieStore.get('dev_model_vertex')?.value || null,
    replicate: cookieStore.get('dev_model_replicate')?.value || null,
    simulateTranscoderError: cookieStore.get('dev_simulate_transcoder_error')?.value === 'true',
    simulateScriptCorruption: cookieStore.get('dev_simulate_script_corruption')?.value === 'true',
  };
}

/**
 * Sets a simulated failure state (e.g. Transcoder failure, script corruption).
 */
export async function setDevSimulationOverride(key: 'transcoder_error' | 'script_corruption', value: boolean) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized: Dev actions are restricted to development mode.');
  }

  const cookieStore = await cookies();
  const cookieName = `dev_simulate_${key}`;
  
  if (value) {
    cookieStore.set(cookieName, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });
    console.log(`[Dev Actions] Simulated edge-case activated: ${cookieName}`);
  } else {
    cookieStore.delete(cookieName);
    console.log(`[Dev Actions] Simulated edge-case deactivated: ${cookieName}`);
  }
  
  revalidatePath('/');
}
