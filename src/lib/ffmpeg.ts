// src/lib/ffmpeg.ts
import type { FFmpeg } from '@ffmpeg/ffmpeg';

// This file will contain the logic to create and manage the ffmpeg instance.
// We will dynamically import the createFFmpeg function to avoid server-side issues.

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
        // Add a timeout to prevent infinite loops
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!ffmpeg) {
                reject(new Error("FFmpeg loading timed out."));
            }
        }, 15000); // 15 second timeout
      }, 100);
    });
  }

  isLoading = true;
  try {
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpeg = createFFmpeg({
      log: true, // Keep this for debugging FFmpeg's internal operations
      // --- CRITICAL: Path to ffmpeg-core.js ---
      // You MUST copy 'ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'
      // from 'node_modules/@ffmpeg/core/dist/' into your 'public/ffmpeg/' folder.
      corePath: '/ffmpeg/ffmpeg-core.js', // This path is relative to your /public directory
    });

    await ffmpeg.load(); // Load the WASM modules
    console.log("FFmpeg core loaded successfully in getFFmpegInstance.");
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
          ffmpegInstance.FS('unlink', fileName);
      } catch (e) {
          console.warn(`Could not unlink file ${fileName} from FFmpeg FS, it might not exist.`);
      }
      ffmpegInstance.setLogger(() => {});
  }
}
