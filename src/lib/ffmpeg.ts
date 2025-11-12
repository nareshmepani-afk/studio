// src/lib/ffmpeg.ts
import {
  createFFmpeg,
  fetchFile as fetchFileUtil,
} from './ffmpeg.js';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg | null> | null = null;

/**
 * Initializes and returns a singleton FFmpeg instance.
 * It checks if an instance is already loaded or in the process of loading.
 * @returns {Promise<FFmpeg | null>} A promise that resolves to the FFmpeg instance or null if initialization fails.
 */
export async function getFFmpegInstance(): Promise<FFmpeg | null> {
  console.log("ffmpeg.ts: getFFmpegInstance() called.");

  // Check if a previously loaded and functional instance exists.
  if (ffmpegInstance) {
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
    try {
      console.log("ffmpeg.ts: createFFmpeg function retrieved. Creating instance.");
      const ffmpeg = createFFmpeg({ log: false });

      console.log(`ffmpeg.ts: Calling ffmpeg.load()`);
      await ffmpeg.load();
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
  return fetchFileUtil(data);
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
    
    // Set up a temporary logger to capture stderr
    const messages: string[] = [];
    ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr') {
        messages.push(message);
      }
    });

    // Run a minimal FFmpeg command just to get media info
    try {
        await ffmpeg.run('-i', fileName);
    } catch(e) {
        // This command is expected to fail with an error like "At least one output file must be specified"
        // but it will still print the input file's metadata to the logger.
    }
    
    logOutput = messages.join('\n');

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
      console.warn("FFmpeg log output for duration check:", logOutput);
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