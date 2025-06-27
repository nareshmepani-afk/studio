
import type { FFmpeg } from '@ffmpeg/ffmpeg';

// Singleton pattern to ensure FFmpeg is loaded only once
let ffmpegPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  const { createFFmpeg } = await import(/* webpackIgnore: true */ '@ffmpeg/ffmpeg');
  
  const ffmpeg = createFFmpeg({
    log: true, // Enables detailed FFmpeg logs in the console for debugging
    // It's recommended to host these files locally in /public for production reliability,
    // but for simplicity and cross-environment compatibility, we'll use a CDN.
    corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
  });

  await ffmpeg.load();
  console.log("FFmpeg core loaded successfully.");
  return ffmpeg;
}

export function getFFmpegInstance(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = loadFFmpeg();
  }
  return ffmpegPromise;
}

/**
 * Gets the duration of a media Blob using the robust FFmpeg library.
 * This is a reliable fallback for when browser native methods fail.
 * @param {Blob} mediaBlob The media Blob to check.
 * @returns {Promise<number>} A Promise that resolves with the media duration in seconds.
 */
export async function getDurationWithFFmpeg(mediaBlob: Blob): Promise<number> {
    const { fetchFile } = await import(/* webpackIgnore: true */ '@ffmpeg/ffmpeg');
    const ffmpegInstance = await getFFmpegInstance();
    
    // Use a unique filename to avoid conflicts if used in parallel
    const fileName = `input-${Date.now()}.${mediaBlob.type.split('/')[1]?.split(';')[0] || 'tmp'}`;
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
