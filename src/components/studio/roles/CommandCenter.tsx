'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  Settings, 
  Users, 
  Clapperboard, 
  Video, 
  Mic, 
  Copy, 
  Share2, 
  Sparkles,
  Play,
  Square,
  ChevronRight,
  Monitor,
  Type,
  FastForward,
  Pause,
  Loader2,
  Maximize
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CommandCenter = () => {
  const { actions, isRecording, sessionId, script, mode, isScrolling, scrollSpeed, fontSize } = useStudioState();
  const [activeTab, setActiveTab] = useState<'setup' | 'live' | 'invites'>('setup');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStageStream, setRemoteStageStream] = useState<MediaStream | null>(null);
  const [localScript, setLocalScript] = useState(script);
  const [isConnecting, setIsConnecting] = useState(false);
  const peerRef = React.useRef<any>(null);
  const connRef = React.useRef<any>(null);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);

  // --- GUEST DIRECTOR LOGIC ---
  React.useEffect(() => {
    if (mode === 'guest_director') {
      // 1. Initialize local camera for the Director's PIP face
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          
          // 2. Connect to Host via PeerJS
          import('peerjs').then(({ Peer }) => {
            const peer = new Peer(`${sessionId}-director-${Math.random().toString(36).substr(2, 5)}`, {
              debug: 1,
              config: {
                iceServers: [
                   { urls: 'stun:stun.l.google.com:19302' },
                   { urls: 'stun:global.stun.twilio.com:3478' }
                ]
              }
            });

            peer.on('open', (id: string) => {
              console.log('[GuestDirector] Peer opened. Calling Host...');
              setIsConnecting(true);
              const call = peer.call(`${sessionId}-host`, stream);
              
              call.on('close', () => {
                setIsConnecting(false);
                toast.error("Connection Lost", { description: "Production link to stage was severed." });
              });

              call.on('stream', (stageStream: any) => {
                console.log('[GuestDirector] Received Stage Feed (Monitoring Active)');
                setRemoteStageStream(stageStream);
              });

              // 3. Initiate Data Connection for Remote Control
              const conn = peer.connect(`${sessionId}-host`);
              conn.on('open', () => {
                console.log('[GuestDirector] Data connection opened. Control active.');
                connRef.current = conn;

                // Sync the initial script content to the host immediately
                if (localScript) {
                  console.log('[GuestDirector] Pushing initial script to Stage');
                  conn.send({ type: 'SET_SCRIPT', payload: localScript });
                }
              });
            });

            peerRef.current = peer;
          });
        })
        .catch(err => {
          console.error("[GuestDirector] Camera initialization failed:", err);
          toast.error("Camera Error", { description: "Director PIP feed will be disabled." });
        });

      return () => {
        localStream?.getTracks().forEach(t => t.stop());
        peerRef.current?.destroy();
      };
    }
  }, [mode, sessionId]);

  const sendSyncEvent = (type: string, payload: any) => {
    // 1. Update local state for immediate feedback
    if (type === 'TOGGLE_SCROLL') actions.toggleScrolling();
    if (type === 'SET_SPEED') actions.setScrollSpeed(payload);
    if (type === 'SET_FONT') actions.setFontSize(payload);
    if (type === 'SET_SCRIPT') actions.setScript(payload);

    // 2. Relay to Host if connected
    if (connRef.current && connRef.current.open) {
      console.log(`[GuestDirector] Relaying ${type} to Stage:`, payload);
      connRef.current.send({ type, payload });
    }
  };

  const copyInviteLink = (role: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/cinema?sessionId=${sessionId}&role=${role}`;
    navigator.clipboard.writeText(link);
    toast.success(`${role} link copied!`, {
      description: "Send this to your production partner.",
      icon: <Share2 className="h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
    });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Soundstage Header */}
      <header className="h-20 border-b border-white/5 bg-neutral-950 flex items-center justify-between px-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px bg-primary" />
         </div>
         
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                  <Clapperboard className="h-5 w-5 text-primary" />
               </div>
                <div>
                   <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Collaboration Hub</h1>
                   <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Session: {sessionId}</p>
                </div>
            </div>
            
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            
            <div className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
               <span className="text-[10px] uppercase font-black tracking-widest text-white/60">
                  {isRecording ? 'Live on Set' : 'Standby'}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
               <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                     <div key={i} className="h-6 w-6 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                        <Users className="h-3 w-3 text-white/40" />
                     </div>
                  ))}
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Production Crew: 1</span>
            </div>
            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white transition-colors">
               <Settings className="h-5 w-5" />
            </Button>
         </div>
      </header>

      {/* Soundstage Body */}
      <main className="flex-1 flex overflow-hidden">
         {/* Left Sidebar - Production Controls */}
         <aside className="w-80 border-r border-white/5 bg-neutral-950/50 p-6 flex flex-col gap-8">
            <div className="space-y-4">
               <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60 ml-1">Main Deck</span>
               <nav className="space-y-1">
                  <ProductionNavItem 
                     active={activeTab === 'setup'} 
                     onClick={() => setActiveTab('setup')} 
                     icon={<Settings className="h-4 w-4" />} 
                     label="Setup & Scene" 
                  />
                  <ProductionNavItem 
                     active={activeTab === 'invites'} 
                     onClick={() => setActiveTab('invites')} 
                     icon={<Users className="h-4 w-4" />} 
                     label="Cast & Crew" 
                  />
                  <ProductionNavItem 
                     active={activeTab === 'live'} 
                     onClick={() => setActiveTab('live')} 
                     icon={<Radio className="h-4 w-4" />} 
                     label="Live Monitor" 
                  />
               </nav>
            </div>

            <div className="flex-1" />

            {/* Recording Controls */}
            <div className="p-6 rounded-[24px] bg-gradient-to-br from-neutral-900 to-black border border-white/10 shadow-2xl space-y-6">
               <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`p-4 rounded-full ${isRecording ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'} border border-current shadow-[0_0_30px_rgba(current,0.3)]`}>
                     <Play className={`h-8 w-8 ${isRecording ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest mt-2">{isRecording ? 'Session Active' : 'Start Session'}</span>
               </div>
               
               <Button 
                  onClick={() => actions.toggleRecording()}
                  className={`w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
               >
                  {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isRecording ? 'End Production' : 'Roll Camera'}
               </Button>
            </div>
         </aside>

         {/* Content Area */}
         <section className="flex-1 p-12 overflow-y-auto relative">
            <AnimatePresence mode="wait">
               {activeTab === 'setup' && (
                  <motion.div 
                     key="setup"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="max-w-4xl space-y-12"
                  >
                     <div className="space-y-4">
                        <h2 className="text-4xl font-headline italic tracking-tighter">Scene Configuration</h2>
                        <p className="text-white/40 text-sm max-w-xl leading-relaxed">Adjust your script settings and scene details before you begin recording.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ControlCard 
                           title="Visual Feed" 
                           description="Monitor your on-stage performance."
                           icon={<Monitor className="h-5 w-5 text-primary" />}
                        >
                           <div className="aspect-video rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center group relative overflow-hidden">
                              <video 
                                 ref={localVideoRef}
                                 autoPlay 
                                 playsInline 
                                 muted
                                 className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              {!localStream && (
                                <div className="flex flex-col items-center gap-2 z-10">
                                   <Video className="h-8 w-8 text-white/10" />
                                   <span className="text-[10px] uppercase font-black text-white/20 tracking-widest">Connect Camera</span>
                                 </div>
                              )}
                              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
                                 Director's Monitor
                              </div>
                           </div>
                        </ControlCard>

                        <ControlCard 
                           title="Audio Gain" 
                           description="Broadcast level monitoring."
                           icon={<Mic className="h-5 w-5 text-primary" />}
                        >
                           <div className="h-full flex flex-col justify-center space-y-4 px-4">
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                    animate={{ width: ['20%', '25%', '22%', '30%', '20%'] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="h-full bg-primary" 
                                 />
                              </div>
                              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest text-center">Levels Nominal</span>
                           </div>
                        </ControlCard>

                        <ControlCard 
                           title="Teleprompter Control" 
                           description="Remotely guide the script flow."
                           icon={<Type className="h-5 w-5 text-primary" />}
                        >
                           <div className="space-y-6 h-full flex flex-col justify-center px-2">
                              {/* Play/Pause */}
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Auto-Scroll</span>
                                 <div className="flex items-center gap-3">
                                   <Button 
                                     variant="ghost" 
                                     size="icon" 
                                     onClick={() => sendSyncEvent('TOGGLE_SCROLL', !isScrolling)}
                                     className={`h-10 w-10 rounded-full border border-white/10 ${isScrolling ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-white/40'}`}
                                   >
                                     {isScrolling ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                   </Button>
                                   <Switch 
                                     checked={isScrolling} 
                                     onCheckedChange={(checked) => sendSyncEvent('TOGGLE_SCROLL', checked)} 
                                   />
                                 </div>
                              </div>

                              {/* Scroll Speed */}
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Scroll Speed</span>
                                    <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-white/60">
                                       {scrollSpeed.toFixed(1)}x
                                    </Badge>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <FastForward className="h-3 w-3 text-white/20" />
                                    <Slider 
                                       value={[scrollSpeed]} 
                                       min={0.5} 
                                       max={5} 
                                       step={0.1} 
                                       onValueChange={([val]) => sendSyncEvent('SET_SPEED', val)}
                                       className="flex-1"
                                    />
                                 </div>
                              </div>

                              {/* Font Size */}
                              <div className="space-y-3">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Prompt Zoom</span>
                                 <div className="flex gap-2">
                                    {[32, 48, 64, 80].map((size) => (
                                       <Button
                                          key={size}
                                          variant="ghost"
                                          onClick={() => sendSyncEvent('SET_FONT', size)}
                                          className={`flex-1 h-8 rounded-lg text-[10px] font-black border transition-all ${
                                             fontSize === size 
                                             ? 'bg-primary/20 border-primary/30 text-primary' 
                                             : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                          }`}
                                       >
                                          {size === 32 ? 'S' : size === 48 ? 'M' : size === 64 ? 'L' : 'XL'}
                                       </Button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </ControlCard>
                     </div>

                     <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-headline italic">Director's Script</h3>
                           </div>
                           <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] uppercase font-black">AI Orchestrated</Badge>
                        </div>
                          <textarea 
                             value={localScript}
                             onChange={(e) => {
                                setLocalScript(e.target.value);
                                sendSyncEvent('SET_SCRIPT', e.target.value);
                             }}
                             className="w-full h-40 p-6 rounded-2xl bg-black border border-white/5 text-white/60 text-sm leading-relaxed italic resize-none focus:outline-none focus:border-primary/50 transition-colors"
                             placeholder="Type your script here to project it onto the Stage..."
                          />
                     </div>
                  </motion.div>
               )}

               {activeTab === 'live' && (
                  <motion.div 
                     key="live"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="h-full flex flex-col gap-8"
                  >
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h2 className="text-4xl font-headline italic tracking-tighter">Live Monitor</h2>
                           <p className="text-white/40 text-sm">Direct visual feedback from the Storyteller Stage.</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">Live Link Active</Badge>
                     </div>

                     <div className="flex-1 rounded-[40px] bg-neutral-900 border border-white/10 relative overflow-hidden shadow-2xl group">
                          {remoteStageStream ? (
                           <video 
                              autoPlay 
                              playsInline 
                              ref={(el) => { if (el) el.srcObject = remoteStageStream; }}
                              className="absolute inset-0 w-full h-full object-contain"
                           />
                        ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                              <Loader2 className="h-10 w-10 text-primary animate-spin" />
                              <span className="text-xs font-black uppercase tracking-widest text-white/20">Waiting for Stage Feed...</span>
                           </div>
                        )}
                        
                        {/* Status Overlays */}
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                           <div className="px-3 py-1.5 bg-red-600 rounded-lg flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white">REC</span>
                           </div>
                           <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                              Cam 1: Stage A
                           </div>
                        </div>

                        <div className="absolute bottom-8 right-8 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/10">
                              <Maximize className="h-5 w-5" />
                           </Button>
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'invites' && (
                  <motion.div 
                     key="invites"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="max-w-4xl space-y-12"
                  >
                     <div className="space-y-4">
                        <h2 className="text-4xl font-headline italic tracking-tighter">Production Access</h2>
                        <p className="text-white/40 text-sm max-w-xl leading-relaxed">Invite your partners to join the set. Assign roles to control what they see and hear.</p>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                        <InviteRow 
                           role="Interviewer" 
                           desc="Sees all prompts and controls the flow of conversation." 
                           onCopy={() => copyInviteLink('interviewer')} 
                        />
                        <InviteRow 
                           role="Storyteller" 
                           desc="Sees only the story script and the live feed." 
                           onCopy={() => copyInviteLink('storyteller')} 
                        />
                        <InviteRow 
                           role="Guest" 
                           desc="Viewing only role. Can watch the production live." 
                           onCopy={() => copyInviteLink('guest')} 
                        />
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </section>
      </main>
    </div>
  );
};

function ProductionNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
   return (
      <button 
         onClick={onClick}
         className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
      >
         <div className="flex items-center gap-3">
            {icon}
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
         </div>
         <ChevronRight className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-0'}`} />
      </button>
   );
}

function ControlCard({ title, description, icon, children }: { title: string, description: string, icon: React.ReactNode, children: React.ReactNode }) {
   return (
      <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-4 flex flex-col">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">{icon}</div>
            <div>
               <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
               <p className="text-[10px] text-white/30 font-medium">{description}</p>
            </div>
         </div>
         <div className="flex-1 min-h-[160px]">
            {children}
         </div>
      </div>
   );
}

function InviteRow({ role, desc, onCopy }: { role: string, desc: string, onCopy: () => void }) {
   return (
      <div className="group flex items-center justify-between p-6 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-primary/[0.02] transition-all">
         <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
               <Users className="h-5 w-5 text-white/40 group-hover:text-primary transition-colors" />
            </div>
            <div>
               <h4 className="text-lg font-headline italic tracking-tight">{role} Access</h4>
               <p className="text-[11px] text-white/30 font-medium">{desc}</p>
            </div>
         </div>
         <Button 
            onClick={onCopy}
            variant="ghost" 
            className="rounded-full h-12 w-12 border border-white/5 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"
         >
            <Copy className="h-4 w-4" />
         </Button>
      </div>
   );
}

export default CommandCenter;
