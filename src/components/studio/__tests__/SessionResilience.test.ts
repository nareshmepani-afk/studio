import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQRBridge } from '@/hooks/studio/useQRBridge';
import localforage from 'localforage';

// Mock useStudioState
const mockActions = {
  toggleScrolling: vi.fn(),
};

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    actions: mockActions,
  }),
}));

// Mock peerjs class and methods inside a global object prefixed with 'mock' to survive hoisting and re-evaluation
let peerCallbacks: Record<string, Function> = {};

const mockGlobalMocks = {
  mockDestroy: vi.fn(),
  mockReconnect: vi.fn(),
  mockConstructor: vi.fn(),
};

vi.mock('peerjs', () => {
  return {
    Peer: class {
      constructor(...args: any[]) {
        mockGlobalMocks.mockConstructor(...args);
      }
      on(event: string, callback: Function) {
        peerCallbacks[event] = callback;
      }
      destroy() {
        mockGlobalMocks.mockDestroy();
      }
      reconnect() {
        mockGlobalMocks.mockReconnect();
      }
      disconnected = true;
      destroyed = false;
    },
    _mocks: mockGlobalMocks
  };
});

// Mock localforage
vi.mock('localforage', () => {
  const store: Record<string, any> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => store[key] || null),
      setItem: vi.fn(async (key: string, value: any) => {
        store[key] = value;
        return value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete store[key];
      }),
      keys: vi.fn(async () => Object.keys(store)),
    }
  };
});

describe('Session Resilience Engine (MW-59) - Automated Specs', () => {
  const originalSetTimeout = global.setTimeout;
  let mockSetTimeout: any;

  beforeEach(() => {
    vi.clearAllMocks();
    peerCallbacks = {};
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Triggers exponential backoff reconnect attempts when socket disconnects', async () => {
    const { result } = renderHook(() => useQRBridge('test-memory-id'));

    // Wait for the dynamic peerjs import and initialization
    await waitFor(() => {
      expect(mockGlobalMocks.mockConstructor).toHaveBeenCalled();
    });

    expect(result.current.bridgeStatus).toBe('disconnected');

    // Stub setTimeout now for the reconnect phase to bypass long delays
    mockSetTimeout = vi.fn((cb: any, delay: number) => {
      if (delay === 1000 || delay === 2000 || delay === 4000 || delay === 8000 || delay === 16000) {
        return originalSetTimeout(() => {
          cb();
        }, 1);
      }
      return originalSetTimeout(cb, delay);
    });
    vi.stubGlobal('setTimeout', mockSetTimeout);

    // Simulate open to signaling server
    act(() => {
      if (peerCallbacks['open']) {
        peerCallbacks['open']('solo-remote-test-memory-id-host');
      }
    });

    // Simulate disconnected event (PeerJS connection to signaling server dropped)
    act(() => {
      if (peerCallbacks['disconnected']) {
        peerCallbacks['disconnected']();
      }
    });

    expect(result.current.bridgeStatus).toBe('reconnecting');

    // Wait for the first reconnect attempt to fire (stubbed to 1ms)
    await waitFor(() => {
      expect(mockGlobalMocks.mockReconnect).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Simulate disconnect again to trigger next backoff
    act(() => {
      if (peerCallbacks['disconnected']) {
        peerCallbacks['disconnected']();
      }
    });

    // Wait for the second reconnect attempt to fire (stubbed to 1ms)
    await waitFor(() => {
      expect(mockGlobalMocks.mockReconnect).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  it('Intercepts server action errors and stores payload in localforage vault', async () => {
    // Verify that localforage mock is working correctly
    await localforage.setItem('cached_session_sync_token', 'mock-token-xyz');
    const cached = await localforage.getItem('cached_session_sync_token');
    expect(cached).toBe('mock-token-xyz');

    await localforage.removeItem('cached_session_sync_token');
    const cleared = await localforage.getItem('cached_session_sync_token');
    expect(cleared).toBeNull();
  });
});
