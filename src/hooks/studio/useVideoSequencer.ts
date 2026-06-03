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
    isPlaying: false,
    currentSegmentIndex: 0,
    edl,
  });

  useEffect(() => {
    stateRef.current.edl = edl;
  }, [edl]);

  const totalDuration = edl.reduce((acc, seg) => acc + seg.duration, 0);

  const getPlayers = useCallback(() => {
    const active = activeBuffer === 'A' ? videoARef.current : videoBRef.current;
    const standby = activeBuffer === 'A' ? videoBRef.current : videoARef.current;
    return { active, standby };
  }, [activeBuffer]);

  const togglePlay = useCallback(() => {
    const { active } = getPlayers();
    if (!active) return;

    if (isPlaying) {
      active.pause();
      setIsPlaying(false);
      stateRef.current.isPlaying = false;
    } else {
      active.play().catch((err) => console.warn('[Sequencer] Play blocked:', err));
      setIsPlaying(true);
      stateRef.current.isPlaying = true;
    }
  }, [isPlaying, getPlayers]);

  const handleTimeUpdate = useCallback((bufferChanged: 'A' | 'B') => {
    if (bufferChanged !== activeBuffer) return;

    const { active, standby } = getPlayers();
    if (!active || !standby || !stateRef.current.isPlaying) return;

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
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
      }
    }
  }, [activeBuffer, getPlayers, onTimeUpdate]);

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
      active.src = targetSeg.blobUrl;
      active.currentTime = targetOffset;
      active.removeAttribute('data-primed');

      if (stateRef.current.isPlaying) {
        active.play().catch(() => {});
      }
    }
    
    if (standby) {
      standby.pause();
      standby.removeAttribute('data-primed');
    }
  }, [edl, getPlayers]);

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
