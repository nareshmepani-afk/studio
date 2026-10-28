import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useCamera,
  PREFERRED_VIDEO_DEVICE_STORAGE_KEY,
  PREFERRED_AUDIO_DEVICE_STORAGE_KEY,
  mapHeightToResolutionLabel,
  isExternalHardwareDevice,
} from '@/hooks/useCamera';

interface MockTrackOptions {
  kind: 'video' | 'audio';
  label: string;
  deviceId: string;
  height?: number;
  onStop?: () => void;
}

function createMockTrack({ kind, label, deviceId, height = 1080, onStop }: MockTrackOptions) {
  return {
    kind,
    label,
    stop: vi.fn(() => {
      onStop?.();
    }),
    getSettings: vi.fn(() => ({
      deviceId,
      ...(kind === 'video' ? { width: height === 2160 ? 3840 : 1920, height } : {}),
    })),
    getCapabilities: vi.fn(() => ({
      focusMode: ['continuous'],
    })),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  } as unknown as MediaStreamTrack;
}

function createMockStream(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack): MediaStream {
  const tracks = audioTrack ? [videoTrack, audioTrack] : [videoTrack];
  return {
    getTracks: () => tracks,
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => (audioTrack ? [audioTrack] : []),
  } as unknown as MediaStream;
}

