
// src/lib/ffmpeg.ts
// This file handles loading ffmpeg.wasm files from the official CDN and providing helper functions.

// Define a minimal interface for the parts of FFmpeg we use
interface FFmpeg {
  load: (config: any) => Promise<void>;
  FS: (method: 'writeFile' | 'readFile' | 'unlink', ...args: any[]) => any;
  run: (...args: string[]) => Promise<void>;
  setLogger: (logger: ({ type, message }: { type: string; message: string; }) => void) => void;
  isLoaded: () => boolean;
}

// Augment the window interface to declare the FFmpeg property
declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (options: any) => FFmpeg;
      fetchFile: (data: Blob | string | Uint8Array) => Promise<Uint8Array>;
    };
  }
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

// --- Configuration for loading FFmpeg files from CDN ---
const CDN_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';


// Main function to get a loaded FFmpeg instance using a singleton pattern
export async function getFFmpegInstance(): Promise<FFmpeg> {
  // If instance is already loaded and ready, return it immediately.
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    return ffmpegInstance;
  }
  // If an instance is currently being loaded, return the existing promise.
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  // Create a new loading promise. This ensures the loading process only runs once.
  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
        // --- NEW: Use direct dynamic imports for reliability ---
        const { createFFmpeg } = await import(/* @vite-ignore */ 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js');
        const core = await import(/* @vite-ignore */ 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js');
        // --- END NEW ---

        const ffmpeg = createFFmpeg({
           // log: true, // Enable for detailed debugging
           core, // Explicitly provide the loaded core
        });
        
        // Load the core FFmpeg WASM module. Worker and WASM paths are relative to the core path by default.
        await ffmpeg.load({});

        // Store the loaded instance and resolve the promise
        ffmpegInstance = ffmpeg;
        ffmpegLoadingPromise = null;
        resolve(ffmpegInstance);
    } catch (error) {
      console.error("getFFmpegInstance: Critical error during FFmpeg initialization:", error);
      ffmpegInstance = null;
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

export const fetchFile = async (data: Blob | string | Uint8Array): Promise<Uint8Array> => {
    // Ensure FFmpeg is loaded before trying to use fetchFile
    await getFFmpegInstance();
    
    // fetchFile is a static method on the FFmpeg namespace, not the instance
    const { fetchFile: ffmpegFetchFile } = await import(/* @vite-ignore */ 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js');
    if (!ffmpegFetchFile) {
         throw new Error("FFmpeg script or fetchFile is not available after getFFmpegInstance.");
    }

    return ffmpegFetchFile(data);
};

export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  let fileExtension = 'tmp';
  const mimeParts = mediaBlob.type.split('/');
  if (mimeParts.length > 1) {
    const subParts = mimeParts[1].split(';');
    if (subParts.length > 0) {
      fileExtension = subParts[0];
    }
  }
  const fileName = 'input.' + fileExtension;
  let logOutput = "";

  try {
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr' || type === 'ffout') {
        logOutput += message + "\n";
      }
    });

    // Run a minimal command to get media info
    await ffmpeg.run('-i', fileName);

    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}).(\d{2})/);

    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
       const alternativeDurationMatch = logOutput.match(/Duration: (\d+.\d+)/);
       if (alternativeDurationMatch) {
           return parseFloat(alternativeDurationMatch[1]);
       }
      throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");
    }
  } catch (error) {
    console.error("getDurationWithFFmpeg: Error getting duration:", error);
    throw error;
  } finally {
    try {
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ }
    // Reset logger to prevent memory leaks
    ffmpeg.setLogger(() => {});
  }
}

export async function trimMediaWithFFmpeg(mediaBlob: Blob, startTime: number, endTime: number): Promise<Blob> {
    const ffmpeg = await getFFmpegInstance();
    let inputFilenameExtension = 'tmp';
    const inputMimeParts = mediaBlob.type.split('/');
    if (inputMimeParts.length > 1) {
      const inputSubParts = inputMimeParts[1].split(';');
      if (inputSubParts.length > 0) {
        inputFilenameExtension = inputSubParts[0];
      }
    }
    const inputFilename = 'input_trim.' + inputFilenameExtension;
    const outputFilename = 'output_trim.' + inputFilenameExtension;

    try {
        ffmpeg.FS('writeFile', inputFilename, await fetchFile(mediaBlob));
        const duration = endTime - startTime;
        if (duration <= 0) {
            throw new Error("trimMediaWithFFmpeg: End time must be after start time for trimming.");
        }
        
        // Use the '-c copy' command for fast, lossless trimming
        await ffmpeg.run(
            '-ss', startTime.toString(),
            '-i', inputFilename,
            '-t', duration.toString(),
            '-c', 'copy',
            outputFilename
        );

        const data = ffmpeg.FS('readFile', outputFilename);
        const trimmedBlob = new Blob([data.buffer], { type: mediaBlob.type });
        return trimmedBlob;
    } catch (error) {
        console.error("trimMediaWithFFmpeg: Error trimming media:", error);
        throw error;
    } finally {
        try {
            ffmpeg.FS('unlink', inputFilename);
            ffmpeg.FS('unlink', outputFilename);
        } catch(e) { /* Ignore cleanup errors */ }
    }
}
