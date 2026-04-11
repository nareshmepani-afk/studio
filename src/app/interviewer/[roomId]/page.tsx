'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { signInWithCustomToken } from 'firebase/auth';
import InterviewerController from '@/components/studio/InterviewerController';

import { X } from 'lucide-react';

function InterviewerMobileEngine() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const hostId = searchParams.get('hostId');
  
  const [memoryData, setMemoryData] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  // 1. Initial Handshake & Hydration (PROXY BASED)
  useEffect(() => {
    if (!hostId || !roomId) return;
    
    const connectToRemoteSuite = async () => {
      try {
        console.log(`[Handshake Proxy] Reaching host...`);
        const response = await fetch(`/api/interviewer/proxy?hostId=${hostId}&memoryId=${roomId}`);
        const data = await response.json();
        
        if (data.id) {
           setMemoryData(data);
           
           // Signal connection to host via the proxy as well
           await fetch(`/api/interviewer/proxy?hostId=${hostId}&memoryId=${roomId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ interviewerConnected: true })
           }).catch(e => console.warn('Signal notify failed', e));

        } else {
           console.error("Room Not Found in Database via Proxy!");
        }
      } catch (error) {
        console.error("Proxy Handshake Failed:", error);
      } finally {
        setInitializing(false);
      }
    };

    connectToRemoteSuite();
  }, [roomId, hostId]);

  const handleEndSession = async () => {
    try {
      // 1. Force the desktop to reset state instantly
      await fetch(`/api/interviewer/proxy?hostId=${hostId}&memoryId=${roomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewerConnected: false, cameraActive: false, status: 'idle' })
      });
    } catch (e) {
      console.warn('Disconnect signal failed', e);
    }
    
    // 2. Safely unmount and route to landing page
    window.location.href = '/';
  };

  if (initializing) return <div className="w-full h-screen bg-black text-emerald-500/50 flex items-center justify-center font-mono animate-pulse">Initializing Proxy Handshake...</div>;
  if (!hostId) return <div className="w-full h-screen bg-black text-rose-400 p-8 flex items-center justify-center text-center">Invalid Link. Missing Host Identifier.</div>;
  if (!memoryData) return <div className="w-full h-screen bg-black text-amber-400 p-8 flex items-center justify-center text-center">Sync Error. Please scan a fresh QR code from your Studio.</div>;

  return (
    <div className="w-full h-[100dvh] bg-black text-white overflow-hidden flex flex-col relative select-none">
      {/* Absolute top safe-area banner */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-[100] bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Studio Linked</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50 truncate max-w-[120px]">{memoryData?.title?.substring(0,25) || 'Syncing...'}</span>
          <button 
             onClick={handleEndSession}
             className="bg-white/10 hover:bg-rose-500 hover:border-rose-500 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-95 border border-white/20"
             title="End Session"
          >
             <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Central Media Controller */}
      <div className="flex-1 w-full h-full">
         <InterviewerController memoryData={memoryData} hostId={hostId} />
      </div>
    </div>
  );
}

export default function MobileInterviewerPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-black text-white flex items-center justify-center">Loading Storyteller Experience...</div>}>
      <InterviewerMobileEngine />
    </Suspense>
  );
}
