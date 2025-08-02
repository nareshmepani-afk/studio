
// src/lib/ffmpeg.ts
// This file handles loading ffmpeg.wasm files locally or from a CDN and providing helper functions.

// Define a minimal interface for the parts of FFmpeg we use
interface FFmpeg {
  load: (config: any) => Promise<void>;
  FS: (method: 'writeFile' | 'readFile' | 'unlink', ...args: any[]) => any;
  run: (...args: string[]) => Promise<void>;
  setLogger: (logger: ({ type, message }: { type: string; message: string; }) => void) => void;
  isLoaded: () => boolean;
}

// Augment the window interface to declare the FFmpeg property
// This ensures TypeScript knows about the global FFmpeg object
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

// --- Configuration for loading FFmpeg files ---
// Set this to true to attempt loading from CDN first, false to load locally.
const LOAD_FFMPEG_FROM_CDN = true; // Set to true to load from CDN for diagnostics
const CDN_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
const LOCAL_FFMPEG_PATH = '/ffmpeg'; // Files are in public/ffmpeg


// Main function to get a loaded FFmpeg instance
export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    console.log("getFFmpegInstance: FFmpeg instance already loaded.");
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    console.log("getFFmpegInstance: FFmpeg loading already in progress.");
    return ffmpegLoadingPromise;
  }

  console.log("getFFmpegInstance: Initiating FFmpeg load.");
  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
        const ffmpegScriptUrl = LOAD_FFMPEG_FROM_CDN 
            ? `${CDN_BASE_URL}/ffmpeg.js`
            : `${LOCAL_FFMPEG_PATH}/ffmpeg.js`;

        // Check if script is already on the page
        if (!document.querySelector(`script[src="${ffmpegScriptUrl}"]`)) {
            console.log(`getFFmpegInstance: Loading main FFmpeg script from ${ffmpegScriptUrl}`);
            const script = document.createElement('script');
            script.src = ffmpegScriptUrl;
            script.async = true;
            document.head.appendChild(script);

            await new Promise((resolveScript, rejectScript) => {
                script.onload = resolveScript;
                script.onerror = () => rejectScript(new Error(`Failed to load FFmpeg script from ${ffmpegScriptUrl}`));
            });
        }
        
        // Wait for window.FFmpeg to be defined
        await new Promise<void>((resolveWait) => {
            const interval = setInterval(() => {
                if (typeof window.FFmpeg !== 'undefined') {
                    clearInterval(interval);
                    resolveWait();
                }
            }, 100);
        });

        const { createFFmpeg } = window.FFmpeg;
        const ffmpeg = createFFmpeg({
           // log: true, // Enable for detailed debugging
        });
        
        const corePath = LOAD_FFMPEG_FROM_CDN ? `${CDN_BASE_URL}/ffmpeg-core.js` : `${LOCAL_FFMPEG_PATH}/ffmpeg-core.js`;
        console.log(`getFFmpegInstance: Loading FFmpeg core using corePath: ${corePath}`);

        await ffmpeg.load({
           corePath: corePath,
           // workerPath and wasmPath are resolved relative to corePath by default, so not strictly needed if in the same folder
           workerPath: LOAD_FFMPEG_FROM_CDN ? `${CDN_BASE_URL}/ffmpeg-core.worker.js` : `${LOCAL_FFMPEG_PATH}/ffmpeg-core.worker.js`,
           wasmPath: LOAD_FFMPEG_FROM_CDN ? `${CDN_BASE_URL}/ffmpeg-core.wasm` : `${LOCAL_FFMPEG_PATH}/ffmpeg-core.wasm`,
        });

        console.log("getFFmpegInstance: FFmpeg core loaded and initialized successfully.");
        ffmpegInstance = ffmpeg;
        ffmpegLoadingPromise = null; // Reset promise on success
        resolve(ffmpegInstance);
    } catch (error) {
      console.error("getFFmpegInstance: Error initializing FFmpeg:", error);
      ffmpegInstance = null; // Ensure instance is null on error
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

export const fetchFile = async (data: Blob | string | Uint8Array): Promise<Uint8Array> => {
    // Ensure FFmpeg is loaded before fetching files
    await getFFmpegInstance(); // This will ensure ffmpegInstance is available
    
    if (typeof window.FFmpeg === 'undefined' || !window.FFmpeg.fetchFile) {
         throw new Error("FFmpeg script or fetchFile is not available after getFFmpegInstance.");
    }

    return window.FFmpeg.fetchFile(data);
};

// Helper function to check if the main ffmpeg.js script is available globally
export const isFFmpegScriptLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.FFmpeg !== 'undefined';
};

