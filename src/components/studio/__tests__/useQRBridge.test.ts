import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQRBridge } from '@/hooks/studio/useQRBridge';

// Mock useStudioState global hook
vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    actions: {
      toggleScrolling: vi.fn(),
    },
  }),
}));

// Mock peerjs class and methods
const mockConstructor = vi.fn();
const mockDestroy = vi.fn();
const mockOn = vi.fn();
const mockConnect = vi.fn();

vi.mock('peerjs', () => ({
  Peer: class {
    constructor(...args: any[]) {
      mockConstructor(...args);
    }
    on = mockOn;
    destroy = mockDestroy;
    connect = mockConnect;
  }
}));

describe('useQRBridge Hook & Muting Handshake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Initialises and instantiates Peer when optics are not muted', async () => {
    const { result } = renderHook(() => useQRBridge('test-memory-id'));

    // Wait for the dynamic peerjs import and initialization
    await waitFor(() => {
      expect(mockConstructor).toHaveBeenCalledWith('solo-remote-test-memory-id-host', expect.any(Object));
    });

    expect(result.current.peerState).toBe('idle'); // starts at idle
  });

  it('Does not instantiate Peer if optics are initially muted in localStorage', async () => {
    localStorage.setItem('privacy_optics_muted', 'true');

    const { result } = renderHook(() => useQRBridge('test-memory-id'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockConstructor).not.toHaveBeenCalled();
    expect(result.current.peerState).toBe('idle');
  });

  it('Destroys active Peer instance and sets state to idle when privacy-optics-changed fires (Optics Muted)', async () => {
    const { result } = renderHook(() => useQRBridge('test-memory-id'));

    // Wait for peer to initialize
    await waitFor(() => {
      expect(mockConstructor).toHaveBeenCalled();
    });

    // Mute optics and trigger event
    act(() => {
      localStorage.setItem('privacy_optics_muted', 'true');
      window.dispatchEvent(new Event('privacy-optics-changed'));
    });

    expect(mockDestroy).toHaveBeenCalled();
    expect(result.current.peerState).toBe('idle');
  });
});
