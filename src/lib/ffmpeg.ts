
// src/lib/ffmpeg.ts
import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;
let isLoading = false;

export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }

  if (isLoading) {
    // Wait for the current loading process to complete if another call started it
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (ffmpeg) {
          clearInterval(checkInterval);
          resolve(ffmpeg);
        }
      }, 100);
       setTimeout(() => {
            clearInterval(checkInterval);
            if (!ffmpeg) {
                reject(new Error("FFmpeg loading timed out."));
            }
        }, 30000); // Increased timeout for slower networks
    });
  }

  isLoading = true;
  try {
    // Dynamically import the createFFmpeg function to prevent SSR issues.
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');

    ffmpeg = createFFmpeg({
      log: true,
      // Explicitly provide paths to the core files.
      // These files are copied to the /public/ffmpeg folder.
      // Webpack handles serving them from /_next/static/ffmpeg
      corePath: '/static/ffmpeg/ffmpeg-core.js',
      workerPath: '/static/ffmpeg/ffmpeg-core.worker.js',
      wasmPath: '/static/ffmpeg/ffmpeg-core.wasm',
    });

    await ffmpeg.load();
    console.log("FFmpeg core loaded successfully.");
    return ffmpeg;
  } catch (error) {
    console.error("Failed to load FFmpeg core in getFFmpegInstance:", error);
    ffmpeg = null; // Reset on failure
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Gets the duration of a video Blob using FFmpeg.
 * @param {Blob} mediaBlob The media Blob to check.
 * @returns {Promise<number>} A Promise that resolves with the video duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const { fetchFile } = await import('@ffmpeg/ffmpeg');
  const ffmpegInstance = await getFFmpegInstance(); // Ensure FFmpeg is loaded

  const fileName = `input.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
  let logOutput = "";

  try {
      if (ffmpegInstance.FS('readdir', '/').includes(fileName)) {
          ffmpegInstance.FS('unlink', fileName);
      }
      await ffmpegInstance.FS('writeFile', fileName, await fetchFile(mediaBlob));
      
      ffmpegInstance.setLogger(({ type, message }) => {
          // FFmpeg prints its detailed analysis to stderr. We capture it here.
          if (type === 'fferr') {
              logOutput += message + "\n";
          }
      });
      
      // The '-i' command just reads the file info without transcoding. It's fast.
      await ffmpegInstance.run('-i', fileName);

      // Regex to find the "Duration: HH:MM:SS.cs" line in the FFmpeg log.
      const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      
      if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          const minutes = parseInt(durationMatch[2], 10);
          const seconds = parseInt(durationMatch[3], 10);
          const centiseconds = parseInt(durationMatch[4], 10); // Hundredths of a second
          const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
          
          console.log(`FFmpeg successfully extracted duration: ${totalSeconds.toFixed(2)}s`);
          return totalSeconds;
      } else {
          console.error("FFmpeg output did not contain duration information. Full log:", logOutput);
          throw new Error("Could not parse duration from FFmpeg output.");
      }
  } finally {
      // Clean up the virtual file system and the logger
      try {
          if (ffmpegInstance.FS('readdir', '/').includes(fileName)) {
            ffmpegInstance.FS('unlink', fileName);
          }
      } catch (e) {
          console.warn(`Could not unlink file ${fileName} from FFmpeg FS, it might not exist.`);
      }
      ffmpegInstance.setLogger(() => {});
  }
}
