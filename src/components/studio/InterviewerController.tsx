'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '@/hooks/useCamera';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { useAuth } from '@/hooks/useAuth';
import { Camera, StopCircle, RefreshCw, UploadCloud, CheckCircle2, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';

export default function InterviewerController({ memoryData, hostId }: { memoryData: any, hostId: string }) {
  const [cameraRequested, setCameraRequested] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  
  // 1. Hardware Initialization
  const { 
    stream, 
    error, 
    switchCamera, 
    hasMultipleCameras, 
    facingMode,
    zoomValue,
    applyZoom,
    capabilities
  } = useCamera({ enabled: cameraRequested });
  
  const zoomSupported = capabilities?.zoom;

  const { 
    startRecording, 
    stopRecording, 
    isRecording, 
    uploading, 
    uploadProgress, 
    uploadVideo,
    recordedBlob
  } = useMediaRecorder(stream);

  // 2. Optical Locking System (Ensures stream is captured instantly on mount)
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  const pipVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  const [uploadComplete, setUploadComplete] = useState(false);

  const proxyUpdate = async (update: any) => {
    try {
      // STANDARD: Every update MUST include hardware parity to prevent status flickering
      const fullStatus = {
        ...update,
        cameraActive: !!stream,
        interviewerConnected: true,
        pulseToken: Math.random()
      };

      await fetch(`/api/interviewer/proxy?hostId=${hostId}&memoryId=${memoryData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullStatus)
      });
    } catch (e) {
      console.error("[Proxy Update Error]:", e);
    }
  };

  // 4. Realtime Polling Heartbeat (The Tether)
  useEffect(() => {
    if (!hostId || !memoryData?.id) return;
    
    // Ensure we send an immediate pulse when state (like stream) changes
    proxyUpdate({ status: isRecording ? 'RECORDING' : 'idle' });

    const interval = setInterval(() => {
       proxyUpdate({});
       console.log("[Studio Link] Heartbeat Sent");
    }, 4000); // 4 second pulse to satisfy the 10 second desktop watchdog

    return () => clearInterval(interval);
  }, [hostId, memoryData?.id, stream, isRecording]);

  const handleStartRecording = async () => {
    if (!hostId) return;
    // Broadcast ON AIR to Desktop
    await proxyUpdate({ status: 'RECORDING' });
    startRecording();
  };

  const handleStopRecording = async () => {
    if (!hostId) return;
    // Broadcast STOPPED to Desktop
    await proxyUpdate({ status: 'STOPPED' });
    stopRecording(); // The resulting blob will automatically populate recordedBlob from the hook
  };

  const handleUpload = async () => {
     if (!recordedBlob || !hostId) return;
     try {
       // Broadcast UPLOADING to Desktop
       await proxyUpdate({ status: 'UPLOADING' });
       
       const url = await uploadVideo(recordedBlob, memoryData.id, hostId);
       if (url) {
          // Broadcast FINISHED to Desktop, providing the secure output URL physically
          await proxyUpdate({ 
              status: 'completed', 
              videoUrl: url 
          });
          setUploadComplete(true);
       }
     } catch (e) {
        console.error("Upload Handshake Failed:", e);
     }
  };

  if (error) return <div className="text-rose-500 p-8 flex items-center justify-center font-mono text-center">Camera Boot Failure: {error}</div>;

  return (
    <div className="w-full h-full relative bg-zinc-950 flex flex-col justify-end pb-12 overflow-hidden">
      
      {/* Viewfinder Engine */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${stream ? 'opacity-100' : 'opacity-20'}`}
      />

      {/* Tactile Lens Zoom Slider (Right Edge) */}
      {stream && facingMode === 'environment' && zoomSupported && (
         <div className="fixed right-6 top-[50%] -translate-y-1/2 z-50 flex flex-col items-center gap-4 h-[250px] group">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl border border-white/20 rounded-full py-6 px-2 shadow-2xl transition-all hover:bg-black/60">
               <Camera className={`w-4 h-4 mb-4 transition-colors ${zoomValue > 1 ? 'text-emerald-400' : 'text-white/40'}`} />
               <div className="relative flex items-center justify-center w-8 h-full py-4">
                  <input 
                     type="range"
                     min={capabilities.zoom.min}
                     max={capabilities.zoom.max}
                     step={0.1}
                     value={zoomValue}
                     onChange={(e) => applyZoom(parseFloat(e.target.value))}
                     className="w-[160px] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer -rotate-90 origin-center accent-emerald-500 hover:accent-emerald-400"
                  />
               </div>
               <span className="text-[10px] font-black font-mono text-emerald-400 mt-4">{zoomValue.toFixed(1)}x</span>
            </div>
            <div className="text-white/40 group-hover:text-white transition-all uppercase font-black text-[7px] tracking-widest text-center leading-tight">
               LENS<br/>ZOOM
            </div>
         </div>
      )}

      {/* Uploading Slate Overlay */}
      {(uploading || uploadComplete) && (
        <div className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
           {uploadComplete ? (
              <>
                 <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-6 drop-shadow-lg" />
                 <h2 className="text-2xl font-bold font-headline text-white mb-2">Memory Wrapped!</h2>
                 <p className="text-sm text-emerald-300">The video has been safely beamed to the Storyteller's local device for final review.</p>
              </>
           ) : (
              <>
                 <UploadCloud className="w-16 h-16 text-[var(--room-accent)] mb-6 animate-pulse drop-shadow-lg" />
                 <h2 className="text-2xl font-bold font-headline text-white mb-2">Securing Artifact...</h2>
                 <div className="w-full max-w-[200px] h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all ease-linear" style={{ width: `${uploadProgress}%` }} />
                 </div>
                 <p className="text-xs text-white/50 font-mono mt-4 uppercase">{uploadProgress.toFixed(0)}% Uploaded</p>
              </>
           )}
        </div>
      )}

      {/* DRAGGABLE TELEPROMPTER OVERLAY */}
      {!uploading && !uploadComplete && (
        <motion.div 
           drag 
           dragConstraints={{ top: 20, left: 10, right: 10, bottom: 500 }}
           dragElastic={0.1}
           initial={{ y: 0 }}
           className="absolute top-16 left-4 right-4 z-40"
        >
           <div className={`bg-black/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden ${isMinimized ? 'p-4' : 'p-8'}`}>
              
              {/* Drag Handle & Controls */}
              <div className="flex flex-col items-center mb-4 gap-2">
                 <div className="w-12 h-1.5 bg-white/10 rounded-full cursor-grab active:cursor-grabbing mb-2">
                    <GripHorizontal className="w-full h-full opacity-0" />
                 </div>
                 
                 <div className="flex justify-between items-center w-full">
                    <h3 className={`font-black uppercase tracking-widest text-[10px] font-mono transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                       {isRecording ? '🔴 Live' : isMinimized ? 'Guide' : 'Teleprompter'}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                       <button 
                          onClick={() => setIsMinimized(!isMinimized)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
                       >
                          {isMinimized ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronUp className="w-4 h-4 text-white" />}
                       </button>

                       {stream && !isRecording && !isMinimized && (
                          <button 
                             onClick={() => setCameraRequested(false)}
                             className="text-[10px] uppercase font-black text-white/40 hover:text-rose-400 transition-all bg-white/5 px-4 py-1.5 rounded-full border border-white/10"
                          >
                             Stop
                          </button>
                       )}
                    </div>
                 </div>
              </div>
              
              <AnimatePresence mode="wait">
                 {!isMinimized && (
                    <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="flex flex-col gap-6"
                    >
                       <h2 className="text-2xl font-black text-white leading-tight font-headline tracking-tighter">{memoryData?.title}</h2>
                       <div className="max-h-[35vh] overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-none touch-pan-y">
                          <p className="text-xl text-white font-black leading-snug">{memoryData?.description}</p>
                          {memoryData?.prose ? (
                             <div 
                                className="text-lg text-white/80 font-bold leading-relaxed border-t border-white/20 pt-6 prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: memoryData.prose }}
                             />
                          ) : (
                             <p className="text-sm text-white/30 italic border-t border-white/20 pt-4 uppercase tracking-widest text-center">
                                No Guide Drafted
                             </p>
                          )}
                       </div>
                    </motion.div>
                 )}
                 {isMinimized && (
                    <motion.div
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="text-xs text-white/50 font-bold truncate pr-8"
                    >
                       {memoryData?.title}
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </motion.div>
      )}

      {/* Initialize / Action UI Area */}
      <div className="relative z-50 flex flex-col items-center px-6 gap-8 w-full mb-12">
         
         {!stream && !recordedBlob && !uploading && (
             <button 
                onClick={() => setCameraRequested(true)}
                className="group flex flex-col items-center gap-4 transition-all duration-300 transform active:scale-95"
             >
                <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_80px_rgba(16,185,129,0.6)] group-hover:scale-110 transition-all duration-500">
                   <Camera className="w-12 h-12 text-zinc-950" />
                </div>
                <span className="text-white font-black tracking-widest uppercase text-xs opacity-70 group-hover:opacity-100">Initialize Camera Feed</span>
             </button>
         )}
         
         <div className="flex items-center justify-center w-full gap-8 text-center min-h-[120px]">
            {stream && (
               <>
                  {/* Auxiliary Controls (Flip Camera) */}
                  {hasMultipleCameras && !isRecording && !recordedBlob && (
                     <button 
                        onClick={switchCamera} 
                        className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-full flex flex-col items-center justify-center text-white hover:bg-emerald-500 transition-all border border-white/20 active:scale-95 shadow-xl"
                        title="Flip Camera"
                     >
                       <RefreshCw className="w-6 h-6" />
                       <span className="text-[10px] font-black mt-1 uppercase">Flip</span>
                     </button>
                  )}

                  {/* The Master Control Shutter */}
                  {!recordedBlob ? (
                      <button 
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`relative flex items-center justify-center transition-all ${isRecording ? 'w-24 h-24' : 'w-28 h-28'}`}
                      >
                         <div className={`absolute inset-0 rounded-full border-4 border-white opacity-80 shadow-2xl ${isRecording ? 'opacity-20 scale-90' : 'opacity-80 scale-100'} transition-all duration-300`} />
                         <div className={`rounded-2xl shadow-2xl transition-all duration-300 ${isRecording ? 'w-10 h-10 bg-red-500 rounded-sm' : 'w-20 h-20 bg-red-500 rounded-full'}`} />
                      </button>
                  ) : (
                      <button 
                         onClick={handleUpload}
                         disabled={uploading}
                         className="px-8 py-6 bg-emerald-500 text-zinc-950 font-black font-mono tracking-tighter uppercase rounded-3xl shadow-[0_15px_35px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all text-sm w-full max-w-[320px] border-b-8 border-emerald-700"
                      >
                         Compile & Upload Memory
                      </button>
                  )}
               </>
            )}
         </div>
      </div>

      {/* Floating Field Monitor (PiP) - As requested in the "Green Box" */}
      {stream && !uploading && !uploadComplete && (
         <div className="fixed bottom-6 right-6 z-30 w-28 h-36 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md bg-black/40 transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom">
            <video 
               ref={pipVideoRef}
               autoPlay 
               playsInline 
               muted 
               className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-60">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[7px] text-white font-black font-mono uppercase tracking-widest">MONITOR</span>
            </div>
         </div>
      )}

    </div>
  );
}
