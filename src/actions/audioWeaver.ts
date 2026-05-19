'use server';

import { adminStorage } from '@/lib/firebase-admin';
import pRetry, { AbortError } from 'p-retry';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// MusicGen Large model version
const MUSICGEN_MODEL_VERSION = "b05b39c70a243e86c07172088f117c014db7f7b11d8c11438965f7c32087c53d";
// Safe ambient fallback to prevent stalling the Recording Floor
const SAFE_BACKUP_URL = "https://firebasestorage.googleapis.com/v0/b/memory-weaver-8rk9t.appspot.com/o/assets%2Fsfx%2Fambient_director_fallback.mp3?alt=media";
const GENERATION_TIMEOUT_MS = 45000; // Hard 45s limit as per Directive

/**
 * Server action to generate a cinematic soundtrack using Replicate (MusicGen).
 * Implements a caching layer via Firebase Storage.
 */
export async function generateSoundtrack(
  prompt: string, 
  productionId: string, 
  visionType: string
): Promise<string | null> {
  console.log(`[Audio Weaver] generateSoundtrack triggered for production: ${productionId}`);
  
  if (!REPLICATE_API_TOKEN) {
    console.warn("[Audio Weaver] REPLICATE_API_TOKEN is missing from environment. Soundtrack generation skipped.");
    return null;
  }

  const normalizedVision = visionType.toLowerCase().replace(/\s+/g, '_');
  const cachePath = `assets/sfx/${productionId}_${normalizedVision}.mp3`;
  
  try {
    const bucket = adminStorage?.bucket();
    if (!bucket) {
      console.error("[Audio Weaver] Firebase Storage Bucket unavailable");
      return null;
    }

    // 1. Check Cache Layer
    const file = bucket.file(cachePath);
    const [exists] = await file.exists();
    if (exists) {
      console.log(`[Audio Weaver] Cache hit: ${cachePath}`);
      // Return the public-ish URL (using the direct path format used in the project)
      const encodedPath = encodeURIComponent(cachePath);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    }

    console.log(`[Audio Weaver] Cache miss. Initiating Replicate synthesis: "${prompt}"`);

    // 2. Trigger Replicate Prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: MUSICGEN_MODEL_VERSION,
        input: {
          prompt: `${prompt}, cinematic, high quality, atmospheric, ambient loop`,
          duration: 30,
          model_version: "large",
          output_format: "mp3",
          top_k: 250,
          top_p: 0,
          temperature: 1,
          classifier_free_guidance: 3
        },
      }),
    });

    const prediction = await response.json();
    if (!prediction.id || !prediction.urls?.get) {
      console.error("[Audio Weaver] Replicate prediction failed to initialize:", prediction);
      throw new Error("Failed to create Replicate prediction");
    }

    // 3. Poll for Completion with Exponential Backoff
    let audioUrl: string | null = null;
    const pollUrl = prediction.urls.get;

    const startTime = Date.now();
    await pRetry(async () => {
      // Hard timeout check
      if (Date.now() - startTime > GENERATION_TIMEOUT_MS) {
        throw new AbortError("Soundtrack generation timed out (45s limit reached). Falling back to ambient score.");
      }

      const pollRes = await fetch(pollUrl, {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
      });
      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        audioUrl = pollData.output;
      } else if (pollData.status === "failed") {
        throw new AbortError(`Replicate prediction failed: ${pollData.error}`);
      } else {
        throw new Error(`Prediction status: ${pollData.status}`);
      }
    }, {
      retries: 20,
      minTimeout: 2000,
      maxTimeout: 5000,
      onFailedAttempt: context => console.log(`[Audio Weaver] Polling Replicate... Attempt ${context.attemptNumber} - ${context.error.message}`)
    });

    if (!audioUrl) throw new Error("Replicate synthesis completed but output URL is missing.");

    // 4. Ingest to Firebase Storage
    console.log(`[Audio Weaver] Synthesis complete. Ingesting to Firebase: ${cachePath}`);
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("Failed to download generated audio from Replicate.");
    
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    await file.save(audioBuffer, {
      metadata: { 
        contentType: 'audio/mpeg',
        metadata: {
          prompt: prompt,
          productionId: productionId,
          visionType: visionType
        }
      },
    });

    const encodedPath = encodeURIComponent(cachePath);
    const finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    console.log(`[Audio Weaver] Soundtrack successfully sealed: ${finalUrl}`);
    return finalUrl;

  } catch (error: any) {
    console.error("[Audio Weaver] PIPELINE FAILURE/TIMEOUT:", error.message || error);
    // Return the safe ambient backup to ensure the user isn't left in silence
    console.log("[Audio Weaver] Serving cinematic fallback: ", SAFE_BACKUP_URL);
    return SAFE_BACKUP_URL;
  } finally {
    const memory = process.memoryUsage();
    console.log(`[Audio Weaver] Memory Snapshot (Post-Gen): RSS: ${Math.round(memory.rss / 1024 / 1024)}MB, Heap: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
  }
}
