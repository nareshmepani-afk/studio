export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface UserContext {
  userId?: string | null;
  sessionId?: string | null;
}

export interface LoggingContext {
  traceId?: string | null;
}

export interface ServerLogParams {
  message: string;
  severity: LogSeverity;
  userContext?: UserContext;
  loggingContext?: LoggingContext;
  structPayload?: Record<string, any>;
}

/**
 * serverLog converts the entry parameters into a structured, type-safe JSON block.
 * The flat stringified JSON matches Google Cloud Logging payload structures and outputs via console.log.
 */
export function serverLog({
  message,
  severity,
  userContext = {},
  loggingContext = {},
  structPayload = {},
}: ServerLogParams): void {
  const logEntry = {
    message,
    severity,
    timestamp: new Date().toISOString(),
    userContext: {
      userId: userContext.userId || null,
      sessionId: userContext.sessionId || null,
    },
    loggingContext: {
      traceId: loggingContext.traceId || null,
    },
    structPayload,
  };

  console.log(JSON.stringify(logEntry));
}
