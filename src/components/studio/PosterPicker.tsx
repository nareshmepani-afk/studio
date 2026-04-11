'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Check, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface PosterPickerProps {
  videoUrl?: string;
  currentPoster?: string;
  onUpdate: (url: string | null) => void;
}

/**
 * PosterPicker Component
 * Professional tool for selecting or capturing a theatrical poster frame.
 */
export default function PosterPicker({ videoUrl, currentPoster, onUpdate }: PosterPickerProps) {
  const [tab, setTab] = useState<'auto' | 'capture' | 'upload'>(currentPoster ? 'upload' : 'auto');
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle Video Metadata
  const onLoadedMetadata = () => {
    if (videoRef.current) {
        setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Only update slider value from video if we aren't actively dragging it
    if (!isDragging) {
      setCurrentTime(e.currentTarget.currentTime);
    }
  };

  // Capture Frame Logic
  const captureFrame = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onUpdate(dataUrl);
        toast.success("Frame Captured", { description: "This frame is now set as your cinematic poster." });
      }
    } catch (e) {
      console.error("Frame capture failed:", e);
      toast.error("Capture Failed", { 
        description: "Could not capture video frame. This usually happens with secure external assets." 
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Invalid File", { description: "Please upload an image for the poster." });
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            onUpdate(event.target.result as string);
            toast.success("Portrait Uploaded!");
        }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
         <button 
           onClick={() => setTab('auto')}
           className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all ${tab === 'auto' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
         >
           Auto
         </button>
         <button 
           onClick={() => setTab('capture')}
           className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all ${tab === 'capture' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
           disabled={!videoUrl}
         >
           Capture
         </button>
         <button 
           onClick={() => setTab('upload')}
           className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all ${tab === 'upload' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
         >
           Upload
         </button>
      </div>

      {/* Content Area */}
      <div className="bg-black/20 rounded-2xl border border-white/5 p-4 overflow-hidden min-h-[140px] flex items-center justify-center">
        {tab === 'auto' && (
           <div className="text-center space-y-2 opacity-50">
              <ImageIcon className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-[10px] uppercase tracking-widest font-bold">Automatic Selection</p>
              <p className="text-[9px] italic max-w-[200px] leading-relaxed mx-auto">The AI Weaver will pick the best available thumbnail or attachment for the poster.</p>
           </div>
        )}

        {tab === 'capture' && videoUrl && (
           <div className="w-full space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl group">
                 <video 
                    ref={videoRef}
                    src={videoUrl}
                    crossOrigin="anonymous"
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full object-contain pointer-events-none"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-white/80">
                        {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </span>
                 </div>
              </div>
              
              <div className="px-2">
                <Slider 
                    value={[currentTime]} 
                    min={0} 
                    max={duration > 0 ? duration : 100} 
                    step={0.1}
                    onValueChange={(val) => {
                       setIsDragging(true);
                       if (videoRef.current && isFinite(val[0])) {
                           try {
                               videoRef.current.currentTime = val[0];
                               setCurrentTime(val[0]);
                           } catch (e) {
                               console.warn("Could not set video time:", e);
                           }
                       }
                    }}
                    onValueCommit={() => {
                       setIsDragging(false);
                    }}
                />
              </div>

              <Button 
                onClick={captureFrame} 
                disabled={isCapturing}
                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold uppercase tracking-widest text-[10px]"
              >
                 {isCapturing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                 {isCapturing ? 'Capturing...' : 'Set Current Frame'}
              </Button>
           </div>
        )}

        {tab === 'upload' && (
            <div className="w-full space-y-4 text-center">
                {!currentPoster || currentPoster.startsWith('http') ? (
                    <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-white/5 hover:border-white/20 rounded-xl cursor-pointer transition-all">
                       <Upload className="w-6 h-6 opacity-30" />
                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Upload Portrait</span>
                       <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload}
                       />
                    </label>
                ) : (
                    <div className="relative group rounded-lg overflow-hidden ring-1 ring-white/10">
                       <img src={currentPoster} className="w-full h-40 object-cover" alt="New Poster" />
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => onUpdate(null)}
                             className="bg-red-500/80 p-2 rounded-full hover:bg-red-500 transition-all shadow-xl"
                          >
                             <Trash2 className="w-4 h-4 text-white" />
                          </button>
                       </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {currentPoster && (
        <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
           <Check className="w-3 h-3 text-emerald-400" />
           <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">Custom Frame Locked</span>
        </div>
      )}
    </div>
  );
}
