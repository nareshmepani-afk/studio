
// src/lib/ffmpeg.ts
// This file handles loading FFmpeg.wasm and provides helper functions.

interface FFmpeg {
  load: () => Promise<void>;
  FS: (method: 'writeFile' | 'readFile' | 'unlink', ...args: any[]) => any;
  run: (...args: string[]) => Promise<void>;
  setLogger: (logger: ({ type, message }: { type: string; message: string; }) => void) => void;
  isLoaded: () => boolean;
}

declare global {
  interface Window {
    FFmpegWASM: { // Updated global object name
      createFFmpeg: (options?: any) => FFmpeg; // createFFmpeg accepts options
      fetchFile: (data: Blob | string | Uint8Array) => Promise<Uint8Array>;
    };
  }
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

  return new Promise((resolve, reject) => {
    // Check if the script is already loaded and correct
    if (window.FFmpegWASM && typeof window.FFmpegWASM.createFFmpeg === 'function') {
      return resolve();
    }
    
    // If a script tag with this src already exists, remove it to ensure a fresh load
    const existingScript = document.querySelector(`script[src="${FFMPEG_SCRIPT_URL}"]`);
    if (existingScript) {
 existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = FFMPEG_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      console.log("FFmpeg UMD script loaded successfully from CDN.");
      if (window.FFmpegWASM && typeof window.FFmpegWASM.createFFmpeg === 'function') {
        resolve();
      } else { 
        console.error("FFmpeg script loaded, but createFFmpeg is not defined on window.FFmpeg.");
        reject(new Error("FFmpeg script loaded, but not initialized correctly."));
      }
    };
    
    script.onerror = () => {
      console.error("Failed to load FFmpeg UMD script from CDN.");
      reject(new Error(`Failed to load FFmpeg script from ${FFMPEG_SCRIPT_URL}.`));
    };
    
    document.head.appendChild(script);
  });
};

export async function getFFmpegInstance(): Promise<FFmpeg | null> {
  console.log("ffmpeg.ts: getFFmpegInstance() called.");
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    console.log("ffmpeg.ts: Returning existing, loaded FFmpeg instance.");
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    console.log("ffmpeg.ts: FFmpeg is already loading, returning existing promise.");
    return ffmpegLoadingPromise;
  }

  console.log("ffmpeg.ts: No existing instance or promise. Starting new initialization.");
  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    // Check if the static script tag has already loaded the FFmpegWASM object
    if (typeof window.FFmpegWASM === 'undefined' || typeof window.FFmpegWASM.createFFmpeg !== 'function') {
        console.error("getFFmpegInstance: window.FFmpegWASM or createFFmpeg is not defined. Ensure the static script tag is loading the library correctly.");
        ffmpegLoadingPromise = null; // Reset promise on failure
        return resolve(null); // Resolve with null if the library is not available
    }
     try {
      await loadFFmpegScript();
      
      const { createFFmpeg } = window.FFmpegWASM; // Use FFmpegWASM
      console.log("ffmpeg.ts: createFFmpeg function retrieved from window.FFmpeg. Creating instance.");
      const ffmpeg = createFFmpeg({ log: false });

      console.log(`ffmpeg.ts: Calling ffmpeg.load()`);
      // @ts-ignore
      await ffmpeg.load({
        // Specify the path to the FFmpeg core files on your hosted app
        coreURL: '/ffmpeg/ffmpeg-core.js?v=2025/08/17-09.06',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm?v=2025/08/17-09.06',
        workerURL: '/ffmpeg/ffmpeg-core.worker.js?v=2025/08/17-09.06',
      });
      console.log("ffmpeg.ts: ffmpeg.load() completed successfully.");

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
    if (typeof window.FFmpegWASM === 'undefined' || !window.FFmpegWASM.fetchFile) { // Use FFmpegWASM
         await getFFmpegInstance(); // Ensure script is loaded
    }
    return window.FFmpegWASM.fetchFile(data); // Use FFmpegWASM
};

export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  const fileName = 'input.' + (mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp');
  let logOutput = "";

  try {
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr' || type === 'ffout') {
        logOutput += message + "\n";
      }
    });

    await ffmpeg.run('-i', fileName);

    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);

    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
       const alternativeDurationMatch = logOutput.match(/Duration: (\d+\.\d+)/);
       if (alternativeDurationMatch) {
           return parseFloat(alternativeDurationMatch[1]);
       }
      throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");
    }
  } finally {
    try {
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ }
    ffmpeg.setLogger(() => {});
  }
}

export async function trimMediaWithFFmpeg(mediaBlob: Blob, startTime: number, endTime: number): Promise<Blob> {
    const ffmpeg = await getFFmpegInstance();
    const fileExtension = mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp';
    const inputFilename = 'input_trim.' + fileExtension;
    const outputFilename = 'output_trim.' + fileExtension;

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
    } finally {
        try {
            ffmpeg.FS('unlink', inputFilename);
            ffmpeg.FS('unlink', outputFilename);
        } catch(e) { /* Ignore cleanup errors */ }
    }
}
