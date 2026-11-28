import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useCamera,
  PREFERRED_VIDEO_DEVICE_STORAGE_KEY,
  PREFERRED_AUDIO_DEVICE_STORAGE_KEY,
  mapHeightToResolutionLabel,
  isExternalHardwareDevice,
  formatHardwareDeviceLabel,
  deduplicateHardwareDevices,
} from '@/hooks/useCamera';
import { resolveZoomRange, clampZoom, formatZoomLabel } from '@/lib/cameraZoom';

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

  it('Acoustics Check Deduplication & USB VID:PID Label Sanitizer (Trace mw_telemetry_9lucngsqut)', () => {
    const windowsAudioDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'anker-mic-guid',
        groupId: 'grp-anker',
        kind: 'audioinput',
        label: 'Microphone (AnkerWork C310 Webcam) (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'realtek-builtin-guid',
        groupId: 'grp-realtek',
        kind: 'audioinput',
        label: 'Microphone (Realtek(R) Audio)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'default',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Default - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'communications',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Communications - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'dji-rx-guid',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
    ];

    const deduplicated = deduplicateHardwareDevices(windowsAudioDevices, 'audioinput');
    expect(deduplicated).toHaveLength(3);

    expect(deduplicated[0]).toMatchObject({
      deviceId: 'anker-mic-guid',
      label: 'Microphone (AnkerWork C310 Webcam)',
      isExternalUsb: true,
    });
    expect(deduplicated[1]).toMatchObject({
      deviceId: 'realtek-builtin-guid',
      label: 'Microphone (Realtek(R) Audio)',
      isExternalUsb: false,
    });
    expect(deduplicated[2]).toMatchObject({
      deviceId: 'dji-rx-guid',
      label: 'DJI Microphone (Wireless Microphone RX)',
      isExternalUsb: true,
    });

    expect(formatHardwareDeviceLabel('AnkerWork C310 Webcam (291a:3367)')).toBe('AnkerWork C310 Webcam');
  });

  it('deduplicates audioinput and videoinput devices by filtering out Windows virtual default/communications duplicate aliases and matching normalized labels/groupIds', () => {
    const rawVideoDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'default',
        groupId: 'grp-cam-anker',
        kind: 'videoinput',
        label: 'Default - AnkerWork C310 Webcam (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'cam-anker-guid',
        groupId: 'grp-cam-anker',
        kind: 'videoinput',
        label: 'AnkerWork C310 Webcam (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'cam-anker-alt-guid',
        groupId: 'grp-cam-anker',
        kind: 'videoinput',
        label: 'AnkerWork C310 Webcam Stream 2',
        toJSON: () => ({}),
      },
      {
        deviceId: 'cam-builtin-guid',
        groupId: 'grp-cam-laptop',
        kind: 'videoinput',
        label: 'Integrated HD Webcam',
        toJSON: () => ({}),
      },
    ];

    const rawAudioDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'default',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Default - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'communications',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Communications - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'dji-guid',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'dji-subchannel-guid',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'DJI Wireless Subchannel',
        toJSON: () => ({}),
      },
      {
        deviceId: 'mic-realtek-guid',
        groupId: 'grp-realtek',
        kind: 'audioinput',
        label: 'Microphone (Realtek(R) Audio)',
        toJSON: () => ({}),
      },
    ];

    const dedupedVideo = deduplicateHardwareDevices(rawVideoDevices, 'videoinput');
    const dedupedAudio = deduplicateHardwareDevices(rawAudioDevices, 'audioinput');

    // Video: 'default' alias and duplicate groupId 'grp-cam-anker' filtered out
    expect(dedupedVideo).toHaveLength(2);
    expect(dedupedVideo[0]).toMatchObject({
      deviceId: 'cam-anker-guid',
      label: 'AnkerWork C310 Webcam',
      isExternalUsb: true,
      groupId: 'grp-cam-anker',
    });
    expect(dedupedVideo[1]).toMatchObject({
      deviceId: 'cam-builtin-guid',
      label: 'Integrated HD Webcam',
      isExternalUsb: false,
      groupId: 'grp-cam-laptop',
    });

    // Audio: 'default' and 'communications' aliases and duplicate groupId 'grp-dji' filtered out
    expect(dedupedAudio).toHaveLength(2);
    expect(dedupedAudio[0]).toMatchObject({
      deviceId: 'dji-guid',
      label: 'DJI Microphone (Wireless Microphone RX)',
      isExternalUsb: true,
      groupId: 'grp-dji',
    });
    expect(dedupedAudio[1]).toMatchObject({
      deviceId: 'mic-realtek-guid',
      label: 'Microphone (Realtek(R) Audio)',
      isExternalUsb: false,
      groupId: 'grp-realtek',
    });
  });
});


