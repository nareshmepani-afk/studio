import { useCallback, MouseEvent } from 'react';
import { APP_VERSION } from '@/config/version';

export type TelemetrySeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogPayload {
  message: string;
  severity: TelemetrySeverity;
  userContext: {
    userId: string | null;
    sessionId: string | null;
  };
  structPayload: Record<string, any>;
}

// Global memory queue to store telemetry events sequentially
const telemetryQueue: LogPayload[] = [];
let isProcessingQueue = false;

/**
 * Sequential processing of the telemetry queue in the background.
 * Falls back to console.warn on network error or server failure.
 */
async function processTelemetryQueue(): Promise<void> {
  if (isProcessingQueue || telemetryQueue.length === 0) {
    return;
  }
  isProcessingQueue = true;

  while (telemetryQueue.length > 0) {
    const payload = telemetryQueue[0];
    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }
    } catch (error) {
      // Defensive fallback per MW-64 specs to console.warn to avoid disrupting the UI socket line
      console.warn(
        'Telemetry network socket ingestion failed. Falling back to local diagnostic log:',
        error,
        payload
      );
    }
    // Remove the handled request from the queue
    telemetryQueue.shift();
  }

  isProcessingQueue = false;
}

/**
 * useJourneyLogger exposes a non-blocking hook to transmit events to GCP logging pools.
 */
export function useJourneyLogger(
  userId?: string | null,
  sessionId?: string | null
) {
  const logEvent = useCallback(
    async (
      actionTag: string,
      metadata: Record<string, any> = {},
      severity: TelemetrySeverity = 'INFO'
    ): Promise<void> => {
      const payload: LogPayload = {
        message: actionTag,
        severity,
        userContext: {
          userId: userId || null,
          sessionId: sessionId || null,
        },
        structPayload: {
          ...metadata,
          version: metadata.version || APP_VERSION,
        },
      };

      telemetryQueue.push(payload);
      
      // Async trigger, zero blocking on main UI loop
      processTelemetryQueue().catch((err) => {
        console.warn('Telemetry queue processing failure:', err);
      });
    },
    [userId, sessionId]
  );

  const traceInteraction = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const target = (e.target as HTMLElement).closest('[data-hotspot-id]');
      if (!target) return;

      const hotspotId = target.getAttribute('data-hotspot-id');
      const targetLabel = target.textContent?.trim() || '';

      logEvent(`HOTSPOT_INTERACTION_${hotspotId}`, {
        hotspotId,
        targetLabel,
        version: APP_VERSION,
      });
    },
    [logEvent]
  );

  return { logEvent, traceInteraction };
}
export type UseJourneyLoggerReturn = ReturnType<typeof useJourneyLogger>;
export type LogEventFn = UseJourneyLoggerReturn['logEvent'];
export type logEvent = LogEventFn;
