
'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg | null> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }
  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      const ffmpeg = new FFmpeg();
      const origin = window.location.origin;

      console.log('Loading local FFmpeg binaries...');
      await ffmpeg.load({
        coreURL: await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${origin}/ffmpeg/ffmpeg-core.worker.js`, 'text/javascript'),
      });
      console.log('FFmpeg loaded successfully.');
      
      ffmpegInstance = ffmpeg;
      resolve(ffmpegInstance);
    } catch (error) {
      console.error('Failed to load FFmpeg', error);
      ffmpegLoadingPromise = null;
      reject(error);
    }
  });

  return ffmpegLoadingPromise;
}
