
import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import fs from 'fs';

// This is a generic file handler for serving files from the public directory.
// It can be used for any file type, not just FFmpeg.
export async function GET(
  req: NextRequest,
  {params}: {params: {path: string[]}}
) {
  const filePath = path.join(process.cwd(), 'public', 'ffmpeg', ...params.path);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (filePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (filePath.endsWith('.wasm')) {
      contentType = 'application/wasm';
    } else if (filePath.endsWith('.json')) {
      contentType = 'application/json';
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('File not found', {status: 404});
    } else {
      return new NextResponse('Internal Server Error', {status: 500});
    }
  }
}
