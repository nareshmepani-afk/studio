
import { fetchFile } from '@ffmpeg/util';
import { toBlobURL } from '@ffmpeg/util';

declare var FFmpeg: any;

let ffmpeg: any | null = null;

export async function getFFmpegInstance() {
  if (ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  ffmpeg.on('log', ({ message }: { message: string }) => {
    console.log(message);
  });

  // toBlobURL is used to bypass CORS issue, urls with the same domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL(
      '/ffmpeg/ffmpeg-core.wasm',
      'application/wasm'
    ),
    workerURL: await toBlobURL(
      '/ffmpeg/ffmpeg-core.worker.js',
      'text/javascript'
    ),
  });

  return ffmpeg;
}

/**
 * Calculates the duration of a media file using FFmpeg.
 * @param {Blob} mediaBlob The media file to process.
 * @returns {Promise<number>} A promise that resolves to the duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const ffmpegInstance = await getFFmpegInstance();
  if (!ffmpegInstance) {
    throw new Error("FFmpeg instance could not be loaded.");
  }
  const fileName = 'input_duration.' + (mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp');
  let logOutput = "";

  const logger = ({ message }: { message: string }) => {
      logOutput += message + "\n";
  };
  ffmpegInstance.on('log', logger);

  try {
    await ffmpegInstance.writeFile(fileName, await fetchFile(mediaBlob));

    try {
        await ffmpegInstance.exec(['-i', fileName]);
    } catch(e) {
        // This command is expected to fail but prints metadata to stderr.
    }
    
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
      await ffmpegInstance.deleteFile(fileName);
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
  if (!ffmpegInstance) {
    throw new Error("FFmpeg instance could not be loaded.");
  }
  const fileExtension = mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp';
  const inputFilename = 'input_trim.' + fileExtension;
  const outputFilename = 'output_trim.' + fileExtension;

  try {
    await ffmpegInstance.writeFile(inputFilename, await fetchFile(mediaBlob));
    const duration = endTime - startTime;
    if (duration <= 0) {
      throw new Error("trimMediaWithFFmpeg: End time must be after start time for trimming.");
    }

    // Using '-c copy' is fast but can be inaccurate. For precise trimming, re-encoding is necessary.
    await ffmpegInstance.exec([
      '-i', inputFilename,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      outputFilename
    ]);

    const data = await ffmpegInstance.readFile(outputFilename);
    return new Blob([data], { type: mediaBlob.type });
  } finally {
     try {
       await ffmpegInstance.deleteFile(inputFilename);
       await ffmpegInstance.deleteFile(outputFilename);
     } catch(e) { /* Ignore cleanup errors */ }
  }
}
