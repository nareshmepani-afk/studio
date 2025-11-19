import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
    if (ffmpeg) {
        return ffmpeg;
    }

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
        // Suppress verbose frame-by-frame logs but keep errors or other important messages
        if (message.includes('error') || message.includes('failed') || !message.startsWith('frame=')) {
            console.log(`[FFMPEG]: ${message}`);
        }
    });

    try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        // Load the single-threaded core directly without using toBlobURL
        await ffmpeg.load({
            coreURL: `${baseURL}/ffmpeg-core.js`,
            wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            // The single-threaded core doesn't need a real worker, but the load method
            // might still expect a worker URL, so we provide a placeholder or a no-op worker if available.
            // For version 0.12.6, simply providing the core and wasm URLs should be sufficient for the single-threaded version.
        });
        console.log('FFmpeg (single-threaded) loaded successfully.');
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        ffmpeg = null; // Reset on failure
        throw error;
    }

    return ffmpeg;
}
