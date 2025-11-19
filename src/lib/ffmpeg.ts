
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
        // Use the single-threaded version of FFmpeg core
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            // No workerURL needed for single-threaded version
        });
        console.log('FFmpeg (single-threaded) loaded successfully.');
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        ffmpeg = null; // Reset on failure
        throw error;
    }

    return ffmpeg;
}
