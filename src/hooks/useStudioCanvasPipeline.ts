'use client';

import { useEffect, useState } from 'react';
import { clampZoom, computeCentredCropRect, DIGITAL_ZOOM_RANGE } from '@/lib/cameraZoom';

export type BackgroundSofteningMode = 'off' | 'subtle';

export interface StudioCanvasPipelineOptions {
  stream: MediaStream | null;
  /** Digital zoom factor (1.0 – 3.0) used when hardware PTZ zoom is unavailable. */
  digitalZoom: number;
  /** True when hardware PTZ zoom is active on the camera track (no digital crop needed). */
  hardwareZoomActive: boolean;
  /** Option 2B: subtle radial studio edge-softening / portrait vignette. */
  softeningMode: BackgroundSofteningMode;
  /** True when OS/driver native backgroundBlur is active on the track (skip canvas softening). */
  nativeBlurActive: boolean;
}

export interface StudioCanvasPipelineResult {
  /** Stream to pass to `useMediaRecorder`: original `stream` at 1.0x + Off, or the composited canvas + original audio stream when active. */
  recordingStream: MediaStream | null;
  /** True when the offscreen canvas compositor is actively rendering frames. */
  isCanvasCompositing: boolean;
  /** True when subtle peripheral softening should also display on the live preview overlay. */
  showPreviewSofteningOverlay: boolean;
  /** Scale factor to apply on the live `<video>` preview element (1 when hardware zoom or 1.0x). */
  previewScale: number;
}

function resolveCanvasOutputDimensions(stream: MediaStream): { width: number; height: number } {
  const isMobile =
    typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent || '');
  const track = stream.getVideoTracks?.()[0];
  const settings =
    track && typeof track.getSettings === 'function' ? track.getSettings() : undefined;

  const maxTargetWidth = isMobile ? 960 : 1920;
  const maxTargetHeight = isMobile ? 540 : 1080;

  const srcW = Number(settings?.width);
  const srcH = Number(settings?.height);
  if (Number.isFinite(srcW) && srcW > 0 && Number.isFinite(srcH) && srcH > 0) {
    const scale = Math.min(1, maxTargetWidth / srcW, maxTargetHeight / srcH);
    return {
      width: Math.max(320, Math.round((srcW * scale) / 2) * 2),
      height: Math.max(180, Math.round((srcH * scale) / 2) * 2),
    };
  }

  return { width: maxTargetWidth, height: maxTargetHeight };
}

/**
 * Unified offscreen `<canvas>` video compositor for:
 * - MW-435 Phase 2: Recorded digital zoom (`1.0x` – `3.0x`) when hardware PTZ zoom is unavailable.
 * - MW-437 Option 2B: Zero-ML radial studio edge-softening & gentle portrait vignette when native OS blur is unavailable.
 *
 * Strictly pass-through (`recordingStream === stream`) whenever `digitalZoom <= 1.0` and canvas softening is inactive,
 * guaranteeing zero CPU/GPU overhead and zero alteration to standard 1.0x recordings.
 */
