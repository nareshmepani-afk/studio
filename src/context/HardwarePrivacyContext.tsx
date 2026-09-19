'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export type HardwarePrivacyStatus = 'inactive' | 'live' | 'severed';

export interface HardwarePrivacyContextValue {
  status: HardwarePrivacyStatus;
  activeVideoTracks: number;
  activeAudioTracks: number;
  isKilled: boolean;
  killAllHardwareFeeds: () => void;
  rearmHardware: () => void;
  registerStream: (stream: MediaStream) => void;
  registerTrack: (track: MediaStreamTrack) => void;
}

const HardwarePrivacyContext = createContext<HardwarePrivacyContextValue | null>(null);

export function HardwarePrivacyProvider({ children }: { children: React.ReactNode }) {
  const trackedTracksRef = useRef<Set<MediaStreamTrack>>(new Set());
  const trackedStreamsRef = useRef<Set<MediaStream>>(new Set());
  const isKilledRef = useRef<boolean>(false);

  const [activeVideoTracks, setActiveVideoTracks] = useState<number>(0);
  const [activeAudioTracks, setActiveAudioTracks] = useState<number>(0);

  const [status, setStatus] = useState<HardwarePrivacyStatus>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('privacy_optics_muted') === 'true') {
          isKilledRef.current = true;
          return 'severed';
        }
      } catch (_) {}
    }
    return 'inactive';
  });

  const updateCountsAndStatus = useCallback(() => {
    // Prune dead tracks
    trackedTracksRef.current.forEach((track) => {
      if (track.readyState === 'ended') {
        trackedTracksRef.current.delete(track);
      }
    });

    let videoCount = 0;
    let audioCount = 0;

    trackedTracksRef.current.forEach((t) => {
      if (t.readyState === 'live') {
        if (t.kind === 'video') videoCount++;
        if (t.kind === 'audio') audioCount++;
      }
    });

    setActiveVideoTracks(videoCount);
    setActiveAudioTracks(audioCount);

    if (isKilledRef.current) {
      setStatus('severed');
    } else if (videoCount > 0 || audioCount > 0) {
      setStatus('live');
    } else {
      setStatus('inactive');
    }
  }, []);

  const registerTrack = useCallback((track: MediaStreamTrack) => {
    if (!track) return;
    trackedTracksRef.current.add(track);

    const handleEnded = () => {
      trackedTracksRef.current.delete(track);
      updateCountsAndStatus();
    };

    track.addEventListener('ended', handleEnded, { once: true });
    updateCountsAndStatus();
  }, [updateCountsAndStatus]);

  const registerStream = useCallback((stream: MediaStream) => {
    if (!stream) return;
    trackedStreamsRef.current.add(stream);
    stream.getTracks().forEach(registerTrack);
    updateCountsAndStatus();
  }, [registerTrack, updateCountsAndStatus]);

  const killAllHardwareFeeds = useCallback(() => {
    console.log('[HardwarePrivacy] Universal kill switch engaged: severing all physical feeds.');
    isKilledRef.current = true;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('privacy_optics_muted', 'true');
      } catch (_) {}
    }

    // 1. Stop all tracked MediaStreamTracks immediately
    trackedTracksRef.current.forEach((track) => {
      try {
        if (track.readyState === 'live') {
          track.stop();
          console.log(`[HardwarePrivacy] Stopped active track: ${track.kind} (${track.id || track.label})`);
        }
      } catch (err) {
        console.warn('[HardwarePrivacy] Error while stopping track:', err);
      }
    });
    trackedTracksRef.current.clear();

    // 2. Stop any remaining tracks on registered streams
    trackedStreamsRef.current.forEach((stream) => {
      try {
        stream.getTracks().forEach((track) => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      } catch (err) {
        console.warn('[HardwarePrivacy] Error stopping stream tracks:', err);
      }
    });
    trackedStreamsRef.current.clear();

    // 3. Detach srcObject from active media elements in the DOM to release hardware pipeline
    if (typeof document !== 'undefined') {
      try {
        const mediaElements = document.querySelectorAll<HTMLMediaElement>('video, audio');
        mediaElements.forEach((el) => {
          if (el.srcObject) {
            if (el.srcObject instanceof MediaStream) {
              el.srcObject.getTracks().forEach((t) => {
                try {
                  if (t.readyState === 'live') t.stop();
                } catch (_) {}
              });
            }
            el.srcObject = null;
          }
        });
      } catch (_) {}
    }

    setActiveVideoTracks(0);
    setActiveAudioTracks(0);
    setStatus('severed');

    // 4. Dispatch synchronisation events to the window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mw:hardware-severed'));
      window.dispatchEvent(new Event('privacy-optics-changed'));
    }
  }, []);

  const rearmHardware = useCallback(() => {
    console.log('[HardwarePrivacy] Hardware rearm triggered: clearing kill flag.');
    isKilledRef.current = false;

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('privacy_optics_muted');
      } catch (_) {}
    }

    setStatus('inactive');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mw:hardware-rearm'));
      window.dispatchEvent(new Event('privacy-optics-changed'));
    }
  }, []);

  // Intercept navigator.mediaDevices.getUserMedia globally
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator?.mediaDevices) return;

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia?.bind(navigator.mediaDevices);
    if (!originalGetUserMedia) return;

    navigator.mediaDevices.getUserMedia = async (constraints?: MediaStreamConstraints) => {
      const isMuted = isKilledRef.current || localStorage.getItem('privacy_optics_muted') === 'true';
      if (isMuted) {
        console.warn('[HardwarePrivacy] getUserMedia rejected: Hardware access severed by Privacy Shield.');
        throw new DOMException(
          'Camera and microphone access is severed by the Hardware Privacy Shield.',
          'NotAllowedError'
        );
      }

      const stream = await originalGetUserMedia(constraints);
      registerStream(stream);
      return stream;
    };

    const handleOpticsChanged = () => {
      try {
        const isMuted = localStorage.getItem('privacy_optics_muted') === 'true';
        if (isMuted && !isKilledRef.current) {
          killAllHardwareFeeds();
        } else if (!isMuted && isKilledRef.current) {
          rearmHardware();
        }
      } catch (_) {}
    };

    window.addEventListener('privacy-optics-changed', handleOpticsChanged);

    return () => {
      if (navigator?.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
      window.removeEventListener('privacy-optics-changed', handleOpticsChanged);
    };
  }, [killAllHardwareFeeds, rearmHardware, registerStream]);

  // App-Wide Browser Lifecycle Management (visibilitychange)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[HardwarePrivacy] Browser visibility hidden. Evaluating active feeds and recording state.');

        // Check if recording is currently in progress
        const isRecordingActive =
          Boolean((window as any)?.__MW_IS_RECORDING__) ||
          Boolean(document.querySelector('[data-recording="true"]'));

        if (isRecordingActive) {
          console.log('[HardwarePrivacy] Active recording in progress. Gracefully stopping before severance.');
          window.dispatchEvent(new CustomEvent('mw:emergency-stop-recording'));
          // Allow 300ms buffer for recorder to flush pending data chunks before severing hardware
          setTimeout(() => {
            killAllHardwareFeeds();
          }, 300);
        } else {
          console.log('[HardwarePrivacy] Idle camera preview detected on hidden tab. Immediately severing hardware.');
          killAllHardwareFeeds();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [killAllHardwareFeeds]);

  const value: HardwarePrivacyContextValue = {
    status,
    activeVideoTracks,
    activeAudioTracks,
    isKilled: status === 'severed',
    killAllHardwareFeeds,
    rearmHardware,
    registerStream,
    registerTrack,
  };

  return (
    <HardwarePrivacyContext.Provider value={value}>
      {children}
    </HardwarePrivacyContext.Provider>
  );
}

export function useHardwarePrivacy(): HardwarePrivacyContextValue {
  const context = useContext(HardwarePrivacyContext);
  if (!context) {
    // Fallback safe context if mounted outside provider
    return {
      status: 'inactive',
      activeVideoTracks: 0,
      activeAudioTracks: 0,
      isKilled: false,
      killAllHardwareFeeds: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('privacy_optics_muted', 'true');
            window.dispatchEvent(new Event('privacy-optics-changed'));
          } catch (_) {}
        }
      },
      rearmHardware: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('privacy_optics_muted');
            window.dispatchEvent(new Event('privacy-optics-changed'));
          } catch (_) {}
        }
      },
      registerStream: () => {},
      registerTrack: () => {},
    };
  }
  return context;
}
