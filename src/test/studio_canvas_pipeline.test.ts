import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  computeCentredCropRect,
  isVirtualCameraDevice,
  supportsNativeBackgroundBlur,
} from '@/lib/cameraZoom';
import { useStudioCanvasPipeline } from '@/hooks/useStudioCanvasPipeline';

describe('MW-435 Phase 2 & MW-437 (Option 2B): Unified Studio Canvas Pipeline & Optics Helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. computeCentredCropRect computes exact centre crops at 1.0x, 2.0x, and 3.0x and clamps out-of-range inputs', () => {
    expect(computeCentredCropRect(1920, 1080, 1)).toEqual({
      sx: 0,
      sy: 0,
      sw: 1920,
      sh: 1080,
    });

    expect(computeCentredCropRect(1920, 1080, 2)).toEqual({
      sx: 480,
      sy: 270,
      sw: 960,
      sh: 540,
    });

    expect(computeCentredCropRect(1920, 1080, 3)).toEqual({
      sx: 640,
      sy: 360,
      sw: 640,
      sh: 360,
    });

    // Clamped to 3.0x max and 1.0x min
    expect(computeCentredCropRect(1920, 1080, 9).sw).toBe(640);
    expect(computeCentredCropRect(1920, 1080, 0.4).sw).toBe(1920);
  });

  it('2. detects virtual cameras (NuroumBlur / OBS) and native OS backgroundBlur capabilities accurately', () => {
    expect(isVirtualCameraDevice('NuroumBlur (Windows Virtual Camera) (Built-In)')).toBe(true);
    expect(isVirtualCameraDevice('OBS Virtual Camera')).toBe(true);
    expect(isVirtualCameraDevice('NVIDIA Broadcast')).toBe(true);
    expect(isVirtualCameraDevice('AnkerWork C310 Webcam (USB)')).toBe(false);
    expect(isVirtualCameraDevice('Integrated Webcam (Built-In)')).toBe(false);

    expect(supportsNativeBackgroundBlur({ backgroundBlur: [false, true] })).toBe(true);
    expect(supportsNativeBackgroundBlur({ backgroundBlur: [false] })).toBe(false);
    expect(supportsNativeBackgroundBlur({})).toBe(false);
  });

  it('3. passes original stream straight through with zero canvas overhead at 1.0x + Off, and composites canvas + original audio when zoomed or softened', async () => {
    const camVideoStop = vi.fn();
    const micAudioStop = vi.fn();
    const canvasVideoStop = vi.fn();

    const camVideoTrack = {
      kind: 'video',
      stop: camVideoStop,
      getSettings: () => ({ width: 1920, height: 1080 }),
    } as unknown as MediaStreamTrack;
    const micAudioTrack = {
      kind: 'audio',
      stop: micAudioStop,
    } as unknown as MediaStreamTrack;

    const rawStream = {
      getTracks: () => [camVideoTrack, micAudioTrack],
      getVideoTracks: () => [camVideoTrack],
      getAudioTracks: () => [micAudioTrack],
    } as unknown as MediaStream;

    // A) Pass-through at 1.0x + Off -> exact same stream reference, zero canvas compositing
    const { result, rerender, unmount } = renderHook(
      (props: { zoom: number; softening: 'off' | 'subtle' }) =>
        useStudioCanvasPipeline({
          stream: rawStream,
          digitalZoom: props.zoom,
          hardwareZoomActive: false,
          softeningMode: props.softening,
          nativeBlurActive: false,
        }),
      { initialProps: { zoom: 1, softening: 'off' as 'off' | 'subtle' } }
    );

    expect(result.current.recordingStream).toBe(rawStream);
    expect(result.current.isCanvasCompositing).toBe(false);
    expect(result.current.previewScale).toBe(1);
    expect(result.current.showPreviewSofteningOverlay).toBe(false);

    // Stub canvas 2D context + captureStream + MediaStream constructor for JSDOM verification
    const canvasVideoTrack = { kind: 'video', stop: canvasVideoStop } as unknown as MediaStreamTrack;
    const mockCtx: any = {
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      filter: 'none',
      globalCompositeOperation: 'source-over',
      fillStyle: '',
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
    (HTMLCanvasElement.prototype as any).captureStream = vi.fn(() => ({
      getVideoTracks: () => [canvasVideoTrack],
      getAudioTracks: () => [],
    }));

    const originalMediaStream = (globalThis as any).MediaStream;
    (globalThis as any).MediaStream = class MockMediaStream {
      private tracks: MediaStreamTrack[];
      constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = tracks;
      }
      getTracks() {
        return this.tracks;
      }
      getVideoTracks() {
        return this.tracks.filter((t) => t.kind === 'video');
      }
      getAudioTracks() {
        return this.tracks.filter((t) => t.kind === 'audio');
      }
    };

    try {
      // B) Digital zoom 2.2x + Subtle softening -> activates canvas compositor & preserves original mic audio track
      rerender({ zoom: 2.2, softening: 'subtle' });

      await waitFor(() => {
        expect(result.current.isCanvasCompositing).toBe(true);
      });
      expect(result.current.previewScale).toBe(2.2);
      expect(result.current.showPreviewSofteningOverlay).toBe(true);
      expect(result.current.recordingStream).not.toBe(rawStream);
      expect(result.current.recordingStream?.getVideoTracks()).toEqual([canvasVideoTrack]);
      expect(result.current.recordingStream?.getAudioTracks()).toEqual([micAudioTrack]);

      // C) Unmounting stops synthetic canvas video track ONLY — camera & mic tracks stay alive!
      unmount();
      expect(canvasVideoStop).toHaveBeenCalledTimes(1);
      expect(camVideoStop).not.toHaveBeenCalled();
      expect(micAudioStop).not.toHaveBeenCalled();
    } finally {
      (globalThis as any).MediaStream = originalMediaStream;
      delete (HTMLCanvasElement.prototype as any).captureStream;
    }
  });
});
