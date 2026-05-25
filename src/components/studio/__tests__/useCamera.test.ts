import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCamera } from '@/hooks/useCamera';

describe('useCamera Privacy Shield Muting Hook', () => {
  const mockTrack = {
    stop: vi.fn(),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  };
  const mockStream = {
    getTracks: () => [mockTrack],
    getVideoTracks: () => [mockTrack],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock navigator.mediaDevices APIs
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', label: 'Camera 1' }
        ]),
      }
    });
  });

  it('Initializes with default unmuted state and starts stream if enabled', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));

    // Wait for the async startStream inside useEffect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isMuted).toBe(false);
    expect(result.current.stream).toBe(mockStream);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('Blocks stream initialization if isMuted is initially true in localStorage', async () => {
    localStorage.setItem('privacy_optics_muted', 'true');

    const { result } = renderHook(() => useCamera({ enabled: true }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isMuted).toBe(true);
    expect(result.current.stream).toBeNull();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('Immediately stops active stream tracks and updates state when privacy-optics-changed event fires', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));

    // Let the stream initialize
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.stream).toBe(mockStream);

    // Mute the camera
    act(() => {
      localStorage.setItem('privacy_optics_muted', 'true');
      window.dispatchEvent(new Event('privacy-optics-changed'));
    });

    expect(result.current.isMuted).toBe(true);
    expect(result.current.stream).toBeNull();
    expect(mockTrack.stop).toHaveBeenCalled();
  });
});
