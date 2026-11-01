import { NextResponse } from 'next/server';
import { QA_HTML_STRING } from '@/lib/qa/qaHtmlContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new NextResponse(QA_HTML_STRING, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
