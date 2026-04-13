'use client';

import React, { useState } from 'react';
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
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CommandCenter = () => {
  const { actions, isRecording, sessionId, script, mode } = useStudioState();
  const [activeTab, setActiveTab] = useState<'setup' | 'live' | 'invites'>('setup');

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
                        <p className="text-white/40 text-sm max-w-xl leading-relaxed">Adjust your teleprompter settings and scene details before you begin recording.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ControlCard 
                           title="Visual Feed" 
                           description="Monitor your on-stage performance."
                           icon={<Monitor className="h-5 w-5 text-primary" />}
                        >
                           <div className="aspect-video rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center group overflow-hidden">
                              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex flex-col items-center gap-2">
                                 <Video className="h-8 w-8 text-white/10" />
                                 <span className="text-[10px] uppercase font-black text-white/20 tracking-widest">Connect Camera</span>
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
                     </div>

                     <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-headline italic">Director's Script</h3>
                           </div>
                           <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] uppercase font-black">AI Orchestrated</Badge>
                        </div>
                        <div className="p-6 rounded-2xl bg-black border border-white/5 min-h-[100px] text-white/60 text-sm leading-relaxed italic">
                           {script || "No scene selected. Choose a prompt from the Studio to project onto the Stage."}
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
                           desc="Sees only the teleprompter and the live script." 
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