describe('MW-435 Phase 1: cameraZoom pure helpers', () => {
  it('resolveZoomRange returns null unless the camera exposes a usable min/max zoom span', () => {
    expect(resolveZoomRange(undefined)).toBeNull();
    expect(resolveZoomRange(null)).toBeNull();
    expect(resolveZoomRange({})).toBeNull();
    expect(resolveZoomRange({ focusMode: ['continuous'] })).toBeNull();
    expect(resolveZoomRange({ zoom: { min: 3, max: 3, step: 1 } })).toBeNull();
    expect(resolveZoomRange({ zoom: { min: 'x', max: 5 } })).toBeNull();
    expect(resolveZoomRange({ zoom: { min: 1, max: 5, step: 0.5 } })).toEqual({ min: 1, max: 5, step: 0.5 });
    // Missing / invalid step falls back to the 0.1 default
    expect(resolveZoomRange({ zoom: { min: 1, max: 5 } })).toEqual({ min: 1, max: 5, step: 0.1 });
    expect(resolveZoomRange({ zoom: { min: 1, max: 5, step: 0 } })?.step).toBe(0.1);
  });

  it('clampZoom keeps requests inside the camera range and tolerates NaN', () => {
    const range = { min: 1, max: 5, step: 0.5 };
    expect(clampZoom(9, range)).toBe(5);
    expect(clampZoom(0, range)).toBe(1);
    expect(clampZoom(2.5, range)).toBe(2.5);
    expect(clampZoom(Number.NaN, range)).toBe(1);
  });

  it('formatZoomLabel reports an honest ratio, including UVC drivers that report 100-500', () => {
    expect(formatZoomLabel(2, { min: 1, max: 5, step: 0.5 })).toBe('2.0x');
    expect(formatZoomLabel(300, { min: 100, max: 500, step: 1 })).toBe('3.0x');
    expect(formatZoomLabel(100, { min: 100, max: 500, step: 1 })).toBe('1.0x');
    expect(formatZoomLabel(1, null)).toBe('1.0x');
  });
});

