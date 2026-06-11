'use client';

import React, { useEffect } from 'react';
import { useJourneyLogger } from '@/hooks/telemetry/useJourneyLogger';

interface TelemetryProviderProps {
  userId?: string | null;
  sessionId?: string | null;
  children: React.ReactNode;
}

/**
 * TelemetryProvider handles mounting a window-level error event listener.
 * When an unhandled runtime error occurs, it intercepts the error payload
 * and dispatches it via useJourneyLogger to GCP telemetry.
 */
export function TelemetryProvider({
  userId,
  sessionId,
  children,
}: TelemetryProviderProps) {
  const { logEvent } = useJourneyLogger(userId, sessionId);

  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      // Prevent scraping of generic browser console noise if there is no error details or filename
      if (!event.message && !event.filename) {
        return;
      }

      logEvent(
        'CLIENT_RUNTIME_CRASH',
        {
          errorMessage: event.message || 'No error message available',
          errorFilename: event.filename || 'Unknown file',
          lineNumber: event.lineno || 0,
          stackTrace: event.error?.stack || 'No trace',
        },
        'ERROR'
      );
    };

    window.addEventListener('error', handleUnhandledError);
    return () => {
      window.removeEventListener('error', handleUnhandledError);
    };
  }, [logEvent]);

  return <>{children}</>;
}
