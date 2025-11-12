
// This file is now designed to work with a globally loaded ffmpeg.js script.
// It assumes the script has been added to the `window` object.

// --- START: Manual type definitions to avoid importing from `@ffmpeg/ffmpeg` ---
interface FFmpegLog {
  type: string;
  message: string;
}
interface FFmpegProgress {
  progress: number; // For core-mt, progress is a value from 0 to 1
  time?: number; // Time might not be available in core-mt progress
}
type FFmpegLogger = (log: FFmpegLog) => void;
type FFmpegProgresser = (progress: FFmpegProgress) => void;

interface FFmpegType {
  load: () => Promise<void>;
  run: (...args: string[]) => Promise<void>;
  FS: (
    method: 'writeFile' | 'readFile' | 'unlink',
    ...args: any[]
  ) => any;
  setLogger: (logger: FFmpegLogger) => void;
  setProgress: (progresser: FFmpegProgresser) => void;
  isLoaded: () => boolean;
}
// --- END: Manual type definitions ---

// Extend the Window interface to declare the FFmpeg object
declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (options: any) => FFmpegType;
    };
  }
}

let ffmpegInstance: FFmpegType | null = null;
let ffmpegLoadingPromise: Promise<FFmpegType> | null = null;

// Helper to wait for the global FFmpeg object to be available
const waitForFFmpegScript = (timeout = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.FFmpeg && typeof window.FFmpeg.createFFmpeg === 'function') {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("FFmpeg script failed to load in time."));
      }
    }, 100); // Check every 100ms
  });
};


/**
 * Initializes and returns a singleton FFmpeg instance.
 * It now waits for the global window.FFmpeg object to be available before initializing.
 * @returns {Promise<FFmpegType>} A promise that resolves to the FFmpeg instance.
 */
export async function getFFmpegInstance(): Promise<FFmpegType> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }
  
  ffmpegLoadingPromise = (async (): Promise<FFmpegType> => {
    try {
      await waitForFFmpegScript();
      
      const ffmpeg = window.FFmpeg.createFFmpeg({
          // The `corePath` is now crucial for the multi-threaded version
          corePath: '/ffmpeg/ffmpeg-core.js',
          log: false, // Set to true for detailed debugging if needed
      });

      await ffmpeg.load();

      ffmpegInstance = ffmpeg;
      return ffmpegInstance;

    } catch (error) {
      console.error("getFFmpegInstance: Critical error during FFmpeg initialization:", error);
      ffmpegInstance = null; // Reset instance on failure
      ffmpegLoadingPromise = null; // Reset promise on failure to allow retries
      throw error; // Re-throw the error to be caught by the caller
    }
  })();

  return ffmpegLoadingPromise;
}

/**
 * A helper function to fetch a file from a Blob or URL.
 * It directly converts Blob/File to Uint8Array or fetches from a URL.
 * @param {Blob | string | File} data The data to fetch.
 * @returns {Promise<Uint8Array>} A promise that resolves to the file data as a Uint8Array.
 */
export const fetchFile = async (data: Blob | string | File): Promise<Uint8Array> => {
  if (typeof data === 'string') {
    const response = await fetch(data);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }
  const buffer = await data.arrayBuffer();
  return new Uint8Array(buffer);
};

/**
 * Calculates the duration of a media file using FFmpeg.
 * @param {Blob} mediaBlob The media file to process.
 * @returns {Promise<number>} A promise that resolves to the duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpeg = await getFFmpegInstance();
  if (!ffmpeg || !ffmpeg.isLoaded()) {
    throw new Error("getDurationWithFFmpeg: FFmpeg instance is not available.");
  }

  const fileName = 'input_duration.' + (mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp');
  let logOutput = "";

  try {
    ffmpeg.FS('writeFile', fileName, await fetchFile(mediaBlob));
    
    const messages: string[] = [];
    ffmpeg.setLogger(({ type, message }: FFmpegLog) => {
      if (type === 'fferr') {
        messages.push(message);
      }
    });

    try {
        await ffmpeg.run('-i', fileName);
    } catch(e) {
        // This command is expected to fail but prints metadata to stderr.
    }
    
    logOutput = messages.join('\n');

    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    // Fallback for different duration format
    const alternativeDurationMatch = logOutput.match(/Duration: (\d+\.\d+)/);
    if (alternativeDurationMatch) {
      return parseFloat(alternativeDurationMatch[1]);
    }
    
    console.warn("FFmpeg log output for duration check:", logOutput);
    throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");

  } finally {
    try {
      ffmpeg.FS('unlink', fileName);
    } catch (e) { /* Ignore cleanup errors */ }
    ffmpeg.setLogger(() => {}); // Reset logger
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
  if (!ffmpeg || !ffmpeg.isLoaded()) {
    throw new Error("trimMediaWithFFmpeg: FFmpeg instance is not available.");
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

    // Using '-c copy' is fast but can be inaccurate. For precise trimming, re-encoding is necessary.
    // Let's remove '-c copy' to favor accuracy over speed.
    await ffmpeg.run(
      '-i', inputFilename,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      // '-c', 'copy', // Removed for accuracy
      outputFilename
    );

    const data = ffmpeg.FS('readFile', outputFilename);
    return new Blob([data.buffer], { type: mediaBlob.type });
  } finally {
     try {
       ffmpeg.FS('unlink', inputFilename);
       ffmpeg.FS('unlink', outputFilename);
     } catch(e) { /* Ignore cleanup errors */ }
  }
}
