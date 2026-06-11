import { NextRequest, NextResponse } from 'next/server';
import { serverLog } from '@/utils/telemetry/serverLogger';

export async function POST(request: NextRequest) {
  try {
    // Read correlation trace ID from headers
    const traceId = request.headers.get('x-trace-id');

    // Parse the body payload from the client browser
    const body = await request.json();
    const { message, severity, userContext = {}, structPayload = {} } = body;

    if (!message || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: message or severity' },
        { status: 400 }
      );
    }

    // Direct the event directly into serverLog
    serverLog({
      message,
      severity,
      userContext: {
        userId: userContext.userId || null,
        sessionId: userContext.sessionId || null,
      },
      loggingContext: {
        traceId,
      },
      structPayload,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    // In case of parsing error or other exceptions
    serverLog({
      message: `Failed to process client telemetry event: ${error?.message || 'Unknown error'}`,
      severity: 'ERROR',
    });

    return NextResponse.json(
      { error: 'Failed to process telemetry' },
      { status: 500 }
    );
  }
}
