// src/lib/ffmpeg.ts
// This file handles loading ffmpeg.wasm files from a CDN and providing helper functions.

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
      fetchFile: (data: Blob | string | Uint8Array) => Promise<Uint8Array>; // Updated fetchFile type
      // Add other properties if you use them directly from window.FFmpeg
    };
  }
}

// Declare the global FFmpeg object for use within the file
declare const FFmpeg: Window['FFmpeg'];


let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

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
      // Check if FFmpeg is available globally (loaded by script tag)
      if (typeof FFmpeg === 'undefined') {
        throw new Error("FFmpeg script not loaded from CDN. Ensure the script tag is included in your HTML.");
      }

      const { createFFmpeg, toBlobURL } = FFmpeg;
      // Using unpkg CDN for ffmpeg/core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      const ffmpeg = createFFmpeg({
        // Do NOT include `log: true` in production, it's very verbose.
        // log: true,
      });

      await ffmpeg.load({
         // These paths point to the CDN URLs
         corePath: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
         workerPath: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
         wasmPath: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log("FFmpeg core loaded and initialized from CDN.");
      ffmpegInstance = ffmpeg;
      resolve(ffmpegInstance);
    } catch (error) {
      console.error("Error initializing FFmpeg from CDN:", error);
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

// Export fetchFile from the global FFmpeg object for use in other functions
export const fetchFile = async (data: Blob | string | Uint8Array): Promise<Uint8Array> => {
    if (typeof FFmpeg === 'undefined' || !FFmpeg.fetchFile) {
        throw new Error("FFmpeg script not loaded or fetchFile not available.");
    }
    return FFmpeg.fetchFile(data);
};


export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  // fetchFile is now exported directly from this module, which uses the global FFmpeg
  const fileName = `input.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
  let logOutput = "";

  try {
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));

    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr') {
        logOutput += message + "
";
      }
    });

    // Capture stderr output to parse duration
    // Redirect stderr to stdout and then pipe to a file, then read the file
    // This is a more robust way to capture stderr than relying on setLogger
    const stderrFileName = 'stderr.log';
    await ffmpeg.run('-i', fileName, '-f', 'null', '-', '-v', 'quiet', '-stats_log_level', 'info'); // -v quiet and -stats_log_level info might give cleaner output

    // We need to figure out how to get the stderr output when running in this environment
    // The previous implementation relied on setLogger which might not capture all info
    // Let's try running without piping to null and see if setLogger captures Duration
     logOutput = ""; // Reset logOutput for the actual run
     ffmpeg.setLogger(({ type, message }) => {
       if (type === 'fferr' || type === 'ffout') { // Capture both stderr and stdout
         logOutput += message + "
";
       }
     });
    await ffmpeg.run('-i', fileName); // Run with -i to get metadata

    const durationMatch = logOutput.match(/Duration: (d{2}):(d{2}):(d{2}).(d{2})/);

    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
       console.error("FFmpeg output did not contain duration information. Full log:", logOutput);
       // Attempt to parse duration from a different pattern if the first fails
       const alternativeDurationMatch = logOutput.match(/Duration: (d+).(d+)/);
       if (alternativeDurationMatch) {
           return parseInt(alternativeDurationMatch[1], 10) + parseInt(alternativeDurationMatch[2], 10) / 100;
       }
      throw new Error("Could not parse duration from FFmpeg output.");
    }
  } finally {
    try {
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ }
    ffmpeg.setLogger(() => {}); // Reset logger
  }
}

export async function trimMediaWithFFmpeg(mediaBlob: Blob, startTime: number, endTime: number): Promise<Blob> {
    const ffmpeg = await getFFmpegInstance();
    // fetchFile is now exported directly from this module
    const inputFilename = `input_trim.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
    const outputFilename = `output_trim.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;

    try {
        ffmpeg.FS('writeFile', inputFilename, await fetchFile(mediaBlob));

        const duration = endTime - startTime;

        // Ensure duration is not negative or zero
        if (duration <= 0) {
            throw new Error("End time must be after start time for trimming.");
        }

        // Using -c copy for speed, but it might not be frame accurate depending on keyframes
        // If frame-accuracy is critical, remove -c copy (will be slower due to re-encoding)
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
