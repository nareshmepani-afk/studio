import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { serverLog } from '../utils/telemetry/serverLogger';
import { useJourneyLogger } from '../hooks/telemetry/useJourneyLogger';
import { TelemetryProvider } from '../components/providers/TelemetryProvider';
import { POST } from '../app/api/telemetry/route';
import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock console methods to verify output without polluting stdout
const originalLog = console.log;
const originalWarn = console.warn;

describe('Unified Telemetry & Distributed Tracing (MW-64)', () => {
  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    }));
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    vi.restoreAllMocks();
  });

  describe('1. ServerLogger Utility', () => {
    it('outputs structured JSON matching GCP schema', () => {
      serverLog({
        message: 'DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE',
        severity: 'INFO',
        userContext: { userId: 'user-123', sessionId: 'sess-456' },
        loggingContext: { traceId: 'trc_12345' },
        structPayload: { action: 'test-action', durationMs: 15 },
      });

      expect(console.log).toHaveBeenCalledTimes(1);
      const logArg = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logArg);

      expect(parsed).toHaveProperty('message', 'DISTRIBUTED CORRELATION TRACE INTERCEPTED // INGESTION POOL SECURE');
      expect(parsed).toHaveProperty('severity', 'INFO');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed.userContext).toEqual({ userId: 'user-123', sessionId: 'sess-456' });
      expect(parsed.loggingContext).toEqual({ traceId: 'trc_12345' });
      expect(parsed.structPayload).toEqual({ action: 'test-action', durationMs: 15 });
    });

    it('handles missing metadata context components gracefully', () => {
      serverLog({
        message: 'Minimal log message',
        severity: 'WARNING',
      });

      expect(console.log).toHaveBeenCalledTimes(1);
      const logArg = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logArg);

      expect(parsed.message).toBe('Minimal log message');
      expect(parsed.severity).toBe('WARNING');
      expect(parsed.userContext).toEqual({ userId: null, sessionId: null });
      expect(parsed.loggingContext).toEqual({ traceId: null });
      expect(parsed.structPayload).toEqual({});
    });
  });

  describe('2. Client API Route Handler', () => {
    it('extracts headers and logs event to stdout via serverLog', async () => {
      const mockReq = new NextRequest('http://localhost:3000/api/telemetry', {
        method: 'POST',
        headers: {
          'x-trace-id': 'trc_route_test_id',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Linguistic pivot performed in Scriptorium',
          severity: 'INFO',
          userContext: { userId: 'user-789', sessionId: 'sess-abc' },
          structPayload: { wordsCount: 42 },
        }),
      });

      const res = await POST(mockReq);
      expect(res.status).toBe(200);

      expect(console.log).toHaveBeenCalledTimes(1);
      const logArg = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logArg);

      expect(parsed.message).toBe('Linguistic pivot performed in Scriptorium');
      expect(parsed.loggingContext.traceId).toBe('trc_route_test_id');
      expect(parsed.userContext.userId).toBe('user-789');
      expect(parsed.structPayload.wordsCount).toBe(42);
    });

    it('returns 400 status if message or severity are missing', async () => {
      const mockReq = new NextRequest('http://localhost:3000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userContext: { userId: 'user-789' },
        }),
      });

      const res = await POST(mockReq);
      expect(res.status).toBe(400);
    });
  });

  describe('3. React Hook (useJourneyLogger)', () => {
    it('sends events to api endpoint using non-blocking queues', async () => {
      const TestComponent = () => {
        const { logEvent } = useJourneyLogger('test-user', 'test-sess');
        const trigger = () => {
          logEvent('CLICK_ACTION_ITEM', { target: 'save-button' }, 'INFO');
        };
        return <button onClick={trigger} data-testid="log-btn">Log</button>;
      };

      const { getByTestId } = render(<TestComponent />);
      getByTestId('log-btn').click();

      // Ensure fetch is invoked in the background asynchronously
      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const fetchCallArgs = (global.fetch as any).mock.calls[0];
      expect(fetchCallArgs[0]).toBe('/api/telemetry');
      const body = JSON.parse(fetchCallArgs[1].body);

      expect(body.message).toBe('CLICK_ACTION_ITEM');
      expect(body.severity).toBe('INFO');
      expect(body.userContext.userId).toBe('test-user');
      expect(body.structPayload.target).toBe('save-button');
    });

    it('falls back to console.warn upon network failures', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

      const TestComponent = () => {
        const { logEvent } = useJourneyLogger('test-user', 'test-sess');
        const trigger = () => {
          logEvent('CLICK_ACTION_ITEM', {}, 'INFO');
        };
        return <button onClick={trigger} data-testid="log-btn">Log</button>;
      };

      const { getByTestId } = render(<TestComponent />);
      getByTestId('log-btn').click();

      await vi.waitFor(() => {
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });

  describe('4. Global Exception Containment Shield (TelemetryProvider)', () => {
    it('binds to window errors and reports CLIENT_RUNTIME_CRASH telemetry logs', async () => {
      render(
        <TelemetryProvider userId="fatal-user" sessionId="fatal-session">
          <div>App content</div>
        </TelemetryProvider>
      );

      // Create and dispatch an artificial error event
      const error = new Error('Fatal UI compile crash');
      const errorEvent = new ErrorEvent('error', {
        message: 'Fatal UI compile crash',
        filename: 'main.js',
        lineno: 104,
        error: error,
      });
      window.dispatchEvent(errorEvent);

      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchCallArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCallArgs[1].body);

      expect(body.message).toBe('CLIENT_RUNTIME_CRASH');
      expect(body.severity).toBe('ERROR');
      expect(body.userContext.userId).toBe('fatal-user');
      expect(body.structPayload.errorMessage).toBe('Fatal UI compile crash');
      expect(body.structPayload.errorFilename).toBe('main.js');
      expect(body.structPayload.lineNumber).toBe(104);
      expect(body.structPayload.stackTrace).toContain('Error: Fatal UI compile crash');
    });
  });

  describe('5. Global Edge Middleware and Trace Propagation', () => {
    it('sets outbound x-trace-id header on responses', async () => {
      const mockReq = new NextRequest('http://localhost:3000/dashboard');
      const res = await middleware(mockReq);

      expect(res).toBeDefined();
      const outboundTraceId = res.headers.get('x-trace-id');
      expect(outboundTraceId).toBeDefined();
      expect(outboundTraceId?.startsWith('trc_')).toBe(true);
    });

    it('preserves incoming x-trace-id header if already present in headers', async () => {
      const mockReq = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          'x-trace-id': 'trc_incoming_123',
        },
      });
      const res = await middleware(mockReq);

      const outboundTraceId = res.headers.get('x-trace-id');
      expect(outboundTraceId).toBe('trc_incoming_123');
    });
  });
});