describe('FEAT-MW-159: Native USB Camera & Microphone Discovery, Selection & Hardware Guards', () => {
  const mockDevices: MediaDeviceInfo[] = [
    {
      deviceId: 'integrated-cam-1',
      groupId: 'grp-1',
      kind: 'videoinput',
      label: 'Integrated Laptop HD Webcam',
      toJSON: () => ({}),
    },
    {
      deviceId: 'usb-brio-4k',
      groupId: 'grp-2',
      kind: 'videoinput',
      label: 'Logitech Brio 4K Stream Edition (USB)',
      toJSON: () => ({}),
    },
    {
      deviceId: 'integrated-mic-1',
      groupId: 'grp-1',
      kind: 'audioinput',
      label: 'Internal Microphone Array',
      toJSON: () => ({}),
    },
    {
      deviceId: 'usb-rode-mic',
      groupId: 'grp-3',
      kind: 'audioinput',
      label: 'Rode Wireless GO II RX (USB-C)',
      toJSON: () => ({}),
    },
  ];

  let currentEnumeratedDevices: MediaDeviceInfo[] = [];
  let enumerateDevicesMock: ReturnType<typeof vi.fn>;
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    currentEnumeratedDevices = [...mockDevices];

    enumerateDevicesMock = vi.fn(async () => currentEnumeratedDevices);
    getUserMediaMock = vi.fn(async (constraints: MediaStreamConstraints) => {
      const videoConstraint = constraints.video as MediaTrackConstraints | boolean;
      const audioConstraint = constraints.audio as MediaTrackConstraints | boolean;

      const requestedVideoId =
        typeof videoConstraint === 'object' &&
        videoConstraint !== null &&
        typeof videoConstraint.deviceId === 'object' &&
        (videoConstraint.deviceId as ConstrainDOMStringParameters).exact
          ? String((videoConstraint.deviceId as ConstrainDOMStringParameters).exact)
          : 'integrated-cam-1';

      const requestedAudioId =
        typeof audioConstraint === 'object' &&
        audioConstraint !== null &&
        typeof audioConstraint.deviceId === 'object' &&
        (audioConstraint.deviceId as ConstrainDOMStringParameters).exact
          ? String((audioConstraint.deviceId as ConstrainDOMStringParameters).exact)
          : 'integrated-mic-1';

      const matchedCam =
        currentEnumeratedDevices.find((d) => d.deviceId === requestedVideoId) || currentEnumeratedDevices[0];
      const matchedMic =
        currentEnumeratedDevices.find((d) => d.deviceId === requestedAudioId) || currentEnumeratedDevices[2];

      const is4kCam = matchedCam?.deviceId === 'usb-brio-4k';
      const vTrack = createMockTrack({
        kind: 'video',
        label: matchedCam?.label || 'STUDIO WEBCAM',
        deviceId: matchedCam?.deviceId || 'integrated-cam-1',
        height: is4kCam ? 2160 : 1080,
      });
      const aTrack = createMockTrack({
        kind: 'audio',
        label: matchedMic?.label || 'DEFAULT MICROPHONE',
        deviceId: matchedMic?.deviceId || 'integrated-mic-1',
      });

      return createMockStream(vTrack, aTrack);
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        enumerateDevices: enumerateDevicesMock,
        getUserMedia: getUserMediaMock,
        ondevicechange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enumerates all connected videoinput and audioinput USB devices and populates hardware labels', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));

    await waitFor(() => {
      expect(result.current.videoDevices).toHaveLength(2);
      expect(result.current.audioDevices).toHaveLength(2);
      expect(result.current.stream).not.toBeNull();
    });

    expect(result.current.hasMultipleCameras).toBe(true);
    expect(result.current.videoDevices[1].label).toBe('Logitech Brio 4K Stream Edition (USB)');
    expect(result.current.videoDevices[1].isExternalUsb).toBe(true);
    expect(result.current.audioDevices[1].label).toBe('Rode Wireless GO II RX (USB-C)');
    expect(result.current.audioDevices[1].isExternalUsb).toBe(true);
  });

  it('Guard 1: stops active tracks and clears videoRef.current.srcObject = null strictly BEFORE requesting new getUserMedia stream', async () => {
    const callOrder: string[] = [];
    const mockVideoEl = document.createElement('video');
    const videoRef = { current: mockVideoEl } as React.RefObject<HTMLVideoElement | null>;

    getUserMediaMock.mockImplementation(async (constraints: MediaStreamConstraints) => {
      callOrder.push(`getUserMedia:srcObject=${mockVideoEl.srcObject === null ? 'null' : 'active'}`);
      const videoConstraint = constraints.video as MediaTrackConstraints;
      const requestedId =
        typeof videoConstraint === 'object' &&
        videoConstraint?.deviceId &&
        typeof videoConstraint.deviceId === 'object'
          ? String((videoConstraint.deviceId as ConstrainDOMStringParameters).exact)
          : 'integrated-cam-1';

      const vTrack = createMockTrack({
        kind: 'video',
        label: requestedId === 'usb-brio-4k' ? 'Logitech Brio 4K Stream Edition (USB)' : 'Integrated Laptop HD Webcam',
        deviceId: requestedId,
        height: requestedId === 'usb-brio-4k' ? 2160 : 1080,
        onStop: () => callOrder.push(`track.stop:${requestedId}`),
      });
      const aTrack = createMockTrack({
        kind: 'audio',
        label: 'Internal Microphone Array',
        deviceId: 'integrated-mic-1',
      });
      const stream = createMockStream(vTrack, aTrack);
      mockVideoEl.srcObject = stream;
      return stream;
    });

    const { result } = renderHook(() => useCamera({ enabled: true, videoRef }));

    await waitFor(() => {
      expect(result.current.stream).not.toBeNull();
    });

    // Switch to the external 4K USB webcam
    await act(async () => {
      result.current.selectVideoDevice('usb-brio-4k');
    });

    await waitFor(() => {
      expect(result.current.activeCameraLabel).toBe('Logitech Brio 4K Stream Edition (USB)');
      expect(result.current.activeResolutionLabel).toBe('4K');
    });

    // Verify track.stop on integrated-cam-1 occurred BEFORE the second getUserMedia call,
    // and that videoRef.current.srcObject was already cleared to null when getUserMedia fired.
    const stopIdx = callOrder.indexOf('track.stop:integrated-cam-1');
    const secondGUMIdx = callOrder.lastIndexOf('getUserMedia:srcObject=null');
    expect(stopIdx).toBeGreaterThanOrEqual(0);
    expect(secondGUMIdx).toBeGreaterThan(stopIdx);
  });

  it('Guard 2: disables autoGainControl when an external USB microphone is selected and falls back on OverconstrainedError', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));

    await waitFor(() => {
      expect(result.current.stream).not.toBeNull();
    });

    getUserMediaMock.mockClear();

    // Simulate Level 1 (4K) throwing OverconstrainedError so Level 2 (1080p) negotiates cleanly
    getUserMediaMock.mockImplementationOnce(async () => {
      const err = new Error('4K not supported on this bus');
      err.name = 'OverconstrainedError';
      throw err;
    });

    await act(async () => {
      result.current.selectAudioDevice('usb-rode-mic');
    });

    await waitFor(() => {
      expect(result.current.activeMicLabel).toBe('Rode Wireless GO II RX (USB-C)');
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
    const secondAttemptConstraints = getUserMediaMock.mock.calls[1][0] as MediaStreamConstraints;
    expect(secondAttemptConstraints.audio).toEqual({
      deviceId: { exact: 'usb-rode-mic' },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false,
    });
  });

  it('Guard 3 & Cycle Switch: maps negotiated height (2160->4K, 1080->1080P, 720->720P) and cycles desktop USB cameras via switchCamera()', async () => {
    expect(mapHeightToResolutionLabel(2160)).toBe('4K');
    expect(mapHeightToResolutionLabel(1080)).toBe('1080P');
    expect(mapHeightToResolutionLabel(720)).toBe('720P');
    expect(isExternalHardwareDevice('Logitech Brio 4K', 'usb-brio-4k')).toBe(true);

    const { result } = renderHook(() => useCamera({ enabled: true }));

    await waitFor(() => {
      expect(result.current.selectedVideoDeviceId).toBe('integrated-cam-1');
      expect(result.current.activeResolutionLabel).toBe('1080P');
    });

    // Cycle to next camera using switchCamera()
    await act(async () => {
      result.current.switchCamera();
    });

    await waitFor(() => {
      expect(result.current.selectedVideoDeviceId).toBe('usb-brio-4k');
      expect(result.current.activeCameraLabel).toBe('Logitech Brio 4K Stream Edition (USB)');
      expect(result.current.activeResolutionLabel).toBe('4K');
    });
  });

  it('Guard 4: persists preferred USB deviceIds in localStorage and falls back to system default on USB hot-unplug (ondevicechange)', async () => {
    localStorage.setItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY, 'usb-brio-4k');
    localStorage.setItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY, 'usb-rode-mic');

    const { result } = renderHook(() => useCamera({ enabled: true }));

    await waitFor(() => {
      expect(result.current.selectedVideoDeviceId).toBe('usb-brio-4k');
      expect(result.current.selectedAudioDeviceId).toBe('usb-rode-mic');
      expect(result.current.activeCameraLabel).toBe('Logitech Brio 4K Stream Edition (USB)');
    });

    // Simulate unplugging both external USB devices mid-session
    currentEnumeratedDevices = [mockDevices[0], mockDevices[2]];

    await act(async () => {
      if (typeof navigator.mediaDevices.ondevicechange === 'function') {
        navigator.mediaDevices.ondevicechange(new Event('devicechange'));
      }
    });

    await waitFor(() => {
      expect(result.current.selectedVideoDeviceId).toBe('integrated-cam-1');
      expect(result.current.selectedAudioDeviceId).toBe('integrated-mic-1');
    });

    expect(localStorage.getItem(PREFERRED_VIDEO_DEVICE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PREFERRED_AUDIO_DEVICE_STORAGE_KEY)).toBeNull();
  });
});
