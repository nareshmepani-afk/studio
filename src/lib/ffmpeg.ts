
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
    if (ffmpeg) {
        return ffmpeg;
    }

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
        console.log(`[FFMPEG]: ${message}`);
    });

    try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
        console.log('FFmpeg loaded successfully.');
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        ffmpeg = null; // Reset on failure
        throw error;
    }

    return ffmpeg;
}
