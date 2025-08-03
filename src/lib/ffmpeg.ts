
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
// Set to true to load from CDN. This is now the permanent solution.
const LOAD_FFMPEG_FROM_CDN = true;
const CDN_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
const LOCAL_FFMPEG_PATH = '/ffmpeg'; // Kept for reference, but not used


// Main function to get a loaded FFmpeg instance
export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
        const ffmpegScriptUrl = `${CDN_BASE_URL}/ffmpeg.js`;

        if (!document.querySelector(`script[src="${ffmpegScriptUrl}"]`)) {
            const script = document.createElement('script');
            script.src = ffmpegScriptUrl;
            script.async = true;
            document.head.appendChild(script);

            await new Promise((resolveScript, rejectScript) => {
                script.onload = resolveScript;
                script.onerror = () => rejectScript(new Error(`Failed to load FFmpeg script from ${ffmpegScriptUrl}`));
            });
        }
        
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
        
        const corePath = `${CDN_BASE_URL}/ffmpeg-core.js`;

        await ffmpeg.load({
           corePath: corePath,
           workerPath: `${CDN_BASE_URL}/ffmpeg-core.worker.js`,
           wasmPath: `${CDN_BASE_URL}/ffmpeg-core.wasm`,
        });

        ffmpegInstance = ffmpeg;
        ffmpegLoadingPromise = null;
        resolve(ffmpegInstance);
    } catch (error) {
      console.error("getFFmpegInstance: Error initializing FFmpeg from CDN:", error);
      ffmpegInstance = null;
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

export const fetchFile = async (data: Blob | string | Uint8Array): Promise<Uint8Array> => {
    await getFFmpegInstance();
    
    if (typeof window.FFmpeg === 'undefined' || !window.FFmpeg.fetchFile) {
         throw new Error("FFmpeg script or fetchFile is not available after getFFmpegInstance.");
    }

    return window.FFmpeg.fetchFile(data);
};

export const isFFmpegScriptLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.FFmpeg !== 'undefined';
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
