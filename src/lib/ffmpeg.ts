
// src/lib/ffmpeg.ts
import type { FFmpeg } from '@ffmpeg/ffmpeg';

import { toBlobURL } from '@ffmpeg/util'; // Import toBlobURL
let ffmpeg: FFmpeg | null = null;
let isLoading = false;

export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }

  if (isLoading) {
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
        }, 30000);
    });
  }

  isLoading = true;
  try {
    // This dynamic import is still useful to avoid loading this heavy script on every page.
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');

    // Use document.location.origin to get the base URL of your application
    // The files are located in the public/ffmpeg/ directory
    const baseURL = `${document.location.origin}/ffmpeg`;

    ffmpeg = createFFmpeg({
      log: true,
      corePath: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      workerPath: '/static/ffmpeg/ffmpeg-core.worker.js',
      wasmPath: '/static/ffmpeg/ffmpeg-core.wasm',
    });

    await ffmpeg.load();
    console.log("FFmpeg core loaded successfully.");
    return ffmpeg;
  } catch (error) {
    console.error("Failed to load FFmpeg core in getFFmpegInstance:", error);
    ffmpeg = null;
    throw error;
  } finally {
    isLoading = false;
  }
}

export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
  const { fetchFile } = await import('@ffmpeg/ffmpeg');
  const ffmpegInstance = await getFFmpegInstance();

  const fileName = `input.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
  let logOutput = "";

  try {
      // Check if file exists and delete it to prevent errors on re-runs
      try {
        if (ffmpegInstance.FS('readdir', '/').includes(fileName)) {
            ffmpegInstance.FS('unlink', fileName);
        }
      } catch (e) {
        // FS might not be ready, or directory doesn't exist. Ignore.
      }
      
      await ffmpegInstance.FS('writeFile', fileName, await fetchFile(mediaBlob));
      
      ffmpegInstance.setLogger(({ type, message }) => {
          if (type === 'fferr') {
              logOutput += message + "\n";
          }
      });
      
      // Use -v error and -f null to get metadata without transcoding
      await ffmpegInstance.run('-i', fileName, '-f', 'null', '-');

      const durationMatch = logOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      
      if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          const minutes = parseInt(durationMatch[2], 10);
          const seconds = parseInt(durationMatch[3], 10);
          const centiseconds = parseInt(durationMatch[4], 10);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
          
          console.log(`FFmpeg successfully extracted duration: ${totalSeconds.toFixed(2)}s`);
          return totalSeconds;
      } else {
          console.error("FFmpeg output did not contain duration information. Full log:", logOutput);
          throw new Error("Could not parse duration from FFmpeg output.");
      }
  } finally {
      try {
          if (ffmpegInstance.FS('readdir', '/').includes(fileName)) {
            ffmpegInstance.FS('unlink', fileName);
          }
      } catch (e) {
          // Ignore cleanup errors
      }
      ffmpegInstance.setLogger(() => {});
  }
}
