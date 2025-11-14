
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { toast } from '@/hooks/use-toast';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }
  ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        // You can comment this out in production
        console.log('[FFMPEG]:', message);
      });

      toast({
        title: 'Loading Editor...',
        description: 'Please wait, this may take a moment.',
      });

      await ffmpeg.load({
        coreURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.js', 'application/javascript'),
        wasmURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm', 'application/wasm'),
      });

      toast({
        title: 'Editor Ready!',
        description: 'You can now trim your media.',
        variant: 'success',
      });
      
      resolve(ffmpeg);
    } catch (error) {
        console.error("FFmpeg initialization failed:", error);
        toast({
            title: 'Editor Failed to Load',
            description: 'Could not load the media editor. Please refresh and try again.',
            variant: 'destructive',
        });
        ffmpeg = null; 
        ffmpegLoadingPromise = null;
        reject(error);
    }
  });
  return ffmpegLoadingPromise;
}
