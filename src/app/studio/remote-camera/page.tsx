'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, RefreshCw, Radio, Link as LinkIcon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Peer } from 'peerjs';

function RemoteCameraComponent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams ? searchParams.get('sessionId') : null;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'idle' | 'camera_active' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<any>(null);

  // 1. Initialise mobile camera feed automatically
  const startCamera = async () => {
    try {
      setConnectionState('idle');
      setErrorMsg(null);

      // Stop any existing tracks first to release lock
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      console.log(`[RemoteCamera] Accessing camera facingMode: ${facingMode}...`);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setConnectionState('camera_active');
    } catch (err: any) {
      console.error('[RemoteCamera] getUserMedia failed:', err);
      setErrorMsg('Webcam or Microphone permission was denied or not found.');
      setConnectionState('error');
    }
  };

  // Re-start camera when facingMode changes
  useEffect(() => {
    startCamera();
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const switchCamera = () => {
    console.log('[RemoteCamera] Flipping camera lens orientation...');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // 2. Link with Desktop Host PeerJS when camera is active and sessionId is present
  useEffect(() => {
    if (!sessionId || !stream) return;

    let isMounted = true;

    // Handle stream switching/flipping for active calls
    if (callRef.current) {
      console.log('[RemoteCamera] Stream swapped. Re-initiating MediaCall with new camera stream...');
      callRef.current.close();
      if (peerRef.current && peerRef.current.open) {
        const call = peerRef.current.call(sessionId, stream);
        callRef.current = call;
        call.on('close', () => {
          if (isMounted) {
            setConnectionState('camera_active');
          }
        });
        return;
      }
    }

    setConnectionState('connecting');

    console.log('[RemoteCamera] Statically initializing Peer client for calling host:', sessionId);
    const peer = new Peer({
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      if (!isMounted) { peer.destroy(); return; }
      console.log('[RemoteCamera] Phone Peer opened successfully with ID:', id, 'Calling host:', sessionId);

      // Initiate P2P Data Connection to Host to authorise desktop
      try {
        console.log('[RemoteCamera] Establishing P2P data connection with host...');
        peer.connect(sessionId);
      } catch (e) {
        console.warn('[RemoteCamera] Failed to connect data channel:', e);
      }

      // Initiate WebRTC Media Call to Desktop Host
      try {
        console.log('[RemoteCamera] Establishing WebRTC media stream call...');
        const call = peer.call(sessionId, stream);
        callRef.current = call;

        call.on('close', () => {
          if (isMounted) {
            setConnectionState('camera_active');
            console.log('[RemoteCamera] P2P call closed. Reverting to standby...');
          }
        });
      } catch (e) {
        console.error('[RemoteCamera] Media call setup failed:', e);
      }

      setConnectionState('connected');
    });

    peer.on('error', (err) => {
      console.error('[RemoteCamera] PeerJS Error:', err);
      if (isMounted) {
        setErrorMsg(`Failed to establish P2P connection to desktop: ${err.message || err.type || err}`);
        setConnectionState('error');
      }
    });

    peerRef.current = peer;

    return () => {
      isMounted = false;
      if (callRef.current) {
        callRef.current.close();
        callRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [sessionId, stream]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Camera Viewfinder (Absolute Background) */}
      <div className="absolute inset-0 w-full h-full z-0 bg-black">
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              facingMode === 'user' ? "transform scale-x-[-1]" : ""
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
      </div>

      {/* 2. Top Bar Status Panel */}
      <div className="relative z-20 w-full p-6 flex items-center justify-between backdrop-blur-md border-b border-white/5 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-md",
            connectionState === 'connected' ? "bg-emerald-500 animate-pulse shadow-emerald-500/50" :
            connectionState === 'connecting' ? "bg-amber-500 animate-pulse shadow-amber-500/50" :
            connectionState === 'error' ? "bg-rose-500 shadow-rose-500/50" : "bg-white/20"
          )} />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase font-black">
            {connectionState === 'connected' ? `Wireless Lens (${facingMode === 'user' ? 'Selfie' : 'Premium'}) Live` :
             connectionState === 'connecting' ? 'Linking P2P Channel...' :
             connectionState === 'camera_active' ? 'Standby // Awaiting Host' :
             connectionState === 'error' ? 'Optics Bridge Interrupted' : 'Initializing Optics...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* PREMIUM Flip Camera Button */}
          <button
            onClick={switchCamera}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full transition-all active:scale-90 cursor-pointer flex items-center justify-center"
            title="Flip Camera Lens"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {connectionState === 'connected' && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* 3. Center Screen Status Overlays (Lobby, errors, or linking state) */}
      <div className="relative z-20 flex-grow flex items-center justify-center p-6 text-center pointer-events-none">
        {connectionState === 'error' && (
          <div className="max-w-xs p-6 rounded-[2rem] bg-slate-950/80 border border-rose-500/20 backdrop-blur-2xl pointer-events-auto flex flex-col items-center shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Optics Error</h4>
            <p className="text-[10px] text-white/50 leading-relaxed mb-4">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              Re-initialize
            </button>
          </div>
        )}

        {connectionState === 'connecting' && (
          <div className="p-6 rounded-[2rem] bg-slate-950/60 border border-white/5 backdrop-blur-2xl flex flex-col items-center shadow-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <LinkIcon className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-1">Linking Feeds</h4>
            <p className="text-[9px] text-white/40 tracking-wider uppercase">P2P handshake in progress...</p>
          </div>
        )}
      </div>

      {/* 4. Bottom Directive HUD */}
      <div className="relative z-20 w-full p-8 backdrop-blur-2xl border-t border-white/5 bg-slate-950/70 shrink-0 flex flex-col gap-4 text-center">
        {connectionState === 'connected' ? (
          <>
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">Linked successfully</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed px-4">
              Place your phone at eye-level or next to your prompter screen. Stand by while the director triggers takes from the desktop.
            </p>
          </>
        ) : (
          <p className="text-[10px] text-white/40 leading-relaxed px-4 italic">
            Awaiting local desktop calibration. Link with desktop peer sessionId to begin.
          </p>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RemoteCameraComponent), { ssr: false });
