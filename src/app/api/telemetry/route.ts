import { NextRequest, NextResponse } from 'next/server';
import { serverLog } from '@/utils/telemetry/serverLogger';
import { logToDb } from '@/utils/telemetry/dbLogger';

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

    // Direct the event directly into serverLog (GCP Cloud Logging)
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

    // Forward elevated alerts (WARNING, ERROR, CRITICAL) to Firestore system_logs for live ops console.
    // Routine client INFO events (e.g. typing, autosave, clicks) stream exclusively to serverLog
    // to prevent high-frequency write churn and eliminate log chatter in Live Gateway Logs.
    const mappedSeverity = 
      severity === 'WARNING' ? 'WARNING' :
      severity === 'ERROR' ? 'ERROR' :
      severity === 'CRITICAL' ? 'CRITICAL' : 'INFO';
      
    if (mappedSeverity !== 'INFO') {
      await logToDb(`[ClientTelemetry] ${message}`, mappedSeverity);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    // In case of parsing error or other exceptions
    serverLog({
      message: `Failed to process client telemetry event: ${error?.message || 'Unknown error'}`,
      severity: 'ERROR',
    });
    
    await logToDb(`Failed to process client telemetry event: ${error?.message || 'Unknown error'}`, 'ERROR');

    return NextResponse.json(
      { error: 'Failed to process telemetry' },
      { status: 500 }
    );
  }
}
