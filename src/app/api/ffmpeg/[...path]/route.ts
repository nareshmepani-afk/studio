import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Assuming your public directory is at the project root
// In serverless environments, `process.cwd()` is the standard way to get the project root.
const PUBLIC_FFMPEG_DIR = path.join(process.cwd(), 'public', 'ffmpeg');

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const filePathSegment = params.path.join('/');
  const filePath = path.join(PUBLIC_FFMPEG_DIR, filePathSegment);

  console.log(`API Route: Attempting to serve file: ${filePathSegment}`);

  try {
    const fileContent = await fs.readFile(filePath);

    // Determine Content-Type based on file extension
    let contentType = 'application/octet-stream'; // Default binary stream
    if (filePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (filePath.endsWith('.wasm')) {
      contentType = 'application/wasm';
    } else if (filePath.endsWith('.worker.js')) {
      contentType = 'application/javascript'; // Worker scripts are JS
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // These headers are critical for enabling SharedArrayBuffer for FFmpeg
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    // Add a strong caching policy for these static assets
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    console.log(`API Route: Successfully serving file: ${filePathSegment} with COOP/COEP headers.`);

    return new Response(fileContent, {
      status: 200,
      headers: headers,
    });

  } catch (error: any) {
    console.error(`API Route: Error serving file ${filePathSegment}:`, error);
    if (error.code === 'ENOENT') {
      return new Response('File Not Found', { status: 404 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
