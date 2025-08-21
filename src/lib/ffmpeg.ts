// src/lib/ffmpeg.ts
// This file handles loading FFmpeg.wasm and provides helper functions.

interface FFmpeg {
  // This interface is an approximation of the FFmpeg.js API.
  // The actual load method takes options for coreURL, wasmURL, etc.
  load: (options?: { coreURL?: string; wasmURL?: string; workerURL?: string }) => Promise<void>;
  // The FS method provides file system operations.
  FS: (method: 'writeFile' | 'readFile' | 'unlink', ...args: any[]) => any;
  // The run method executes FFmpeg commands.
  run: (...args: string[]) => Promise<void>;
  // The setLogger method allows custom logging.
  setLogger: (logger: ({ type, message }: { type: string; message: string; }) => void) => void;
  // isLoaded returns a boolean indicating if the instance is ready.
  isLoaded: () => boolean;
}

declare global {
  interface Window {
    // We assume FFmpegWASM is globally available due to a static script tag.
    FFmpegWASM: {
      createFFmpeg: (options?: any) => FFmpeg;
      fetchFile: (data: Blob | string | Uint8Array) => Promise<Uint8Array>;
    };
  }
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg | null> | null = null;

/**
 * Initializes and returns a singleton FFmpeg instance.
 * It checks if an instance is already loaded or in the process of loading.
 * This function assumes the FFmpeg.js library is loaded via a static <script> tag.
 * @returns {Promise<FFmpeg | null>} A promise that resolves to the FFmpeg instance or null if initialization fails.
 */
export async function getFFmpegInstance(): Promise<FFmpeg | null> {
  console.log("ffmpeg.ts: getFFmpegInstance() called.");

  // Check if a previously loaded and functional instance exists.
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    console.log("ffmpeg.ts: Returning existing, loaded FFmpeg instance.");
    return ffmpegInstance;
  }
  
  // Check if a loading process is already in progress to avoid multiple parallel initializations.
  if (ffmpegLoadingPromise) {
    console.log("ffmpeg.ts: FFmpeg is already loading, returning existing promise.");
    return ffmpegLoadingPromise;
  }
  
  console.log("ffmpeg.ts: No existing instance or promise. Starting new initialization.");

  // Start a new loading process wrapped in a promise.
  ffmpegLoadingPromise = (async () => {
    // Ensure the FFmpegWASM object is available from the static script tag.
    if (typeof window.FFmpegWASM === 'undefined' || typeof window.FFmpegWASM.createFFmpeg !== 'function') {
      console.error("getFFmpegInstance: window.FFmpegWASM or createFFmpeg is not defined. Ensure the static script tag is loading the library correctly.");
      return null;
    }

    try {
      const { createFFmpeg } = window.FFmpegWASM;
      console.log("ffmpeg.ts: createFFmpeg function retrieved. Creating instance.");
      const ffmpeg = createFFmpeg({ log: false });

      console.log(`ffmpeg.ts: Calling ffmpeg.load()`);
      // @ts-ignore - Ignore the load signature mismatch as the FFmpeg.js v0.12.x requires this.
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js?v=2025/08/17-09.06',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm?v=2025/08/17-09.06',
        workerURL: '/ffmpeg/ffmpeg-core.worker.js?v=2025/08/17-09.06',
      });
      console.log("ffmpeg.ts: ffmpeg.load() completed successfully.");

      ffmpegInstance = ffmpeg;
      return ffmpegInstance;

    } catch (error) {
      console.error("getFFmpegInstance: Critical error during FFmpeg initialization:", error);
      ffmpegInstance = null; // Reset instance on failure
      throw error; // Re-throw the error to be caught by the caller
    } finally {
      ffmpegLoadingPromise = null; // Reset the promise regardless of success or failure.
    }
  })();

  return ffmpegLoadingPromise;
}

/**
 * A helper function to fetch a file from a Blob or URL using FFmpeg's built-in utility.
 * It ensures the FFmpeg instance is loaded before proceeding.
 * @param {Blob | string | Uint8Array} data The data to fetch.
 * @returns {Promise<Uint8Array>} A promise that resolves to the file data as a Uint8Array.
 */
export const fetchFile = async (data: Blob | string | Uint8Array): Promise<Uint8Array> => {
  // Ensure the FFmpeg instance is loaded.
  if (typeof window.FFmpegWASM === 'undefined' || !window.FFmpegWASM.fetchFile) {
    await getFFmpegInstance();
  }
  return window.FFmpegWASM.fetchFile(data);
};

/**
 * Calculates the duration of a media file using FFmpeg.
 * @param {Blob} mediaBlob The media file to process.
 * @returns {Promise<number>} A promise that resolves to the duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  if (!ffmpeg) {
    throw new Error("FFmpeg instance is not available.");
  }

  const fileName = 'input.' + (mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp');
  let logOutput = "";

  try {
    // Write the media blob to the FFmpeg file system.
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    ffmpeg.setLogger(({ type, message }) => {
      // Capture log output to parse the duration.
      if (type === 'fferr' || type === 'ffout') {
        logOutput += message + "\n";
      }
    });

    // Run ffprobe command to get duration from file metadata
    // Use an invalid command to force FFmpeg to log file info, which contains the duration.
    await ffmpeg.run('-i', fileName);

    // Look for the standard Duration: HH:MM:SS.cs format.
    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);

    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    } else {
      // Look for an alternative format like Duration: 12.34
      const alternativeDurationMatch = logOutput.match(/Duration: (\d+\.\d+)/);
      if (alternativeDurationMatch) {
        return parseFloat(alternativeDurationMatch[1]);
      }
      throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");
    }
  } finally {
    try {
      // Clean up the file from the FFmpeg file system.
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ }
    ffmpeg.setLogger(() => {}); // Reset logger.
  }
}

/**
 * Trims a media file using FFmpeg.
 * @param {Blob} mediaBlob The media file to trim.
 * @param {number} startTime The start time in seconds.
 * @param {number} endTime The end time in seconds.
 * @returns {Promise<Blob>} A promise that resolves to the trimmed media Blob.
 */
export async function trimMediaWithFFmpeg(mediaBlob: Blob, startTime: number, endTime: number): Promise<Blob> {
  const ffmpeg = await getFFmpegInstance();
  if (!ffmpeg) {
    throw new Error("FFmpeg instance is not available.");
  }
  const fileExtension = mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp';
  const inputFilename = 'input_trim.' + fileExtension;
  const outputFilename = 'output_trim.' + fileExtension;

  try {
    ffmpeg.FS('writeFile', inputFilename, await fetchFile(mediaBlob));
    const duration = endTime - startTime;
    if (duration <= 0) {
      throw new Error("trimMediaWithFFmpeg: End time must be after start time for trimming.");
    }

    // Run the FFmpeg command to trim the media.
    await ffmpeg.run(
      '-ss', startTime.toString(),
      '-i', inputFilename,
      '-t', duration.toString(),
      '-c', 'copy',
      outputFilename
    );

    // Read the trimmed file from the FFmpeg file system.
    const data = ffmpeg.FS('readFile', outputFilename);
    const trimmedBlob = new Blob([data.buffer], { type: mediaBlob.type });
    return trimmedBlob;
  } finally {
    try {
      // Clean up both input and output files.
      ffmpeg.FS('unlink', inputFilename);
      ffmpeg.FS('unlink', outputFilename);
    } catch(e) { /* Ignore cleanup errors */ }
  }
}