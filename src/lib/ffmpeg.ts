
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      const ffmpegInstance = new FFmpeg();

      ffmpegInstance.on('log', ({ message }: { message: string }) => {
        // console.log(message); // Optional: useful for debugging
      });
      
      // Use static paths to the core files.
      // These files must be available in your `public/ffmpeg` directory.
      const coreURL = '/ffmpeg/ffmpeg-core.js';
      const wasmURL = '/ffmpeg/ffmpeg-core.wasm';
      const workerURL = '/ffmpeg/ffmpeg-core.worker.js';

      await ffmpegInstance.load({
        coreURL,
        wasmURL,
        workerURL,
      });

      ffmpeg = ffmpegInstance;
      resolve(ffmpeg);
    } catch (error) {
        console.error("FFmpeg initialization failed:", error);
        ffmpeg = null; // Ensure it's null on failure
        ffmpegLoadingPromise = null; // Allow retrying
        reject(error);
    }
  });

  return ffmpegLoadingPromise;
}

/**
 * Calculates the duration of a media file using FFmpeg.
 * @param {Blob} mediaBlob The media file to process.
 * @returns {Promise<number>} A promise that resolves to the duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpegInstance = await getFFmpegInstance();
  const fileName = 'input_duration.' + (mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp');
  let logOutput = "";

  const logger = ({ message }: { message: string }) => {
      logOutput += message + "\n";
  };
  ffmpegInstance.on('log', logger);

  try {
    await ffmpegInstance.writeFile(fileName, await fetchFile(mediaBlob));

    try {
        // This command is expected to fail but prints metadata to stderr.
        await ffmpegInstance.exec(['-i', fileName]);
    } catch(e) {
        // This is expected. FFmpeg throws an error when run with just -i.
    }
    
    const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const centiseconds = parseInt(durationMatch[4], 10);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    // Fallback for different duration format (e.g., from streams without a proper container)
    const alternativeDurationMatch = logOutput.match(/Duration: (\d+\.\d+)/);
    if (alternativeDurationMatch) {
      return parseFloat(alternativeDurationMatch[1]);
    }
    
    console.warn("FFmpeg log output for duration check:", logOutput);
    throw new Error("getDurationWithFFmpeg: Could not parse duration from FFmpeg output.");

  } finally {
    try {
      if (await ffmpegInstance.pathExists(fileName)) {
        await ffmpegInstance.deleteFile(fileName);
      }
    } catch (e) { /* Ignore cleanup errors */ }
    ffmpegInstance.off('log', logger); // Reset logger
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
  const ffmpegInstance = await getFFmpegInstance();
  const fileExtension = mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp';
  const inputFilename = 'input_trim.' + fileExtension;
  const outputFilename = 'output_trim.' + fileExtension;

  try {
    await ffmpegInstance.writeFile(inputFilename, await fetchFile(mediaBlob));
    const duration = endTime - startTime;
    if (duration <= 0) {
      throw new Error("trimMediaWithFFmpeg: End time must be after start time for trimming.");
    }

    // Using a more reliable command for trimming
    await ffmpegInstance.exec([
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-i', inputFilename,
      '-c', 'copy', // Use copy codec for speed, assuming container format doesn't change
      outputFilename
    ]);

    const data = await ffmpegInstance.readFile(outputFilename);
    return new Blob([(data as Uint8Array).buffer], { type: mediaBlob.type });
  } finally {
     try {
       if (await ffmpegInstance.pathExists(inputFilename)) {
         await ffmpegInstance.deleteFile(inputFilename);
       }
       if (await ffmpegInstance.pathExists(outputFilename)) {
         await ffmpegInstance.deleteFile(outputFilename);
       }
     } catch(e) { /* Ignore cleanup errors */ }
  }
}
