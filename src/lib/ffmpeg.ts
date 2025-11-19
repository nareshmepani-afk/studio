import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
    if (ffmpeg) {
        return ffmpeg;
    }

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
        // Suppress verbose logs but keep errors
        if (message.includes('error') || message.includes('failed') || !message.startsWith('frame=')) {
            console.log(`[FFMPEG]: ${message}`);
        }
    });

    try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: `${baseURL}/ffmpeg-core.js`,
            wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            // The single-threaded core still needs a worker definition, even if it's not a real "worker"
            workerURL: `${baseURL}/ffmpeg-core.worker.js`,
        });
        console.log('FFmpeg (single-threaded) loaded successfully.');
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        ffmpeg = null; // Reset on failure
        throw error;
    }

    return ffmpeg;
}
