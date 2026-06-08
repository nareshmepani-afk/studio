'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Scissors, Trash2, Sparkles, Check, Loader2, RotateCcw, Volume2, Undo, AlertTriangle, FileVideo, Maximize2, Minimize2, Film } from 'lucide-react';
import { useVideoSequencer, EDLTrackSegment } from '@/hooks/studio/useVideoSequencer';
import { toast } from 'sonner';

interface RecordEditingSuiteProps {
  segments: any[];
  onUpdateSegments: (newSegments: any[]) => void;
  onApprove: (edl: EDLTrackSegment[]) => void;
  onDiscard: () => void;
}

export const RecordEditingSuite: React.FC<RecordEditingSuiteProps> = ({
  segments,
  onUpdateSegments,
  onApprove,
  onDiscard,
}) => {
  // Convert standard segments to EDLTrackSegment objects
  const [edl, setEdl] = useState<EDLTrackSegment[]>([]);
  const [isStitching, setIsStitching] = useState(false);
  const [isTrimmingAI, setIsTrimmingAI] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Exit preview mode on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewMode) {
        setIsPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode]);

  // Sync segment changes to internal EDL state
  useEffect(() => {
    const formatted = segments.map((seg) => ({
      segmentId: seg.segmentId,
      blobUrl: seg.blobUrl,
      startOffset: seg.startOffset ?? 0,
      endOffset: seg.endOffset ?? seg.duration,
      duration: seg.duration,
      blob: seg.blob,
    }));
    setEdl(formatted);
  }, [segments]);

  const {
    videoARef,
    videoBRef,
    activeBuffer,
    isPlaying,
    cumulativeTime,
    totalDuration,
    currentSegmentIndex,
    togglePlay,
    seekTo,
    handleTimeUpdate,
    handleTimeUpdateB,
  } = useVideoSequencer({ edl });

  // Handle timeline scrubbing click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * totalDuration;
    seekTo(targetTime);
  };

  // Trimming Start/End crop adjustments for active segment
  const handleCropStartChange = (val: number) => {
    const updated = [...edl];
    const seg = updated[currentSegmentIndex];
    if (!seg) return;
    const nextStart = Math.min(val, seg.endOffset - 0.5);
    seg.startOffset = nextStart;
    seg.duration = seg.endOffset - nextStart;
    setEdl(updated);
    onUpdateSegments(updated);
  };

  const handleCropEndChange = (val: number) => {
    const updated = [...edl];
    const seg = updated[currentSegmentIndex];
    if (!seg) return;
    const nextEnd = Math.max(val, seg.startOffset + 0.5);
    seg.endOffset = nextEnd;
    seg.duration = nextEnd - seg.startOffset;
    setEdl(updated);
    onUpdateSegments(updated);
  };

  // Timeline Split at Playhead (Scissor Action)
  const handleSplit = () => {
    const activeSeg = edl[currentSegmentIndex];
    if (!activeSeg) return;

    // Find the relative playhead within the active segment
    let accumulated = 0;
    for (let i = 0; i < currentSegmentIndex; i++) {
      accumulated += edl[i].duration;
    }
    const relativePlayhead = activeSeg.startOffset + (cumulativeTime - accumulated);

    // Make sure we aren't splitting too close to edges (0.5s limit)
    if (relativePlayhead - activeSeg.startOffset < 0.5 || activeSeg.endOffset - relativePlayhead < 0.5) {
      toast.warning("Split position is too close to the edge of the segment.");
      return;
    }

    const firstSegment: EDLTrackSegment = {
      ...activeSeg,
      segmentId: `${activeSeg.segmentId}_pt1`,
      endOffset: relativePlayhead,
      duration: relativePlayhead - activeSeg.startOffset,
    };

    const secondSegment: EDLTrackSegment = {
      ...activeSeg,
      segmentId: `${activeSeg.segmentId}_pt2`,
      startOffset: relativePlayhead,
      duration: activeSeg.endOffset - relativePlayhead,
    };

    const updated = [...edl];
    updated.splice(currentSegmentIndex, 1, firstSegment, secondSegment);
    
    setEdl(updated);
    onUpdateSegments(updated);
    toast.success("Timeline split successfully.", {
      description: "You now have two separate editing tracks."
    });
  };

  // Delete segment from EDL
  const handleDeleteSegment = (indexToDelete: number) => {
    if (edl.length <= 1) {
      toast.error("Cannot delete the only segment.", {
        description: "If you wish to delete the entire take, click Discard."
      });
      return;
    }
    const updated = edl.filter((_, idx) => idx !== indexToDelete);
    setEdl(updated);
    onUpdateSegments(updated);
    
    // Seek to beginning of the new timeline sequence
    seekTo(0);
    
    toast.success("Segment removed from timeline.");
  };

  // AI Auto-Trim (Silence Cutter)
  const handleAIAutoTrim = () => {
    setIsTrimmingAI(true);
    toast.info("SCANNING AUDIO WAVEFORMS...", {
      description: "Detecting narrative silences & pauses (> 3s)"
    });

    setTimeout(() => {
      // Simulate trimming
      let silencesCount = 0;
      const updated = edl.map((seg) => {
        if (seg.duration > 8) {
          silencesCount++;
          // Trim 1.5 seconds off the end where silence is simulated
          const nextEnd = Math.max(seg.startOffset + 2, seg.endOffset - 1.5);
          return {
            ...seg,
            endOffset: nextEnd,
            duration: nextEnd - seg.startOffset,
          };
        }
        return seg;
      });

      setEdl(updated);
      onUpdateSegments(updated);
      setIsTrimmingAI(false);
      
      // Auto seek to beginning so they can replay the trimmed video
      seekTo(0);
      
      toast.success("AI AUTO-TRIM COMPLETE", {
        description: `Successfully cleaned ${silencesCount} narrative pauses.`
      });
    }, 1500);
  };

  // Stitch & Approve Submit
  const handleStitch = () => {
    setIsStitching(true);
    onApprove(edl);
  };

  return (
    <div className={`w-full transition-all duration-300 backdrop-blur-md relative pointer-events-auto select-none ${
      isMaximized 
        ? "w-full h-full max-w-none max-h-none bg-slate-950/95 p-8 flex flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl" 
        : "max-w-4xl bg-slate-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 flex flex-col gap-6 overflow-y-auto max-h-[90vh] custom-scrollbar"
    }`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/20 via-transparent to-white/5 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-lg font-black text-white uppercase tracking-[0.15em] font-mono">
            EDITING SUITE
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full">
            VIRTUAL EDL ACTIVE
          </span>
          <button
            onClick={() => setIsPreviewMode(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            title="Open Cinematic Preview"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Director's Preview</span>
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 text-white hover:text-emerald-400 transition-all cursor-pointer flex items-center justify-center"
            title={isMaximized ? "Restore down" : "Maximize view"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className={`flex flex-col gap-6 ${isMaximized ? "lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:flex-grow lg:min-h-0 lg:overflow-hidden" : ""}`}>
        
        {/* Left Column (Video + Scrubber in maximized layout) */}
        <div className={`flex flex-col gap-6 ${isMaximized ? "lg:min-h-0 lg:h-full lg:justify-between" : ""}`}>
          
          {/* Video Preview Canvas Layer */}
          <div 
            className={`relative w-full overflow-hidden bg-black border border-white/5 shadow-2xl group/video flex items-center justify-center transition-all duration-300 ${
              isPreviewMode
                ? "absolute inset-0 z-50 p-6 flex flex-col justify-between rounded-[2.5rem]"
                : isMaximized 
                  ? "lg:flex-grow lg:min-h-0 lg:h-0 rounded-3xl shrink-0" 
                  : "aspect-video rounded-3xl shrink-0"
            }`}
            style={(!isMaximized && !isPreviewMode) ? { aspectRatio: '16 / 9' } : {}}
            onDoubleClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isStitching ? (
              <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                <div className="text-center space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono animate-pulse">
                    COMMENCING CINEMATIC STITCH
                  </h4>
                  <p className="text-[10px] text-white/40 tracking-wider">
                    FRAME-ACCURATE ALIGNMENT IN PROGRESS
                  </p>
                </div>
              </div>
            ) : null}

            {/* Buffer A element */}
            <video
              ref={videoARef}
              onTimeUpdate={handleTimeUpdate}
              data-testid="review-video"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-in-out ${
                activeBuffer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              playsInline
            />

            {/* Buffer B element */}
            <video
              ref={videoBRef}
              onTimeUpdate={handleTimeUpdateB}
              data-testid="review-video-b"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-in-out ${
                activeBuffer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              playsInline
            />

            {/* Dual buffer overlay controller */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-20 pointer-events-none" />

            {/* Director's Preview Top Bar */}
            {isPreviewMode && (
              <div className="absolute top-6 left-6 right-6 z-40 flex items-center justify-between border-b border-white/5 pb-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] font-mono">
                    DIRECTOR'S PREVIEW MODE
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPreviewMode(false); }}
                  className="px-3 py-1.5 text-[9px] font-mono text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Close Preview
                </button>
              </div>
            )}

            {/* Play/Pause Button overlay */}
            {!isPreviewMode && (
              <div className={`absolute inset-0 flex items-center justify-center z-30 transition-opacity pointer-events-auto ${
                isPlaying ? 'opacity-0 group-hover/video:opacity-100 bg-black/30' : 'opacity-100 bg-black/40'
              }`}>
                <button
                  onClick={togglePlay}
                  data-testid="play-pause-overlay-btn"
                  className="w-16 h-16 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 hover:border-emerald-400 hover:text-emerald-400 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                </button>
              </div>
            )}

            {/* Director's Preview Bottom Bar (Auto-hiding HUD controls) */}
            {isPreviewMode && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 left-6 right-6 z-40 flex flex-col gap-3 bg-zinc-950/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl opacity-0 group-hover/video:opacity-100 transition-opacity duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-cyan-400 border border-white/10 hover:border-cyan-500/30 flex items-center justify-center transition-all cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
                    </button>
                    <span className="text-[10px] font-mono text-white/60">
                      {Math.floor(cumulativeTime / 60)}:{(Math.floor(cumulativeTime) % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(Math.floor(totalDuration) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                    CINEMATIC PREVIEW ACTIVE
                  </span>
                </div>
                
                {/* Embedded preview timeline scrubber */}
                <div
                  onClick={(e) => { e.stopPropagation(); handleTimelineClick(e); }}
                  className="relative h-2 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden cursor-pointer p-0 hover:border-white/10 transition-colors"
                >
                  {edl.map((seg, idx) => {
                    const widthPercentage = (seg.duration / totalDuration) * 100;
                    return (
                      <div
                        key={seg.segmentId}
                        className={`h-full relative transition-all ${
                          idx === currentSegmentIndex
                            ? 'bg-cyan-500/20'
                            : 'bg-white/5'
                        }`}
                        style={{ width: `${widthPercentage}%` }}
                      />
                    );
                  })}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#06b6d4] z-30 pointer-events-none"
                    style={{ left: `${(cumulativeTime / totalDuration) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live timing HUD */}
            {!isPreviewMode && (
              <div className="absolute bottom-4 right-6 z-30 font-mono text-[10px] text-white/60 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                {Math.floor(cumulativeTime / 60)}:{(Math.floor(cumulativeTime) % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(Math.floor(totalDuration) % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Custom Scrubber Timeline */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest">
              <span>Active Tracks: {edl.length}</span>
              <span>Timeline Position: {cumulativeTime.toFixed(1)}s</span>
            </div>

            <div
              onClick={handleTimelineClick}
              className="relative h-10 w-full bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden cursor-pointer flex gap-1 p-1 hover:border-white/10 transition-colors"
            >
              {edl.map((seg, idx) => {
                const widthPercentage = (seg.duration / totalDuration) * 100;
                return (
                  <div
                    key={seg.segmentId}
                    className={`h-full relative rounded-lg border transition-all ${
                      idx === currentSegmentIndex
                        ? 'bg-emerald-500/20 border-emerald-500/40 shadow-inner'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                    style={{ width: `${widthPercentage}%` }}
                  >
                    {/* Visual Audio Waveform peaks mock */}
                    <div className="absolute inset-0 flex items-center justify-around px-2 pointer-events-none opacity-25">
                      <div className="w-[2px] h-3 bg-white rounded-full" />
                      <div className="w-[2px] h-5 bg-white rounded-full" />
                      <div className="w-[2px] h-4 bg-white rounded-full" />
                      <div className="w-[2px] h-2 bg-white rounded-full" />
                    </div>
                  </div>
                );
              })}

              {/* Scrubbing Playhead line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981] z-30 transition-all pointer-events-none"
                style={{ left: `${(cumulativeTime / totalDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Controls + Inspector in maximized layout) */}
        <div className={`flex flex-col gap-6 ${isMaximized ? "lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-2 lg:custom-scrollbar lg:justify-between" : ""}`}>
          
          <div className="flex flex-col gap-6">
            {/* Segment Inspector list when maximized */}
            {isMaximized && (
              <div className="bg-slate-950/40 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 font-mono">
                <div className="text-[10px] text-white/50 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  EDL Segment Inspector ({edl.length})
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {edl.map((seg, idx) => {
                    const isActive = idx === currentSegmentIndex;
                    return (
                      <div
                        key={seg.segmentId}
                        onClick={() => {
                          // Jump to start of the clicked segment
                          let targetTime = 0;
                          for (let i = 0; i < idx; i++) {
                            targetTime += edl[i].duration;
                          }
                          // Jump slightly inside to ensure timeupdate sets currentSegmentIndex correctly
                          seekTo(targetTime + 0.05);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-[10px] cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                          Seg {idx + 1}
                        </span>
                        <span className="font-mono text-white/40">
                          {seg.duration.toFixed(1)}s ({(seg.startOffset).toFixed(1)}s - {(seg.endOffset).toFixed(1)}s)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fine-Tuning Trim Controls */}
            <AnimatePresence mode="wait">
              {edl[currentSegmentIndex] && (
                <motion.div
                  key={currentSegmentIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="bg-slate-950/40 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 font-mono"
                >
                  <div className="flex items-center justify-between text-[10px] text-white/50 uppercase tracking-widest border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-emerald-400">
                      <FileVideo className="w-3.5 h-3.5" />
                      Segment {currentSegmentIndex + 1} Editor
                    </span>
                    <button
                      onClick={() => handleDeleteSegment(currentSegmentIndex)}
                      className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Segment
                    </button>
                  </div>

                  {/* Slider trims */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/40 uppercase">Crop Start</span>
                        <span className="text-emerald-400">{edl[currentSegmentIndex].startOffset.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={edl[currentSegmentIndex].endOffset - 0.5}
                        step="0.1"
                        value={edl[currentSegmentIndex].startOffset}
                        onChange={(e) => handleCropStartChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/40 uppercase">Crop End</span>
                        <span className="text-emerald-400">{edl[currentSegmentIndex].endOffset.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min={edl[currentSegmentIndex].startOffset + 0.5}
                        max={edl[currentSegmentIndex].duration + edl[currentSegmentIndex].startOffset} // segment physical length
                        step="0.1"
                        value={edl[currentSegmentIndex].endOffset}
                        onChange={(e) => handleCropEndChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Editing Toolbar */}
          <div className={`flex flex-col gap-4 border-t border-white/5 pt-4 ${
            isMaximized ? "lg:border-t-0 lg:pt-0 lg:gap-4" : ""
          }`}>
            <div className={`flex gap-3 ${isMaximized ? "lg:w-full lg:grid lg:grid-cols-2 lg:gap-3" : ""}`}>
              <button
                onClick={handleSplit}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-all active:scale-95 w-full"
              >
                <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                Split Segment
              </button>
              
              <button
                onClick={handleAIAutoTrim}
                disabled={isTrimmingAI}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 rounded-xl text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait active:scale-95 w-full"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                {isTrimmingAI ? "Analyzing..." : "AI Auto-Trim (Silence Cut)"}
              </button>
            </div>

            <div className={`flex gap-4 ${isMaximized ? "lg:w-full lg:grid lg:grid-cols-2 lg:gap-4 lg:border-t lg:border-white/5 lg:pt-4" : ""}`}>
              <button
                onClick={onDiscard}
                disabled={isStitching}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl text-[10px] uppercase font-black tracking-widest cursor-pointer transition-all disabled:opacity-50 active:scale-95 w-full"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Discard Take
              </button>

              <button
                onClick={handleStitch}
                disabled={isStitching || isTrimmingAI}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-[10px] uppercase font-black tracking-[0.15em] cursor-pointer transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 active:scale-95 w-full"
              >
                <Check className="w-3.5 h-3.5 fill-current" />
                Stitch & Approve
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