export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  console.log("getDurationWithFFmpeg: Calculating duration.");
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
    console.log("getDurationWithFFmpeg: Writing file to FFmpeg FS.", fileName);
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr' || type === 'ffout') {
        logOutput += message + "\n";
      }
    });

    console.log("getDurationWithFFmpeg: Running FFmpeg command for duration.");
    await ffmpeg.run('-i', fileName);

    console.log("getDurationWithFFmpeg: Parsing FFmpeg log output.");
    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}).(\d{2})/);

    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      console.log("getDurationWithFFmpeg: Duration parsed (H:M:S.cs).");
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
       console.warn("getDurationWithFFmpeg: Could not parse H:M:S.cs duration, trying alternative. Full log:", logOutput);
       const alternativeDurationMatch = logOutput.match(/Duration: (\d+.\d+)/);
       if (alternativeDurationMatch) {
           console.log("getDurationWithFFmpeg: Duration parsed (seconds).");
           return parseFloat(alternativeDurationMatch[1]);
       }
      throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");
    }
  } catch (error) {
    console.error("getDurationWithFFmpeg: Error getting duration:", error);
    throw error;
  } finally {
    try {
      console.log("getDurationWithFFmpeg: Cleaning up FFmpeg FS.");
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ console.warn("getDurationWithFFmpeg: Cleanup failed for", fileName, e);}
    ffmpeg.setLogger(() => {});
  }
}

export async function trimMediaWithFFmpeg(mediaBlob: Blob, startTime: number, endTime: number): Promise<Blob> {
    const ffmpeg = await getFFmpegInstance();
    console.log("trimMediaWithFFmpeg: Trimming media.");
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
        console.log("trimMediaWithFFmpeg: Writing input file to FFmpeg FS.", inputFilename);
        ffmpeg.FS('writeFile', inputFilename, await fetchFile(mediaBlob));
        const duration = endTime - startTime;
        if (duration <= 0) {
            throw new Error("trimMediaWithFFmpeg: End time must be after start time for trimming.");
        }
        
        console.log("trimMediaWithFFmpeg: Running FFmpeg trim command.", '-ss', startTime.toString(), '-i', inputFilename, '-t', duration.toString(), '-c', 'copy', outputFilename);
        await ffmpeg.run(
            '-ss', startTime.toString(),
            '-i', inputFilename,
            '-t', duration.toString(),
            '-c', 'copy',
            outputFilename
        );

        console.log("trimMediaWithFFmpeg: Reading output file from FFmpeg FS.", outputFilename);
        const data = ffmpeg.FS('readFile', outputFilename);
        const trimmedBlob = new Blob([data.buffer], { type: mediaBlob.type });
        console.log("trimMediaWithFFmpeg: Trimming complete.");
        return trimmedBlob;
    } catch (error) {
        console.error("trimMediaWithFFmpeg: Error trimming media:", error);
        throw error;
    } finally {
        try {
            console.log("trimMediaWithFFmpeg: Cleaning up FFmpeg FS.", inputFilename, outputFilename);
            ffmpeg.FS('unlink', inputFilename);
            ffmpeg.FS('unlink', outputFilename);
        } catch(e) { /* Ignore cleanup errors */ console.warn("trimMediaWithFFmpeg: Cleanup failed for", inputFilename, outputFilename, e);}
    }
}

    
