import { useState, useEffect, useRef, useCallback } from 'react';

export interface EDLTrackSegment {
  segmentId: string;
  blobUrl: string;
  startOffset: number; // Cut start relative to segment (seconds)
  endOffset: number;   // Cut end relative to segment (seconds)
  duration: number;    // Resulting active duration (seconds)
}

interface UseVideoSequencerProps {
  edl: EDLTrackSegment[];
  onTimeUpdate?: (cumulativeTime: number) => void;
}

export const useVideoSequencer = ({ edl, onTimeUpdate }: UseVideoSequencerProps) => {
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);

  const [activeBuffer, setActiveBuffer] = useState<'A' | 'B'>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [cumulativeTime, setCumulativeTime] = useState(0);

  const stateRef = useRef({
    currentSegmentIndex: 0,
    edl,
  });

  const prevOffsetsRef = useRef<{ [key: string]: { startOffset: number; endOffset: number } }>({});
  const prevActiveSegmentIdRef = useRef<string | null>(null);
  const prevEdlRef = useRef<EDLTrackSegment[] | null>(null);

  const getPlayers = useCallback(() => {
    const active = activeBuffer === 'A' ? videoARef.current : videoBRef.current;
    const standby = activeBuffer === 'A' ? videoBRef.current : videoARef.current;
    return { active, standby };
  }, [activeBuffer]);

  // Clamp segment index if EDL changes and index is out of bounds
  useEffect(() => {
    if (edl.length > 0 && currentSegmentIndex >= edl.length) {
      const nextIndex = edl.length - 1;
      setCurrentSegmentIndex(nextIndex);
      stateRef.current.currentSegmentIndex = nextIndex;
    }
  }, [edl, currentSegmentIndex]);

  // Sync segment changes to internal ref and active player currentTime
  useEffect(() => {
    stateRef.current.edl = edl;
    
    if (edl.length === 0) return;

    const activeVideo = activeBuffer === 'A' ? videoARef.current : videoBRef.current;
    const currentSeg = edl[currentSegmentIndex];
    if (!currentSeg) return;

    const prevSegOffsets = prevOffsetsRef.current[currentSeg.segmentId] || null;
    const oldActiveId = prevActiveSegmentIdRef.current;
    const edlChanged = prevEdlRef.current !== edl;
    const activeSegIdChanged = oldActiveId && currentSeg.segmentId !== oldActiveId;
    const isSplit = oldActiveId && (currentSeg.segmentId.startsWith(oldActiveId) || oldActiveId.startsWith(currentSeg.segmentId));

    if (activeVideo) {
      // Prime the active player with the first segment's source on initial load
      if (!activeVideo.src) {
        activeVideo.src = currentSeg.blobUrl;
        activeVideo.currentTime = currentSeg.startOffset;
        activeVideo.load();
        console.log(`[Sequencer] Initialized active buffer with segment: ${currentSeg.segmentId}`);
      } else if (activeVideo.src !== currentSeg.blobUrl) {
        // If the URL is different, load it
        activeVideo.src = currentSeg.blobUrl;
        activeVideo.currentTime = currentSeg.startOffset;
        activeVideo.load();
        activeVideo.removeAttribute('data-primed');
      } else if (edlChanged && activeSegIdChanged && !isSplit) {
        // EDL changed and the segment at the active index changed (e.g. deletion shift)
        console.log(`[Sequencer] Segment shifted/changed from ${oldActiveId} to ${currentSeg.segmentId}. Force syncing playhead to startOffset: ${currentSeg.startOffset}`);
        activeVideo.currentTime = currentSeg.startOffset;
        let leadTime = 0;
        for (let i = 0; i < currentSegmentIndex; i++) {
          leadTime += edl[i].duration;
        }
        setCumulativeTime(leadTime);
      } else if (prevSegOffsets) {
        // If the same URL but crop boundaries changed, sync playhead to the boundary
        if (currentSeg.startOffset !== prevSegOffsets.startOffset) {
          activeVideo.currentTime = currentSeg.startOffset;
          // Calculate new cumulative time for the timeline
          let leadTime = 0;
          for (let i = 0; i < currentSegmentIndex; i++) {
            leadTime += edl[i].duration;
          }
          setCumulativeTime(leadTime);
        } else if (currentSeg.endOffset !== prevSegOffsets.endOffset) {
          activeVideo.currentTime = currentSeg.endOffset;
          // Calculate new cumulative time for the timeline
          let leadTime = 0;
          for (let i = 0; i < currentSegmentIndex; i++) {
            leadTime += edl[i].duration;
          }
          setCumulativeTime(leadTime + currentSeg.duration);
        }
      }
    }

    // Keep track of the offsets to detect changes next time
    const newOffsets: { [key: string]: { startOffset: number; endOffset: number } } = {};
    edl.forEach((seg) => {
      newOffsets[seg.segmentId] = {
        startOffset: seg.startOffset,
        endOffset: seg.endOffset,
      };
    });
    prevOffsetsRef.current = newOffsets;
    prevActiveSegmentIdRef.current = currentSeg.segmentId;
    prevEdlRef.current = edl;

  }, [edl, currentSegmentIndex, activeBuffer]);

  // Smooth playhead & boundary monitoring loop
  useEffect(() => {
    if (!isPlaying) return;

    let animFrameId: number;

    const checkBoundary = () => {
      const { active, standby } = getPlayers();
      if (active) {
        const currentSeg = stateRef.current.edl[stateRef.current.currentSegmentIndex];
        if (currentSeg) {
          const relativeTime = active.currentTime;

          // Clamping/Hot-swap boundary check
          if (relativeTime >= currentSeg.endOffset) {
            const nextIndex = stateRef.current.currentSegmentIndex + 1;
            const nextSeg = stateRef.current.edl[nextIndex];

            if (nextSeg) {
              if (standby) {
                active.pause();
                standby.play()
                  .then(() => {
                    setActiveBuffer((prev) => prev === 'A' ? 'B' : 'A');
                    stateRef.current.currentSegmentIndex = nextIndex;
                    setCurrentSegmentIndex(nextIndex);
                  })
                  .catch((err) => console.error('[Sequencer] Hot-swap execution failed:', err));
              }
            } else {
              active.pause();
              active.currentTime = currentSeg.endOffset;
              setIsPlaying(false);
            }
          }
        }
      }
      animFrameId = requestAnimationFrame(checkBoundary);
    };

    animFrameId = requestAnimationFrame(checkBoundary);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, activeBuffer, getPlayers]);

  const totalDuration = edl.reduce((acc, seg) => acc + seg.duration, 0);

  const seekTo = useCallback((targetTime: number) => {
    let accumulated = 0;
    let targetSegmentIndex = 0;
    let targetOffset = 0;

    for (let i = 0; i < edl.length; i++) {
      if (targetTime <= accumulated + edl[i].duration) {
        targetSegmentIndex = i;
        targetOffset = edl[i].startOffset + (targetTime - accumulated);
        break;
      }
      accumulated += edl[i].duration;
    }

    stateRef.current.currentSegmentIndex = targetSegmentIndex;
    setCurrentSegmentIndex(targetSegmentIndex);
    setCumulativeTime(targetTime);

    const { active, standby } = getPlayers();
    if (active) {
      const targetSeg = edl[targetSegmentIndex];
      const needsLoad = active.src !== targetSeg.blobUrl;
      active.src = targetSeg.blobUrl;
      active.currentTime = targetOffset;
      active.removeAttribute('data-primed');
      if (needsLoad) {
        active.load();
      }

      if (isPlaying) {
        active.play().catch(() => {});
      }
    }
    
    if (standby) {
      standby.pause();
      standby.removeAttribute('data-primed');
    }
  }, [edl, getPlayers, isPlaying]);

  const togglePlay = useCallback(() => {
    const { active } = getPlayers();
    if (!active) return;

    if (isPlaying) {
      active.pause();
      setIsPlaying(false);
    } else {
      // Auto-rewind if the user clicks play at the very end of the entire timeline
      const currentSeg = stateRef.current.edl[stateRef.current.currentSegmentIndex];
      const isAtEnd = currentSeg ? active.currentTime >= currentSeg.endOffset - 0.1 : false;
      const isLastSegment = stateRef.current.currentSegmentIndex === stateRef.current.edl.length - 1;

      if (isAtEnd && isLastSegment) {
        seekTo(0);
      } else if (currentSeg && active.currentTime < currentSeg.startOffset) {
        // Clamp playhead to segment boundaries if needed
        active.currentTime = currentSeg.startOffset;
      }

      active.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('[Sequencer] Play blocked:', err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, getPlayers, seekTo]);

  const handleTimeUpdate = useCallback((bufferChanged: 'A' | 'B') => {
    if (bufferChanged !== activeBuffer) return;

    const { active, standby } = getPlayers();
    if (!active || !standby || !isPlaying) return;

    const currentSeg = stateRef.current.edl[stateRef.current.currentSegmentIndex];
    if (!currentSeg) return;

    const relativeTime = active.currentTime;

    let leadTime = 0;
    for (let i = 0; i < stateRef.current.currentSegmentIndex; i++) {
      leadTime += stateRef.current.edl[i].duration;
    }
    const globalPlayhead = leadTime + (relativeTime - currentSeg.startOffset);
    setCumulativeTime(globalPlayhead);
    if (onTimeUpdate) onTimeUpdate(globalPlayhead);

    const timeRemainingInSegment = currentSeg.endOffset - relativeTime;
    const nextIndex = stateRef.current.currentSegmentIndex + 1;
    const nextSeg = stateRef.current.edl[nextIndex];

    if (timeRemainingInSegment <= 1.5 && nextSeg && standby.getAttribute('data-primed') !== nextSeg.segmentId) {
      standby.src = nextSeg.blobUrl;
      standby.currentTime = nextSeg.startOffset;
      standby.load();
      standby.setAttribute('data-primed', nextSeg.segmentId);
      console.log(`[Sequencer] Standby buffer primed for segment: ${nextSeg.segmentId}`);
    }

    if (relativeTime >= currentSeg.endOffset) {
      if (nextSeg) {
        active.pause();
        standby.play()
          .then(() => {
            setActiveBuffer(activeBuffer === 'A' ? 'B' : 'A');
            stateRef.current.currentSegmentIndex = nextIndex;
            setCurrentSegmentIndex(nextIndex);
          })
          .catch((err) => console.error('[Sequencer] Hot-swap execution failed:', err));
      } else {
        active.pause();
        active.currentTime = currentSeg.endOffset;
        setIsPlaying(false);
      }
    }
  }, [activeBuffer, getPlayers, onTimeUpdate, isPlaying]);

  return {
    videoARef,
    videoBRef,
    activeBuffer,
    isPlaying,
    cumulativeTime,
    totalDuration,
    currentSegmentIndex,
    togglePlay,
    seekTo,
    handleTimeUpdate: () => handleTimeUpdate('A'),
    handleTimeUpdateB: () => handleTimeUpdate('B'),
  };
};
