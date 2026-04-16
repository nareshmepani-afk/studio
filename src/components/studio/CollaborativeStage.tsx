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
import { useStudioState } from '@/hooks/studio/useStudioState';

type MemoryData = any;

interface RoomProps {
    data: MemoryData;
    update: (updatedData: MemoryData) => void;
    mode?: 'standard' | 'guest';
}

export default function CollaborativeStage({ data, update, mode = 'standard' }: RoomProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { actions } = useStudioState();
  
  // Real-time synchronization states for Remote Mobile Control
  const [liveStatus, setLiveStatus] = useState<string>('idle');
  const [interviewerConnected, setInterviewerConnected] = useState(data?.interviewerConnected || false);
  const [videoUrl, setVideoUrl] = useState<string | null>(data?.videoUrl || null);
  const [isResetting, setIsResetting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [remoteDirectorStream, setRemoteDirectorStream] = useState<MediaStream | null>(null);
  const [isDirectorConnecting, setIsDirectorConnecting] = useState(false);
  const watchdogTimer = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<any>(null);
  const remoteDirectorVideoRef = useRef<HTMLVideoElement>(null);

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
    // GUEST BYPASS: If we are in guest mode, don't try to sync with a specific user's memory.
    if (!user?.uid || mode === 'guest') return;

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

  // --- GUEST DIRECTOR / REVERSE TETHER LOGIC ---
  useEffect(() => {
    let isMounted = true;
    let localMediaStream: MediaStream | null = null;

    if (mode === 'guest') {
      // 1. Initialize local camera for the storyteller
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          localMediaStream = stream;
          setLocalStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("[GuestDirector] Failed to get local stream:", err);
          toast.error("Camera Failed", { description: "Remote Director won't be able to see you." });
        });

      // 2. Setup PeerJS for the remote director's face
      import('peerjs').then(({ Peer }) => {
        const initializePeer = () => {
          if (!isMounted) return;
          
          if (peerRef.current) {
            peerRef.current.destroy();
          }

          const peer = new Peer(`${data.id}-host`, {
             debug: 1,
             config: {
               iceServers: [
                 { urls: 'stun:stun.l.google.com:19302' },
                 { urls: 'stun:global.stun.twilio.com:3478' }
               ]
             }
          });

          peer.on('open', (id: string) => {
            if (!isMounted) { peer.destroy(); return; }
            console.log('[GuestDirector] PeerID opened for Host:', id);
            setPeerId(id);
          });

          peer.on('error', (err: any) => {
             console.error('[GuestDirector] PeerJS Error:', err);
             // If React strict mode unmounted and hasn't cleared the socket yet on the stun server:
             if (err.type === 'unavailable-id') {
                 console.warn("[GuestDirector] ID Taken (likely strict mode). Retrying in 1.5s...");
                 setTimeout(() => {
                    peer.destroy();
                    if (isMounted) initializePeer();
                 }, 1500);
             }
          });

          peer.on('call', (call: any) => {
            console.log('[GuestDirector] Incoming video call from Director');
            setIsDirectorConnecting(true);
            call.answer(); // Answer with no stream back (or send localStream if we want)
            call.on('stream', (remoteStream: MediaStream) => {
              if (!isMounted) return;
              setRemoteDirectorStream(remoteStream);
              setIsDirectorConnecting(false);
              if (remoteDirectorVideoRef.current) {
                remoteDirectorVideoRef.current.srcObject = remoteStream;
              }
            });
          });
          
          peer.on('connection', (conn: any) => {
            console.log('[GuestDirector] Data connection established with Director');
            conn.on('data', (payloadData: any) => {
              if (!isMounted) return;
              console.log('[GuestDirector] Command Received:', payloadData);
              if (payloadData.type === 'TOGGLE_SCROLL') actions.toggleScrolling();
              if (payloadData.type === 'SET_SPEED') actions.setScrollSpeed(payloadData.payload);
              if (payloadData.type === 'SET_FONT') actions.setFontSize(payloadData.payload);
              if (payloadData.type === 'SET_SCRIPT') actions.setScript(payloadData.payload);
            });
          });

          peerRef.current = peer;
        };

        initializePeer();
      });
    }

    return () => {
      isMounted = false;
      if (localMediaStream) {
         localMediaStream.getTracks().forEach(t => t.stop());
      }
      if (peerRef.current) {
         peerRef.current.destroy();
         peerRef.current = null;
      }
    };
  }, [mode, data.id, actions]);

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
      
      {/* 1. Guest Director / Storyteller Stage Mode */}
      {mode === 'guest' && !videoUrl && (
        <div className="w-full relative bg-black border border-white/20 rounded-3xl overflow-hidden min-h-[600px] shadow-2xl group/stage">
          {/* Main Stage Feed (Local Camera) */}
          <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted
             className="absolute inset-0 w-full h-full object-cover z-0 grayscale-[0.2] contrast-[1.1]"
          />

          {/* Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10 pointer-events-none" />
          
          {/* Remote Director Monitor (PIP) */}
          <div className="absolute top-6 right-6 z-40 w-64 aspect-video rounded-2xl border-2 border-white/20 bg-slate-900 shadow-2xl overflow-hidden backdrop-blur-xl group-hover/stage:scale-105 transition-transform duration-500">
             <video 
               ref={remoteDirectorVideoRef}
               autoPlay 
               playsInline 
               className="w-full h-full object-cover"
             />
             {!remoteDirectorStream && (
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-md">
                 <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                 <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Waiting for Director</span>
               </div>
             )}
             <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-rose-500/80 rounded-md text-[8px] font-black text-white uppercase tracking-tighter shadow-lg">
                Guest Director
             </div>
          </div>

          {/* Recording & Action Controls Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none">
             <div className="flex justify-between items-start w-full">
                <div className="px-4 py-2 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${liveStatus === 'RECORDING' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
                   <span className="text-xs font-black uppercase tracking-widest text-white/90">
                     {liveStatus === 'RECORDING' ? 'LIVE ON AIR' : 'Ready for Direction'}
                   </span>
                </div>
             </div>

             <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto mb-4 pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-full text-center shadow-2xl">
                   <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Live Script Focus</h3>
                   <p className="text-2xl font-bold text-white font-headline leading-tight italic">
                     {data.description || "The Director is preparing your next scene..."}
                   </p>
                </div>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                   Your remote director has control of the camera
                </p>
             </div>
          </div>
        </div>
      )}

      {/* 2. Standard Final Render Preview Mode (After completion) */}
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
