// src/lib/ffmpeg.ts
// This file handles loading self-hosted ffmpeg.wasm files and providing helper functions.

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
      fetchFile: (data: Blob | string) => Promise<Uint8Array>;
    };
  }
}

const FFMPEG_SCRIPT_URL = '/ffmpeg/ffmpeg.min.js'; // Path to self-hosted script in /public
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

// Function to load the FFmpeg script from the /public directory
function loadFFmpegScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FFmpeg) {
      console.log("FFmpeg script already loaded.");
      return resolve();
    }
    console.log("Loading FFmpeg script from local public path...");
    const script = document.createElement('script');
    script.src = FFMPEG_SCRIPT_URL;
    script.onload = () => {
      console.log("FFmpeg script loaded successfully from local public path.");
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load FFmpeg script from local public path. Ensure ffmpeg.min.js is in /public/ffmpeg/.");
      reject(new Error('Failed to load FFmpeg script.'));
    };
    document.head.appendChild(script);
  });
}

// Main function to get a loaded FFmpeg instance
export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      await loadFFmpegScript();
      
      const { createFFmpeg } = window.FFmpeg;
      // All paths are relative to the root of the public directory
      const ffmpeg = createFFmpeg({
        corePath: '/ffmpeg/ffmpeg-core.js',
        log: true,
      });

      await ffmpeg.load({
         workerPath: '/ffmpeg/ffmpeg-core.worker.js',
         wasmPath: '/ffmpeg/ffmpeg-core.wasm'
      });
      console.log("FFmpeg core loaded and initialized from self-hosted files.");
      ffmpegInstance = ffmpeg;
      resolve(ffmpegInstance);
    } catch (error) {
      console.error("Error initializing self-hosted FFmpeg:", error);
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  const { fetchFile } = window.FFmpeg;

  const fileName = `input.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
  let logOutput = "";

  try {
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    
    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr') {
        logOutput += message + "\n";
      }
    });
    
    await ffmpeg.run('-i', fileName, '-f', 'null', '-');

    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
      console.error("FFmpeg output did not contain duration information. Full log:", logOutput);
      throw new Error("Could not parse duration from FFmpeg output.");
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
    const { fetchFile } = window.FFmpeg;

    const inputFilename = `input_trim.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
    const outputFilename = `output_trim.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;

    try {
        ffmpeg.FS('writeFile', inputFilename, await fetchFile(mediaBlob));

        const duration = endTime - startTime;

        await ffmpeg.run(
            '-ss', startTime.toString(), // Start time
            '-i', inputFilename,         // Input file
            '-t', duration.toString(),   // Duration of the trim
            '-c', 'copy',                // Copy codecs to avoid re-encoding (fast)
            outputFilename
        );

        const data = ffmpeg.FS('readFile', outputFilename);
        const trimmedBlob = new Blob([data.buffer], { type: mediaBlob.type });

        console.log(`Media successfully trimmed. New size: ${(trimmedBlob.size / (1024*1024)).toFixed(2)} MB`);
        return trimmedBlob;
    } finally {
        try {
            ffmpeg.FS('unlink', inputFilename);
            ffmpeg.FS('unlink', outputFilename);
        } catch(e) { /* Ignore cleanup errors */ }
    }
}