export function useStudioCanvasPipeline({
  stream,
  digitalZoom,
  hardwareZoomActive,
  softeningMode,
  nativeBlurActive,
}: StudioCanvasPipelineOptions): StudioCanvasPipelineResult {
  const clampedDigitalZoom = clampZoom(digitalZoom, DIGITAL_ZOOM_RANGE);
  const needsDigitalZoom = !hardwareZoomActive && clampedDigitalZoom > 1.001;
  const needsCanvasSoftening = softeningMode === 'subtle' && !nativeBlurActive;
  const shouldComposite = Boolean(stream && (needsDigitalZoom || needsCanvasSoftening));

  const [compositedStream, setCompositedStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!shouldComposite || !stream || typeof document === 'undefined') {
      setCompositedStream(null);
      return;
    }

    const mainCanvas = document.createElement('canvas');
    if (typeof (mainCanvas as HTMLCanvasElement & { captureStream?: unknown }).captureStream !== 'function') {
      // JSDOM or legacy environment without canvas.captureStream -> safe pass-through fallback
      setCompositedStream(null);
      return;
    }

    const { width, height } = resolveCanvasOutputDimensions(stream);
    mainCanvas.width = width;
    mainCanvas.height = height;

    const ctx = mainCanvas.getContext('2d');
    if (!ctx) {
      setCompositedStream(null);
      return;
    }

    // Small 320x180 auxiliary canvases for fast 60fps peripheral optical softening (Option 2B)
    const smallW = 320;
    const smallH = 180;
    let blurCanvas: HTMLCanvasElement | null = null;
    let blurCtx: CanvasRenderingContext2D | null = null;
    let featherCanvas: HTMLCanvasElement | null = null;
    let featherCtx: CanvasRenderingContext2D | null = null;

    if (needsCanvasSoftening) {
      blurCanvas = document.createElement('canvas');
      blurCanvas.width = smallW;
      blurCanvas.height = smallH;
      blurCtx = blurCanvas.getContext('2d');

      featherCanvas = document.createElement('canvas');
      featherCanvas.width = width;
      featherCanvas.height = height;
      featherCtx = featherCanvas.getContext('2d');
    }

    const sourceVideo = document.createElement('video');
    sourceVideo.muted = true;
    sourceVideo.playsInline = true;
    sourceVideo.autoplay = true;
    sourceVideo.srcObject = stream;
    try {
      const playPromise = sourceVideo.play?.();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay handled once stream frames arrive
        });
      }
    } catch {
      // Non-fatal JSDOM / autoplay guard
    }

    const drawFrame = () => {
      const vw = sourceVideo.videoWidth || width;
      const vh = sourceVideo.videoHeight || height;
      const effectiveZoom = needsDigitalZoom ? clampedDigitalZoom : 1;
      const { sx, sy, sw, sh } = computeCentredCropRect(vw, vh, effectiveZoom);

      ctx.drawImage(sourceVideo, sx, sy, sw, sh, 0, 0, width, height);

      if (needsCanvasSoftening && blurCanvas && blurCtx && featherCanvas && featherCtx) {
        blurCtx.save();
        blurCtx.filter = 'blur(6px)';
        blurCtx.drawImage(sourceVideo, sx, sy, sw, sh, 0, 0, smallW, smallH);
        blurCtx.restore();

        featherCtx.clearRect(0, 0, width, height);
        featherCtx.drawImage(blurCanvas, 0, 0, smallW, smallH, 0, 0, width, height);

        // Punch out the central portrait zone smoothly so the narrator's face, eyes & glasses stay 100% razor-sharp
        featherCtx.save();
        featherCtx.globalCompositeOperation = 'destination-out';
        const cx = width / 2;
        const cy = height * 0.48;
        const innerRadius = Math.min(width, height) * 0.3;
        const outerRadius = Math.max(width, height) * 0.62;
        const maskGrad = featherCtx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        maskGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.65)');
        maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        featherCtx.fillStyle = maskGrad;
        featherCtx.fillRect(0, 0, width, height);
        featherCtx.restore();

        ctx.drawImage(featherCanvas, 0, 0, width, height);

        // Subtle studio edge vignette for natural documentary depth
        const vignette = ctx.createRadialGradient(
          width / 2,
          height * 0.48,
          Math.min(width, height) * 0.36,
          width / 2,
          height * 0.5,
          Math.max(width, height) * 0.72
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
      }
    };

    let cancelled = false;
    let rvfcHandle: number | null = null;
    const anyVideo = sourceVideo as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };

    if (typeof anyVideo.requestVideoFrameCallback === 'function') {
      const step = () => {
        if (cancelled) return;
        drawFrame();
        rvfcHandle = anyVideo.requestVideoFrameCallback!(step);
      };
      rvfcHandle = anyVideo.requestVideoFrameCallback(step);
    }

    // 30fps timer guarantees continuous frames even before requestVideoFrameCallback fires or in background mocks
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        try {
          drawFrame();
        } catch {
          // Ignore transient drawImage errors before first decoded frame
        }
      }
    }, 33);

    const capturedCanvasStream = mainCanvas.captureStream(30);
    const combinedTracks: MediaStreamTrack[] = [
      ...(capturedCanvasStream.getVideoTracks?.() || []),
      ...(stream.getAudioTracks?.() || []),
    ];

    const outputStream =
      typeof MediaStream !== 'undefined'
        ? new MediaStream(combinedTracks)
        : capturedCanvasStream;

    setCompositedStream(outputStream);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (rvfcHandle !== null && typeof anyVideo.cancelVideoFrameCallback === 'function') {
        anyVideo.cancelVideoFrameCallback(rvfcHandle);
      }
      // Stop ONLY the synthetic canvas video tracks — never stop the underlying camera or mic tracks!
      capturedCanvasStream.getVideoTracks?.().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Non-fatal cleanup guard
        }
      });
      sourceVideo.srcObject = null;
      setCompositedStream(null);
    };
  }, [shouldComposite, stream, needsDigitalZoom, clampedDigitalZoom, needsCanvasSoftening]);

  return {
    recordingStream: shouldComposite && compositedStream ? compositedStream : stream,
    isCanvasCompositing: Boolean(shouldComposite && compositedStream),
    showPreviewSofteningOverlay: Boolean(stream && needsCanvasSoftening),
    previewScale: needsDigitalZoom ? clampedDigitalZoom : 1,
  };
}
