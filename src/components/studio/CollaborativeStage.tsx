'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MemoryForm from './MemoryForm';
import { RemoteControlDialog } from './RemoteControlDialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { QrCode, Smartphone, Video, UploadCloud, CheckCircle2, RefreshCw, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

type MemoryData = any;

interface RoomProps {
    data: MemoryData;
    update: (updatedData: MemoryData) => void;
}

export default function CollaborativeStage({ data, update }: RoomProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Real-time synchronization states for Remote Mobile Control
  const [liveStatus, setLiveStatus] = useState<string>('idle');
  const [interviewerConnected, setInterviewerConnected] = useState(data?.interviewerConnected || false);
  const [videoUrl, setVideoUrl] = useState<string | null>(data?.videoUrl || null);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const watchdogTimer = useRef<NodeJS.Timeout | null>(null);

  const resetWatchdog = useCallback(() => {
    setIsOnline(true);
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    watchdogTimer.current = setTimeout(() => {
       setIsOnline(false);
    }, 10000); // 10 second aggressive monitor (2x Pulse)
  }, []);

  // INTELLIGENCE ENGINE: Handle Smart-Close on connection
  const prevConnected = useRef(interviewerConnected);
  
  // 1. Smart Transition Close: Force close upon any concrete hardware signal
  useEffect(() => {
    // Aggressive Auto-Close: 
    // If the mobile starts recording, or we get a solid online heartbeat, clean the dashboard
    if (liveStatus === 'RECORDING' || (isOnline && interviewerConnected)) {
       setQrOpen((prev) => {
          if (prev) {
            console.log("[Studio] Hardware Active - Auto-Closing Pairing Overlay.");
            return false;
          }
          return prev;
       });
    }
  }, [interviewerConnected, isOnline, liveStatus]);

  useEffect(() => {
    return () => {
       if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid, 'memories', data.id), (docS) => {
       if (docS.exists()) {
           const d = docS.data();
           
           // console.log(`[CollaborativeStage] Pulse Received: Status=${d.status}, Connected=${d.interviewerConnected}`);
           
           setInterviewerConnected(!!d.interviewerConnected);
           setLiveStatus(d.status || 'idle');
           setCameraActive(!!d.cameraActive);
           setVideoUrl(d.videoUrl || null);
           
           if (d.pulseToken) {
              resetWatchdog();
           }
       }
    });
    return () => unsub();
  }, [user?.uid, data?.id, resetWatchdog]); // Updated deps

  // SNAPSHOT: Capture current frame as theatrical poster
  const handleCaptureThumbnail = async () => {
    if (!videoRef.current || !data?.id) return;
    
    setIsCapturingThumbnail(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
         if (blob) {
            // Send to the same backend proxy as recording uploads
            const response = await fetch(`/api/interviewer/upload?hostId=${user?.uid}&memoryId=${data.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'image/webp' },
              body: blob
            });
            
            if (response.ok) {
               const { url } = await response.json();
               update({ ...data, posterImageUrl: url });
               toast.success("Poster Updated", { 
                 description: "Theatrical frame captured successfully.",
                 icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
               });
            }
         }
      }
    } catch (e) {
      console.error("Snapshot capture failed:", e);
      toast.error("Capture Failed");
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  // UPLOAD: Direct file upload for posters
  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data?.id) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Invalid File", { description: "Please upload an image for the poster." });
        return;
    }

    setIsUploadingPoster(true);
    try {
        const response = await fetch(`/api/interviewer/upload?hostId=${user?.uid}&memoryId=${data.id}`, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file
        });
        
        if (response.ok) {
           const { url } = await response.json();
           update({ ...data, posterImageUrl: url });
           toast.success("Portrait Uploaded!", {
             description: "Your custom image is now the cinematic poster.",
             icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
           });
        }
    } catch (e) {
        console.error("Poster upload failed:", e);
        toast.error("Upload Failed");
    } finally {
        setIsUploadingPoster(false);
    }
  };

  // Derived styling for the command bar
  const statusColor = liveStatus === 'RECORDING' ? 'bg-red-500 border-red-400 text-white shadow-lg animate-pulse' :
                     liveStatus === 'UPLOADING' ? 'bg-blue-600/20 border-blue-500/40 text-blue-200' :
                     (isOnline && cameraActive) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                     isOnline ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                     interviewerConnected ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-slate-900/50 border-white/10 text-white/40';

  const statusLabel = liveStatus === 'RECORDING' ? '🔴 LIVE ON AIR' : 
                      liveStatus === 'UPLOADING' ? 'Securing Video...' :
                      liveStatus === 'completed' ? 'Memory Secured (Ready to Retake)' :
                      (isOnline && cameraActive) ? 'Mobile Camera Connected' : 
                      isOnline ? 'Mobile Ready (Standby)' :
                      interviewerConnected ? 'Mobile Offline (Tether Lost)' : 'Remote Interviewer';

  // SIGNAL SHIELD: Ensure that every save from the dashboard PRESERVES the latest mobile status
  const shieldedUpdate = useCallback((updatedData: MemoryData) => {
    update({
        ...updatedData,
        interviewerConnected,
        cameraActive,
        status: liveStatus
    });
  }, [update, interviewerConnected, cameraActive, liveStatus]);

  return (
    <div className={`flex flex-col gap-8 w-full h-full pb-10 transition-all duration-500 rounded-3xl ${liveStatus === 'RECORDING' ? 'border-[8px] border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.5)]' : ''}`}>
      
      {/* 1. Final Render Preview Mode */}
      {videoUrl ? (
         <div className="w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-xl flex flex-col items-center relative">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-6">Memory Completed</h2>
            
            <video 
              ref={videoRef}
              src={videoUrl} 
              controls 
              playsInline 
              crossOrigin="anonymous"
              className="w-full max-w-2xl rounded-xl shadow-2xl mb-8" 
            />
            
            <div className="flex flex-wrap items-center justify-center gap-4">
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <button className="px-6 py-3 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg flex items-center gap-2 group">
                      <Video className="w-5 h-5 group-hover:animate-pulse" />
                      Delete & Retake Video
                    </button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                   <AlertDialogHeader>
                     <AlertDialogTitle className="text-xl font-bold font-headline">Delete Recorded Memory?</AlertDialogTitle>
                     <AlertDialogDescription className="text-white/60">
                       Are you sure you want to delete this recorded memory? This action cannot be reversed and your video will be permanently erased.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="mt-4">
                     <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">Keep Recording</AlertDialogCancel>
                     <AlertDialogAction 
                       onClick={() => shieldedUpdate({ ...data, videoUrl: null, status: 'idle' })}
                       className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                     >
                       Yes, Delete Forever
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>

               {/* Parity Actions: Poster Management */}
               <button 
                 onClick={handleCaptureThumbnail}
                 disabled={isCapturingThumbnail || isUploadingPoster}
                 className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                 title="Capture Frame"
               >
                 {isCapturingThumbnail ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                 ) : (
                    <Camera className="w-4 h-4 text-emerald-400" />
                 )}
                 {data?.posterImageUrl ? "Update Poster" : "Set as Poster"}
               </button>

               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploadingPoster || isCapturingThumbnail}
                 className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                 title="Upload Portrait"
               >
                 {isUploadingPoster ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                 ) : (
                    <UploadCloud className="w-4 h-4 text-sky-400" />
                 )}
                 Upload
               </button>
               <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleUploadPoster}
                  accept="image/*"
                  className="hidden"
               />

               <button 
                  onClick={() => setQrOpen(true)}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all shadow-lg flex items-center gap-2"
               >
                  <QrCode className="w-4 h-4" />
                  Connect New Device
               </button>
            </div>
         </div>
      ) : (
         <>
            {/* 2. Unified Remote Command Center */}
            <div className="w-full flex flex-col gap-4 mb-2">
                <div className={`w-full rounded-2xl p-4 flex flex-col items-center justify-between gap-6 backdrop-blur-md transition-all duration-500 border ${statusColor}`}>
                  
                  <div className="w-full flex flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className={`p-3 rounded-full transition-colors ${
                        (isOnline && cameraActive) ? 'bg-emerald-500/20' : 
                        isOnline ? 'bg-amber-500/20' : 
                        interviewerConnected ? 'bg-rose-500/20' : 'bg-white/5'
                      }`}>
                        <Smartphone className={`w-5 h-5 ${
                          (isOnline && cameraActive) ? 'text-emerald-400' : 
                          isOnline ? 'text-amber-500 animate-pulse' : 
                          interviewerConnected ? 'text-rose-400' : 'text-white/40'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {interviewerConnected && (
                            <div className={`w-2 h-2 rounded-full ${
                                liveStatus === 'RECORDING' ? 'bg-white font-black' : 
                                (isOnline && cameraActive) ? 'bg-emerald-400 animate-pulse' : 
                                isOnline ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                          )}
                          <h2 className="font-black uppercase tracking-widest text-[11px]">
                            {statusLabel}
                          </h2>
                        </div>
                        <p className="text-[10px] opacity-40 uppercase font-black tracking-tight mt-0.5">
                          { (isOnline && cameraActive) ? 'Hardware synchronized' : 
                            isOnline ? 'Camera is on standby' : 
                            interviewerConnected ? 'App closed or phone asleep' : 'Pair phone as remote prompter' }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {interviewerConnected && (
                        <button 
                          disabled={isResetting}
                          onClick={async () => {
                            if (user?.uid && data?.id) {
                                setIsResetting(true);
                                await updateDoc(doc(db, 'users', user.uid, 'memories', data.id), { 
                                  interviewerConnected: false, 
                                  status: 'idle' 
                                });
                                setIsResetting(false);
                            }
                          }}
                          className="px-4 py-2 bg-slate-900/50 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-tighter flex items-center gap-2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                          {isResetting ? "Resetting..." : "Reset"}
                        </button>
                      )}

                      <button 
                        onClick={() => setQrOpen(!qrOpen)}
                        className={`px-5 py-2.5 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-lg ${
                            qrOpen
                            ? 'bg-rose-500 text-white border border-rose-500'
                            : interviewerConnected 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white' 
                              : 'bg-[#ff7a2d] text-slate-900 hover:scale-105 active:scale-95'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        {qrOpen ? "Hide QR" : interviewerConnected ? "New Device" : "Connect Camera"}
                      </button>
                    </div>
                  </div>
                </div>
            </div>

            {/* The Central Engine: The Memory Collaboration Script */}
            <MemoryForm data={data} update={shieldedUpdate} />
         </>
      )}

      {/* Trigger Dialog for the QR Code */}
      <RemoteControlDialog 
        open={qrOpen} 
        onClose={() => setQrOpen(false)} 
        sessionId={data?.id || 'staging-session'} 
      />
    </div>
  );
}
