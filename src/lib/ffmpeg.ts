
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
    FFmpeg: {
      createFFmpeg: (options: any) => FFmpeg;
      fetchFile: (data: Blob | string | Uint8Array) => Promise<Uint8Array>;
    };
  }
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

const loadFFmpegScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.FFmpeg && typeof window.FFmpeg.createFFmpeg === 'function') {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js';
        script.async = true;
        script.onload = () => {
            console.log("FFmpeg UMD script loaded successfully from CDN.");
            resolve();
        };
        script.onerror = () => {
            console.error("Failed to load FFmpeg UMD script from CDN.");
            reject(new Error("Failed to load FFmpeg UMD script."));
        };
        document.head.appendChild(script);
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
      await loadFFmpegScript();
      
      const { createFFmpeg } = window.FFmpeg;
      console.log("ffmpeg.ts: createFFmpeg function retrieved from window.FFmpeg. Creating instance.");
      const ffmpeg = createFFmpeg({ log: false });

      console.log(`ffmpeg.ts: Calling ffmpeg.load()`);
      await ffmpeg.load();
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
    if (typeof window.FFmpeg === 'undefined' || !window.FFmpeg.fetchFile) {
         await getFFmpegInstance(); // Ensure script is loaded
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
