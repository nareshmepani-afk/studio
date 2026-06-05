import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }
  return NextResponse.json({ success: true, timestamp: Date.now() });
}
