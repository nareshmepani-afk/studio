
// src/lib/ffmpeg.ts
import type { FFmpeg } from '@ffmpeg/ffmpeg';

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
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');

    ffmpeg = createFFmpeg({
      log: true,
      corePath: '/static/ffmpeg/ffmpeg-core.js',
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
      if (ffmpegInstance.FS('readdir', '/').includes(fileName)) {
          ffmpegInstance.FS('unlink', fileName);
      }
      await ffmpegInstance.FS('writeFile', fileName, await fetchFile(mediaBlob));
      
      ffmpegInstance.setLogger(({ type, message }) => {
          if (type === 'fferr') {
              logOutput += message + "\n";
          }
      });
      
      await ffmpegInstance.run('-i', fileName);

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
          console.warn(`Could not unlink file ${fileName} from FFmpeg FS, it might not exist.`);
      }
      ffmpegInstance.setLogger(() => {});
  }
}
