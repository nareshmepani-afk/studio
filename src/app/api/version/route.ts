import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Module-level static capture fallback: ensures that even if NEXT_PUBLIC_BUILD_TIME
// is unset during dev mode or testing, the timestamp remains strictly immutable
// across requests within the process lifecycle.
const PROCESS_START_TIMESTAMP = new Date().toISOString();

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'v1.1.0-beta';
  const commitSha = 
    process.env.NEXT_PUBLIC_COMMIT_SHA || 
    process.env.NEXT_PUBLIC_GIT_SHA || 
    process.env.VERCEL_GIT_COMMIT_SHA || 
    process.env.BUILD_ID || 
    'dev';
  const commitTimestamp = process.env.NEXT_PUBLIC_COMMIT_TIME || null;
  // Immutable build timestamp: baked at compile-time via next.config.ts env,
  // falling back to module initialization time. Never evaluates new Date() per-request.
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || PROCESS_START_TIMESTAMP;

  return NextResponse.json(
    {
      version,
      commitSha,
      commitTimestamp,
      buildTimestamp,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        ...CORS_HEADERS,
      },
    }
  );
}
