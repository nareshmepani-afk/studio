import { NextResponse } from 'next/server';

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'v1.1.0-beta';
  const commitSha = 
    process.env.NEXT_PUBLIC_COMMIT_SHA || 
    process.env.NEXT_PUBLIC_GIT_SHA || 
    process.env.VERCEL_GIT_COMMIT_SHA || 
    process.env.BUILD_ID || 
    'dev';
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

  return NextResponse.json(
    {
      version,
      commitSha,
      buildTimestamp,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    }
  );
}
