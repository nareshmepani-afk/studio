'use client';
import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Camera, Image as ImageIcon, User, RotateCcw, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { HeirloomPhotoAttachment, FIRESIDE_HAPTIC_PATTERNS } from '@/types/fireside';
import { compressHeirloomPhoto, formatFileSize } from '@/lib/media/clientImageCompressor';
import { useHardwarePrivacy } from '@/context/HardwarePrivacyContext';

export interface AlbumPhotoCaptureTrayRef {
  triggerCamera: () => void;
  triggerGallery: () => void;
  triggerSelfie?: () => void;
  scrollIntoView: () => void;
}

export interface AlbumPhotoCaptureTrayProps {
  photos: HeirloomPhotoAttachment[];
  onPhotosChange: (photos: HeirloomPhotoAttachment[]) => void;
  maxPhotos?: number;
  className?: string;
  suggestedPhotoPrompt?: string | null;
}

/**
 * 📷 Physical Album Photo Capture Tray
 *
 * Milestone: MW-87 (Ticket #247 / MW-246)
 * Target Route: /studio/fireside
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 *
 * Enables elderly narrators to digitise vintage heirloom prints, upload high-resolution
 * gallery photographs, or capture a live portrait selfie with client-side canvas compression.
 */
export const AlbumPhotoCaptureTray = forwardRef<AlbumPhotoCaptureTrayRef, AlbumPhotoCaptureTrayProps>(
  (
    {
      photos,
      onPhotosChange,
      maxPhotos = 6,
      className = '',
      suggestedPhotoPrompt = null,
    },
    ref
  ) => {
    const { rearmHardware } = useHardwarePrivacy();
    const containerRef = useRef<HTMLDivElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);
    const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
    const selfieStreamRef = useRef<MediaStream | null>(null);
    const replaceIndexRef = useRef<number | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);

    // Haptic feedback trigger
    const triggerHaptic = (pattern: readonly number[]) => {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate([...pattern]);
        } catch {
          // Vibrations not supported or blocked
        }
      }
    };

    const stopSelfieCamera = useCallback(() => {
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore already stopped track
          }
        });
        selfieStreamRef.current = null;
      }
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = null;
      }
      setIsSelfieCameraOpen(false);
    }, []);

    useEffect(() => {
      return () => {
        if (selfieStreamRef.current) {
          selfieStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {
              // Ignore
            }
          });
          selfieStreamRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (isSelfieCameraOpen && selfieVideoRef.current && selfieStreamRef.current) {
        selfieVideoRef.current.srcObject = selfieStreamRef.current;
        selfieVideoRef.current.play().catch(() => {
          // Autoplay handled by user gesture
        });
      }
    }, [isSelfieCameraOpen]);

    const processPhotoFile = async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setStatusMessage('Please select a valid photograph file (JPEG, PNG, HEIC).');
        return;
      }

      setIsProcessing(true);
      setStatusMessage('Digitising & compressing heirloom photo...');

      try {
        const compressed = await compressHeirloomPhoto(file, {
          maxBounding: 1600,
          quality: 0.82,
        });

        triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.PHOTO);

        const localUri = URL.createObjectURL(compressed.blob);
        const newAttachment: HeirloomPhotoAttachment = {
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          localUri,
          storageUrl: null,
          caption: suggestedPhotoPrompt ? `Heirloom: ${suggestedPhotoPrompt}` : '',
          capturedAt: new Date().toISOString(),
          originalFilename: file.name || 'album_print.jpg',
          fileSizeBytes: compressed.compressedSizeBytes,
          width: compressed.width,
          height: compressed.height,
          aspectRatio: compressed.width / compressed.height,
          rotation: 0,
          uploadStatus: 'pending',
        };

        if (replaceIndexRef.current !== null && replaceIndexRef.current >= 0) {
          const updated = [...photos];
          // Revoke prior blob URL to prevent memory leaks
          const prior = updated[replaceIndexRef.current];
          if (prior && prior.localUri.startsWith('blob:')) {
            URL.revokeObjectURL(prior.localUri);
          }
          updated[replaceIndexRef.current] = newAttachment;
          onPhotosChange(updated);
          setStatusMessage('Photograph replaced successfully.');
        } else {
          onPhotosChange([...photos, newAttachment]);
          setStatusMessage(`Photograph digitised (${formatFileSize(compressed.compressedSizeBytes)}).`);
        }

        // Auto-dismiss status message after 4 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 4000);
      } catch (err) {
        console.error('Photo compression error:', err);
        setStatusMessage('Unable to digitise photograph. Please try again.');
      } finally {
        setIsProcessing(false);
        replaceIndexRef.current = null;
      }
    };

    const handleStartSelfie = async () => {
      if (photos.length >= maxPhotos) {
        setStatusMessage(`Photo limit reached (maximum ${maxPhotos} photos).`);
        return;
      }
      replaceIndexRef.current = null;
      rearmHardware();

      if (
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
            audio: false,
          });
          selfieStreamRef.current = stream;
          setIsSelfieCameraOpen(true);
          setStatusMessage('Selfie camera active — position yourself and tap Capture Selfie.');
          return;
        } catch (err) {
          console.warn('[AlbumPhotoCaptureTray] Live selfie camera unavailable, falling back to file input:', err);
        }
      }

      selfieInputRef.current?.click();
    };

    const handleCaptureSelfieShutter = async () => {
      const videoEl = selfieVideoRef.current;
      if (!videoEl) return;

      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 960;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        stopSelfieCamera();
        return;
      }

      // Mirror horizontally to match the natural selfie preview
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, 0, 0, width, height);

      stopSelfieCamera();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );

      if (!blob) {
        setStatusMessage('Unable to capture selfie frame. Please try again.');
        return;
      }

      const selfieFile = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processPhotoFile(selfieFile);
    };

    // Expose imperative triggers for parent components (e.g. Spark carousel cues)
    useImperativeHandle(ref, () => ({
      triggerCamera: () => {
        if (photos.length >= maxPhotos) {
          setStatusMessage(`Photo limit reached (maximum ${maxPhotos} photos).`);
          return;
        }
        replaceIndexRef.current = null;
        cameraInputRef.current?.click();
      },
      triggerGallery: () => {
        if (photos.length >= maxPhotos) {
          setStatusMessage(`Photo limit reached (maximum ${maxPhotos} photos).`);
          return;
        }
        replaceIndexRef.current = null;
        galleryInputRef.current?.click();
      },
      triggerSelfie: () => {
        void handleStartSelfie();
      },
      scrollIntoView: () => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    }));

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      // Reset input value so re-selecting identical file fires onChange
      e.target.value = '';

      await processPhotoFile(file);
    };

    const handleRemovePhoto = (index: number) => {
      const target = photos[index];
      if (target && target.localUri.startsWith('blob:')) {
        URL.revokeObjectURL(target.localUri);
      }
      const updated = photos.filter((_, i) => i !== index);
      onPhotosChange(updated);
      triggerHaptic(FIRESIDE_HAPTIC_PATTERNS.PAUSE);
      setStatusMessage('Photograph removed.');
      setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleRetakePhoto = (index: number) => {
      replaceIndexRef.current = index;
      cameraInputRef.current?.click();
    };

    const handleCaptionChange = (index: number, newCaption: string) => {
      const updated = [...photos];
      if (updated[index]) {
        updated[index] = { ...updated[index], caption: newCaption };
        onPhotosChange(updated);
      }
    };

    const canAddMore = photos.length < maxPhotos;

    return (
      <div
        id="album-photo-capture-tray"
        ref={containerRef}
        className={`w-full bg-[#121212] border border-stone-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl transition-all duration-300 ${className}`}
      >
        {/* Hidden Native File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Capture photograph with camera"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Upload photograph from gallery"
        />
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Capture selfie photograph with front camera"
        />

        {/* Section Header with Photo Count */}
        <div className="flex items-center justify-between border-b border-stone-800/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-serif font-medium text-stone-100">
              Heirloom Photo Digitisation
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700/80 text-amber-300/90">
            {photos.length} / {maxPhotos} Photos
          </span>
        </div>

        {/* Recommended Photo Prompt Cue (if active) */}
        {suggestedPhotoPrompt && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">Spark Photo Cue: </span>
              {suggestedPhotoPrompt}
            </div>
          </div>
        )}

        {/* Polaroid Style Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-lg flex flex-col space-y-2.5 transition-all hover:border-amber-500/40"
              >
                {/* Image Container with Vintage Print Aesthetic */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 border border-stone-800/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.localUri}
                    alt={photo.caption || `Heirloom photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-stone-300 border border-stone-700/60">
                    {photo.width}×{photo.height} • {formatFileSize(photo.fileSizeBytes)}
                  </div>
                </div>

                {/* Caption Text Input */}
                <div>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    placeholder="Add a caption (e.g. Wedding day, Surat 1968)"
                    className="w-full text-xs bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                </div>

                {/* Card Secondary Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRetakePhoto(idx)}
                    disabled={isProcessing}
                    data-hotspot-id="HS_FIRESIDE_PHOTO_RETAKE_BTN"
                    className="flex-1 min-h-[40px] px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-98 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    disabled={isProcessing}
                    data-hotspot-id="HS_FIRESIDE_PHOTO_REMOVE_BTN"
                    className="min-h-[40px] px-3 rounded-xl bg-stone-800/60 hover:bg-red-950/40 hover:text-red-400 text-stone-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-98 disabled:opacity-50"
                    aria-label="Remove this photograph"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Live Selfie Viewfinder (when active) */}
        {isSelfieCameraOpen && (
          <div
            data-testid="selfie-camera-viewfinder"
            className="mb-4 p-4 rounded-2xl bg-stone-950 border border-amber-500/50 shadow-xl flex flex-col items-center space-y-3"
          >
            <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden bg-black border border-stone-800">
              <video
                ref={selfieVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-amber-500/40 text-[11px] font-medium text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Live Portrait Selfie Mirror</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={handleCaptureSelfieShutter}
                data-testid="capture-selfie-shutter-btn"
                data-hotspot-id="HS_FIRESIDE_PHOTO_SELFIE_SHUTTER_BTN"
                className="flex-1 min-h-[48px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
              >
                <Camera className="w-4 h-4 text-stone-950" />
                <span>Capture Selfie</span>
              </button>
              <button
                type="button"
                onClick={stopSelfieCamera}
                data-testid="cancel-selfie-camera-btn"
                className="min-h-[48px] px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary & Secondary Ingress Buttons */}
        {canAddMore ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Camera Button (≥56px touch target) */}
            <button
              type="button"
              onClick={() => {
                replaceIndexRef.current = null;
                cameraInputRef.current?.click();
              }}
              disabled={isProcessing}
              data-hotspot-id="HS_FIRESIDE_PHOTO_CAMERA_BTN"
              className="flex-1 min-h-[56px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/40 transition-all active:scale-98 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
                  <span>Digitising & compressing heirloom photo...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-stone-950" />
                  <span>Photograph Vintage Album Print</span>
                </>
              )}
            </button>

            {/* Secondary Gallery Button (≥48px touch target) */}
            <button
              type="button"
              onClick={() => {
                replaceIndexRef.current = null;
                galleryInputRef.current?.click();
              }}
              disabled={isProcessing}
              data-hotspot-id="HS_FIRESIDE_PHOTO_GALLERY_BTN"
              className="sm:w-auto min-h-[48px] px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
            >
              <ImageIcon className="w-4 h-4 text-stone-400" />
              <span>Choose from Device Gallery</span>
            </button>

            {/* Tertiary Selfie Button (≥48px touch target) */}
            <button
              type="button"
              onClick={() => {
                void handleStartSelfie();
              }}
              disabled={isProcessing}
              data-testid="take-selfie-photo-btn"
              data-hotspot-id="HS_FIRESIDE_PHOTO_SELFIE_BTN"
              className="sm:w-auto min-h-[48px] px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>Take a Selfie</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center text-xs text-stone-400">
            Maximum of {maxPhotos} heirloom photographs attached. Remove a photo to capture another.
          </div>
        )}

        {/* Dynamic Status / Feedback Message */}
        {statusMessage && (
          <p className="text-xs text-amber-400/90 text-center mt-3 animate-in fade-in duration-200">
            {statusMessage}
          </p>
        )}

        {/* Device-Aware Helper Note for Storytellers (Mobile vs Desktop) */}
        <p data-testid="photo-tray-helper-note" className="text-[11px] text-stone-400 text-center mt-3">
          <span className="sm:hidden" data-testid="photo-tray-helper-mobile">
            Hold your phone flat over the vintage album photo on your lap, or take a selfie. We automatically compress and preserve the heirloom grain.
          </span>
          <span className="hidden sm:inline" data-testid="photo-tray-helper-desktop">
            Upload a high-resolution photograph from your computer or take a live webcam selfie. We automatically compress and preserve the heirloom grain.
          </span>
        </p>
      </div>
    );
  }
);

AlbumPhotoCaptureTray.displayName = 'AlbumPhotoCaptureTray';
