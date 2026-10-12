/**
 * Media Stream Teardown Utility
 * Cleanly releases camera, microphone, and canvas streams before navigation
 * to prevent hardware resource leaks, macOS/iOS indicator leaks, and browser red recording dot lockups.
 *
 * Architecture Reference: BUG-MW-141 / Rule 7 Zuhandenheit Guard
 */

export function teardownActiveMediaStreams(): void {
  if (typeof document === 'undefined') return;

  try {
    const mediaElements = document.querySelectorAll<HTMLMediaElement>('video, audio');
    mediaElements.forEach((el) => {
      if (el.srcObject) {
        if (typeof (el.srcObject as any).getTracks === 'function') {
          try {
            const tracks = (el.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => {
              try {
                if (track.readyState === 'live') {
                  track.stop();
                }
              } catch (trackErr) {
                console.warn('[teardownActiveMediaStreams] Error stopping track:', trackErr);
              }
            });
          } catch (streamErr) {
            console.warn('[teardownActiveMediaStreams] Error getting stream tracks:', streamErr);
          }
        }
        el.srcObject = null;
      }
      try {
        el.pause();
      } catch (_) {}
    });
  } catch (err) {
    console.warn('[teardownActiveMediaStreams] Teardown execution warning:', err);
  }

  // Teardown any globally registered media streams if tracked
  if (typeof window !== 'undefined' && (window as any).__activeMediaStreams instanceof Set) {
    try {
      (window as any).__activeMediaStreams.forEach((stream: any) => {
        if (typeof stream?.getTracks === 'function') {
          stream.getTracks().forEach((track: any) => {
            try {
              if (track.readyState === 'live') track.stop();
            } catch (_) {}
          });
        }
      });
      (window as any).__activeMediaStreams.clear();
    } catch (_) {}
  }
}
