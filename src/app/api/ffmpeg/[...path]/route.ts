import { promises as fs } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_DIR = join(process.cwd(), 'public');
const FFMPEG_DIR = join(PUBLIC_DIR, 'ffmpeg');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = params.path.join('/');
  const absoluteFilePath = join(FFMPEG_DIR, filePath);

  try {
    // Read the file content
    const fileContent = await fs.readFile(absoluteFilePath);

    // Determine the content type based on file extension
    let contentType = 'application/octet-stream'; // Default
    if (filePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (filePath.endsWith('.wasm')) {
      contentType = 'application/wasm';
    } else if (filePath.endsWith('.worker.js')) {
        contentType = 'application/javascript'; // Workers are also JS
    }

    // Set the necessary headers for Cross-Origin Isolation and caching
    const headers = {
      'Content-Type': contentType,
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cache-Control': 'public, max-age=31536000, immutable', // Strong caching
    };

    // Return the file content with headers
    return new NextResponse(fileContent, { headers });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File not found
      return new NextResponse('Not Found', { status: 404 });
    } else {
      // Other server errors
      console.error('Error serving FFmpeg file:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
}