describe('MW-435 Phase 1: Hardware PTZ Zoom Permission, Capability Reset & Honest Zoom State', () => {
  const ptzDevices = [
    { deviceId: 'cam-ptz', groupId: 'g1', kind: 'videoinput', label: 'PTZ Pro Camera (USB)', toJSON: () => ({}) },
    { deviceId: 'cam-fixed', groupId: 'g2', kind: 'videoinput', label: 'Integrated Laptop HD Webcam', toJSON: () => ({}) },
    { deviceId: 'mic-1', groupId: 'g3', kind: 'audioinput', label: 'Internal Microphone Array', toJSON: () => ({}) },
  ] as unknown as MediaDeviceInfo[];

  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let lastPtzTrack: any;
  let lastFixedTrack: any;

  function buildStreamFor(deviceId: string): MediaStream {
    const isPtz = deviceId === 'cam-ptz';
    const videoTrack: any = {
      kind: 'video',
      label: isPtz ? 'PTZ Pro Camera (USB)' : 'Integrated Laptop HD Webcam',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({ deviceId, width: 1920, height: 1080, ...(isPtz ? { zoom: 2 } : {}) })),
      getCapabilities: vi.fn(() => (isPtz ? { zoom: { min: 1, max: 5, step: 0.5 } } : {})),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };
    if (isPtz) lastPtzTrack = videoTrack;
    else lastFixedTrack = videoTrack;
    const audioTrack: any = {
      kind: 'audio',
      label: 'Internal Microphone Array',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({ deviceId: 'mic-1' })),
      getCapabilities: vi.fn(() => ({})),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };
    return {
      getTracks: () => [videoTrack, audioTrack],
      getVideoTracks: () => [videoTrack],
      getAudioTracks: () => [audioTrack],
    } as unknown as MediaStream;
  }

  beforeEach(() => {
    localStorage.clear();
    lastPtzTrack = undefined;
    lastFixedTrack = undefined;

    getUserMediaMock = vi.fn(async (constraints: MediaStreamConstraints) => {
      const video = constraints.video as MediaTrackConstraints | boolean;
      const exactId =
        typeof video === 'object' && video !== null && typeof video.deviceId === 'object'
          ? String((video.deviceId as ConstrainDOMStringParameters).exact || '')
          : '';
      return buildStreamFor(exactId || 'cam-ptz');
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => ptzDevices),
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

  it('adds the zoom:true PTZ permission hint to the first video constraint level', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));
    await waitFor(() => expect(result.current.stream).not.toBeNull());

    const firstConstraints = getUserMediaMock.mock.calls[0][0] as MediaStreamConstraints;
    expect((firstConstraints.video as any).zoom).toBe(true);
  });

  it('falls back to plain video:true (no PTZ hint) when the hinted levels are overconstrained and exposes no zoom range', async () => {
    getUserMediaMock.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (typeof constraints.video === 'object') {
        const err = new Error('Overconstrained');
        err.name = 'OverconstrainedError';
        throw err;
      }
      return buildStreamFor('cam-fixed');
    });

    const { result } = renderHook(() => useCamera({ enabled: true }));
    await waitFor(() => expect(result.current.stream).not.toBeNull());

    const lastConstraints = getUserMediaMock.mock.calls.at(-1)![0] as MediaStreamConstraints;
    expect(lastConstraints.video).toBe(true);
    expect(result.current.zoomRange).toBeNull();
    expect(result.current.zoomValue).toBe(1);
  });

  it('exposes a normalised zoomRange seeded from the track, and applyZoom clamps to the camera range', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));

    await waitFor(() => expect(result.current.zoomRange).toEqual({ min: 1, max: 5, step: 0.5 }));
    expect(result.current.zoomValue).toBe(2);
    expect(result.current.zoomError).toBeNull();

    await act(async () => {
      await result.current.applyZoom(9);
    });

    expect(lastPtzTrack.applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 5 }] });
    expect(result.current.zoomValue).toBe(5);
  });

  it('surfaces a zoomError (and keeps the previous zoom) when the camera rejects a zoom change', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));
    await waitFor(() => expect(result.current.zoomRange).not.toBeNull());

    lastPtzTrack.applyConstraints.mockRejectedValueOnce(new Error('UVC busy'));
    await act(async () => {
      await result.current.applyZoom(3);
    });

    expect(result.current.zoomError).toBe('Zoom change was rejected by this camera');
    expect(result.current.zoomValue).toBe(2);
  });

  it('resets zoomValue, zoomRange and capabilities when switching to a camera without hardware zoom, and applyZoom becomes a no-op', async () => {
    const { result } = renderHook(() => useCamera({ enabled: true }));
    await waitFor(() => expect(result.current.zoomRange).not.toBeNull());

    await act(async () => {
      await result.current.applyZoom(4);
    });
    expect(result.current.zoomValue).toBe(4);

    await act(async () => {
      result.current.selectVideoDevice('cam-fixed');
    });

    await waitFor(() => expect(result.current.zoomRange).toBeNull());
    expect(result.current.zoomValue).toBe(1);
    expect(result.current.capabilities?.zoom).toBeUndefined();

    await act(async () => {
      await result.current.applyZoom(3);
    });
    expect(lastFixedTrack.applyConstraints).not.toHaveBeenCalled();
    expect(result.current.zoomValue).toBe(1);
  });
});
