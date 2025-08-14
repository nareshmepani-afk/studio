
// src/lib/ffmpeg.ts
// This file handles loading FFmpeg.wasm files from a local path and providing helper functions.

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

// This function polls until the FFmpeg script has fully initialized on the window object.
const waitForFFmpegReady = (timeout = 60000): Promise<void> => {
  console.log("ffmpeg.ts: waitForFFmpegReady() called.");
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.FFmpeg && typeof window.FFmpeg.createFFmpeg === 'function') {
        console.log("ffmpeg.ts: window.FFmpeg.createFFmpeg is available.");
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        console.error("ffmpeg.ts: Timeout waiting for FFmpeg to become ready.");
        clearInterval(interval);
        reject(new Error("window.FFmpeg.createFFmpeg did not become available in time."));
      }
    }, 100); // Check every 100ms
  });
};


export async function getFFmpegInstance(): Promise<FFmpeg> {
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
    try {
      // First, ensure the script has loaded and the global object is ready.
      await waitForFFmpegReady();

      const { createFFmpeg } = window.FFmpeg;
      console.log("ffmpeg.ts: createFFmpeg function retrieved from window. Creating instance.");
      const ffmpeg = createFFmpeg({ log: false });
      
      const LOCAL_BASE_URL = '/api/ffmpeg';
      console.log(`ffmpeg.ts: Calling ffmpeg.load() with local paths from ${LOCAL_BASE_URL}...`);
      await ffmpeg.load({
         coreURL: `${LOCAL_BASE_URL}/ffmpeg-core.js`,
         wasmURL: `${LOCAL_BASE_URL}/ffmpeg-core.wasm`,
         workerURL: `${LOCAL_BASE_URL}/ffmpeg-core.worker.js`,
      });
      console.log("ffmpeg.ts: ffmpeg.load() completed successfully from local paths.");

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
    await waitForFFmpegReady();
    if (typeof window.FFmpeg === 'undefined' || !window.FFmpeg.fetchFile) {
         throw new Error("FFmpeg script or fetchFile is not available.");
    }
    return window.FFmpeg.fetchFile(data);
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
