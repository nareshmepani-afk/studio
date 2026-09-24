import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import {
  HardwarePrivacyProvider,
  useHardwarePrivacy,
} from '@/context/HardwarePrivacyContext';
import { OpticsPrivacyShield } from '@/components/studio/OpticsPrivacyShield';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { toast } from 'sonner';

const mockUsePathname = vi.fn().mockReturnValue('/studio');
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MW-89: Universal Hardware Privacy Shield & Stream Lifecycle Policy', () => {
  let mockOriginalGetUserMedia: any;
  let videoTrack: any;
  let audioTrack: any;
  let mockStream: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    videoTrack = {
      id: 'mock-video-1',
      kind: 'video',
      readyState: 'live',
      label: 'FaceTime HD Camera',
      stop: vi.fn(function (this: any) {
        this.readyState = 'ended';
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    audioTrack = {
      id: 'mock-audio-1',
      kind: 'audio',
      readyState: 'live',
      label: 'Internal Microphone',
      stop: vi.fn(function (this: any) {
        this.readyState = 'ended';
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockStream = {
      id: 'mock-stream-1',
      getTracks: () => [videoTrack, audioTrack],
      getVideoTracks: () => [videoTrack],
      getAudioTracks: () => [audioTrack],
    };

    mockOriginalGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockOriginalGetUserMedia,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initialises in inactive state and registers tracks when getUserMedia is invoked', async () => {
    const { result } = renderHook(() => useHardwarePrivacy(), {
      wrapper: ({ children }) => React.createElement(HardwarePrivacyProvider, null, children),
    });

    expect(result.current.status).toBe('inactive');
    expect(result.current.activeVideoTracks).toBe(0);
    expect(result.current.activeAudioTracks).toBe(0);

    // Invoke wrapped getUserMedia
    let stream: any;
    await act(async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });

    expect(stream).toBe(mockStream);
    expect(result.current.status).toBe('live');
    expect(result.current.activeVideoTracks).toBe(1);
    expect(result.current.activeAudioTracks).toBe(1);
    expect(result.current.isKilled).toBe(false);
  });

  it('severs all active hardware feeds, sets readyState to ended, and blocks future getUserMedia calls', async () => {
    const { result } = renderHook(() => useHardwarePrivacy(), {
      wrapper: ({ children }) => React.createElement(HardwarePrivacyProvider, null, children),
    });

    await act(async () => {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });

    expect(result.current.status).toBe('live');

    // Trigger universal kill switch
    act(() => {
      result.current.killAllHardwareFeeds();
    });

    expect(videoTrack.stop).toHaveBeenCalled();
    expect(audioTrack.stop).toHaveBeenCalled();
    expect(videoTrack.readyState).toBe('ended');
    expect(audioTrack.readyState).toBe('ended');

    expect(result.current.status).toBe('severed');
    expect(result.current.activeVideoTracks).toBe(0);
    expect(result.current.activeAudioTracks).toBe(0);
    expect(result.current.isKilled).toBe(true);
    expect(localStorage.getItem('privacy_optics_muted')).toBe('true');

    // Verify subsequent getUserMedia calls are blocked with NotAllowedError
    await expect(
      navigator.mediaDevices.getUserMedia({ video: true })
    ).rejects.toThrow('Camera and microphone access is severed by the Hardware Privacy Shield.');
  });

  it('re-arms hardware, resets kill flag, and allows new camera access', async () => {
    const { result } = renderHook(() => useHardwarePrivacy(), {
      wrapper: ({ children }) => React.createElement(HardwarePrivacyProvider, null, children),
    });

    act(() => {
      result.current.killAllHardwareFeeds();
    });
    expect(result.current.status).toBe('severed');

    // Rearm hardware
    act(() => {
      result.current.rearmHardware();
    });

    expect(result.current.status).toBe('inactive');
    expect(result.current.isKilled).toBe(false);
    expect(localStorage.getItem('privacy_optics_muted')).toBeNull();

    // Now getUserMedia should succeed again
    let newStream: any;
    await act(async () => {
      newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });
    expect(newStream).toBe(mockStream);
    expect(result.current.status).toBe('live');
  });

  it('renders 3-state OpticsPrivacyShield UI component with correct badges and interactions', async () => {
    mockUsePathname.mockReturnValue('/studio');
    render(
      React.createElement(
        HardwarePrivacyProvider,
        null,
        React.createElement(OpticsPrivacyShield)
      )
    );

    // State 1: Inactive
    const shieldBtn = screen.getByTestId('optics-privacy-shield-btn');
    expect(shieldBtn).toHaveAttribute('data-status', 'inactive');
    expect(shieldBtn.textContent).toContain('Optics Inactive');

    // Acquire stream to transition to State 2: Live
    await act(async () => {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });

    expect(shieldBtn).toHaveAttribute('data-status', 'live');
    expect(shieldBtn.textContent).toContain('CAMERA LIVE • Sever Feed ✕');

    // Click shield button to sever feed -> State 3: Severed (on /studio)
    act(() => {
      fireEvent.click(shieldBtn);
    });

    expect(shieldBtn).toHaveAttribute('data-status', 'severed');
    expect(shieldBtn.textContent).toContain('Optics Severed • Re-Arm Permissions');

    // Click again to restore/re-arm on non-soundstage route
    act(() => {
      fireEvent.click(shieldBtn);
    });

    expect(shieldBtn).toHaveAttribute('data-status', 'inactive');
    expect(shieldBtn.textContent).toContain('Optics Inactive');
    expect(toast.success).toHaveBeenCalledWith(
      'Optics Re-Armed',
      expect.objectContaining({
        description: expect.stringContaining('Soundstage'),
      })
    );
  });

  it('renders soundstage-specific restore label when severed inside active production soundstage', async () => {
    mockUsePathname.mockReturnValue('/studio/production/sample-scene');
    render(
      React.createElement(
        HardwarePrivacyProvider,
        null,
        React.createElement(OpticsPrivacyShield)
      )
    );

    const shieldBtn = screen.getByTestId('optics-privacy-shield-btn');

    await act(async () => {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });

    act(() => {
      fireEvent.click(shieldBtn);
    });

    expect(shieldBtn).toHaveAttribute('data-status', 'severed');
    expect(shieldBtn.textContent).toContain('Optics Severed • Click to Restore');
  });

  it('handles visibilitychange lifecycle by severing feeds when document is hidden', async () => {
    const { result } = renderHook(() => useHardwarePrivacy(), {
      wrapper: ({ children }) => React.createElement(HardwarePrivacyProvider, null, children),
    });

    await act(async () => {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });
    expect(result.current.status).toBe('live');

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(videoTrack.stop).toHaveBeenCalled();
    expect(result.current.status).toBe('severed');
    expect(videoTrack.readyState).toBe('ended');

    // Restore document.hidden
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  it('dispatches emergency stop event when document is hidden while recording is active', async () => {
    const emergencyStopSpy = vi.fn();
    window.addEventListener('mw:emergency-stop-recording', emergencyStopSpy);

    const { result } = renderHook(() => useHardwarePrivacy(), {
      wrapper: ({ children }) => React.createElement(HardwarePrivacyProvider, null, children),
    });

    await act(async () => {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    });

    // Mark recording as active
    (window as any).__MW_IS_RECORDING__ = true;

    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(emergencyStopSpy).toHaveBeenCalled();

    delete (window as any).__MW_IS_RECORDING__;
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    window.removeEventListener('mw:emergency-stop-recording', emergencyStopSpy);
  });

  it('verifies Rule 7 invariant: SoloStage.tsx preserves rehearsal initialisation and sanctioned stage controls', () => {
    const soloContent = fs.readFileSync(
      path.join(process.cwd(), 'src/components/studio/SoloStage.tsx'),
      'utf8'
    );
    expect(soloContent).toContain('first_flight_rehearsal');
    expect(soloContent).toContain('techAlignmentConfirmed');
  });

  it('verifies Rule 20 invariant: British English orthography standard in new files', () => {
    const contextContent = fs.readFileSync(
      path.join(process.cwd(), 'src/context/HardwarePrivacyContext.tsx'),
      'utf8'
    );
    const shieldContent = fs.readFileSync(
      path.join(process.cwd(), 'src/components/studio/OpticsPrivacyShield.tsx'),
      'utf8'
    );

    // Must contain UK English terms where applicable
    expect(contextContent).toContain('synchronisation');
    expect(shieldContent).toContain('initialise');

    // Must not contain banned American spellings in strings or comments
    expect(contextContent).not.toContain('synchronization');
    expect(shieldContent).not.toContain('initialize');
  });
});
