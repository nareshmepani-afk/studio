'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Loader2, Wand2, Mic, MicOff, Film, Rocket, CheckCircle2, AlertCircle, Edit3, Save, Minimize2, Maximize2, X } from 'lucide-react';
import { analyzeSentiment, PulseState } from '@/utils/sentimentScore';
import { expandWithAI, polishDescription, generatePosterAesthetics } from '@/actions/aiWeaver';
import { publishMemoryAction, unpublishMemoryAction } from '@/actions/memoryActions';
import { COUNTRIES } from '@/data/countries';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import CinemaPoster from '@/components/memory/CinemaPoster';
import PosterPicker from './PosterPicker';

type MemoryData = any;

interface MemoryFormProps {
    data: MemoryData;
    update: (updatedData: MemoryData) => void;
}

const pulseVariants = {
  neutral: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 4 } },
  calm: { scale: [1, 1.1, 1], filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))', transition: { repeat: Infinity, duration: 6, ease: "easeInOut" as const } },
  intense: { scale: [1, 1.2, 1], filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.8))', transition: { repeat: Infinity, duration: 0.8, ease: "linear" as const } },
};

const pulseColors: Record<PulseState, string> = {
  neutral: 'bg-slate-400/50',
  calm: 'bg-amber-400',
  intense: 'bg-red-500',
};

const EMOTION_TAGS = ['Nostalgic', 'Joyful', 'Adventure', 'Legacy', 'Quiet', 'Triumph', 'Wonder'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MemoryForm({ data, update }: MemoryFormProps) {
  const router = useRouter();
  
  // Basic Fields
  const [title, setTitle] = useState(data?.title || '');
  const [description, setDescription] = useState(data?.description || '');
  const [location, setLocation] = useState(data?.location || '');
  const [country, setCountry] = useState(data?.country || 'none');
  const [tags, setTags] = useState<string[]>(data?.tags || []);
  
  // Date Components
  const [day, setDay] = useState(data?.dateComponents?.day || 'none');
  const [month, setMonth] = useState(data?.dateComponents?.month || 'none');
  const [year, setYear] = useState(data?.dateComponents?.year || 'none');

  // Cinematic / Poster Fields
  const [usePoster, setUsePoster] = useState(data?.usePoster ?? true);
  const [posterStyle, setPosterStyle] = useState<'cinematic' | 'modern' | 'minimalist'>(data?.posterStyle || 'cinematic');
  const [chapterTitle, setChapterTitle] = useState(data?.chapterTitle || '');
  const [director, setDirector] = useState(data?.credits?.director || '');
  const [producer, setProducer] = useState(data?.credits?.producer || '');
  const [starring, setStarring] = useState(data?.credits?.starring || data?.storytellerName || '');
  const [billingLine, setBillingLine] = useState(data?.credits?.billingLine || '');
  const [posterImageUrl, setPosterImageUrl] = useState(data?.posterImageUrl || '');

  // Sensory Fields
  const [sensoryValues, setSensoryValues] = useState<Record<string, string>>(data?.sensory || {});
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Revert/Undo States
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const [prevProse, setPrevProse] = useState<string | null>(null);
  const [isPolishingDesc, setIsPolishingDesc] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [focusedColumn, setFocusedColumn] = useState<'guide' | 'hook' | 'showcase' | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'script' | 'hook'>('script');

  // Derived Classes for Column 2 (Snapshot)
  const isHookFocused = focusedColumn === 'hook';
  
  const col2WrapperClasses = isHookFocused 
    ? "fixed inset-y-[5vh] inset-x-4 lg:inset-x-[10vw] z-[200] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh]" 
    : "w-full xl:w-1/3 z-10";
  
  const col2HeaderClasses = `bg-black/20 p-6 rounded-t-2xl border border-amber-500/20 flex justify-between items-center backdrop-blur-sm ${isHookFocused ? 'pt-8' : ''}`;
  
  const col2BodyClasses = `flex-grow w-full bg-black/20 p-8 rounded-b-2xl border border-t-0 border-amber-500/20 shadow-xl space-y-8 overflow-y-auto ${isHookFocused ? 'min-h-[60vh]' : ''}`;
  
  // Description Analysis (Attention Span Gauge)
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  
  const getGaugeStatus = () => {
    if (wordCount === 0) return { label: 'Empty', color: 'text-white/20', bg: 'bg-white/5', width: 0, hint: 'Start typing or dictate your narrative hook...' };
    if (wordCount < 40) return { label: 'Concentrated', color: 'text-amber-400/40', bg: 'bg-amber-400', width: Math.max(5, (wordCount / 40) * 33), hint: 'A strong opening! Add a bit more for a full theatrical hook.' };
    if (wordCount <= 140) return { label: 'Sweet Spot', color: 'text-emerald-400', bg: 'bg-emerald-400', width: 33 + ((wordCount - 40) / 100) * 34, hint: 'Perfect cinematic length for maximum audience engagement!' };
    if (wordCount <= 180) return { label: 'Expanding', color: 'text-sky-400', bg: 'bg-sky-400', width: 67 + ((wordCount - 140) / 40) * 23, hint: 'Informative, but consider if every word contributes to the hook.' };
    return { label: 'Too Long', color: 'text-rose-500', bg: 'bg-rose-500', width: 100, hint: 'Excessive length may lose readers. Use the Story Script for details.' };
  };
  
  const gauge = getGaugeStatus();

  useEffect(() => {
    if (data?.posterImageUrl && data.posterImageUrl !== posterImageUrl) {
      setPosterImageUrl(data.posterImageUrl);
    }
  }, [data?.posterImageUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        
        recog.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              if (lastFocusedField === 'script' && editor) {
                editor.commands.insertContent(transcript + ' ');
              } else {
                setDescription((prev: string) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript);
              }
            } else {
              interimTranscript += transcript;
            }
          }
        };
        
        recog.onend = () => setIsDictating(false);
        setRecognition(recog);
      }
    }
  }, [lastFocusedField]); // MOD-12: Added dependency on lastFocusedField for contextual dictation

  const toggleDictation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognition) return;
    if (isDictating) {
      recognition.stop();
      setIsDictating(false);
    } else {
      try {
        recognition.start();
        setIsDictating(true);
      } catch (err) {
        console.error("Dictation error:", err);
      }
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev: string[]) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handlePosterAI = async () => {
    setIsGeneratingPoster(true);
    try {
      const result = await generatePosterAesthetics(
        title,
        description,
        editor?.getHTML() || '',
        tags
      );
      
      setChapterTitle(result.chapterTitle);
      setPosterStyle(result.posterStyle);
      setDirector(result.director);
      setProducer(result.producer);
      setStarring(result.starring);
      setBillingLine(result.billingLine);
      
      toast.success("Poster Rejuvenated", {
        description: "AI has polished your theatrical metadata based on the story's soul."
      });
    } catch (error) {
      toast.error("Poster AI Failed", { description: "The theatrical agent is busy. Try again later." });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleSensoryChange = (id: string, value: string) => {
    setSensoryValues((prev: Record<string, string>) => ({ ...prev, [id]: value }));
  };

  const defaultSensoryConfig = [
    { id: 'aroma', label: 'Aroma', placeholder: 'e.g. Pine needles, rain...' },
    { id: 'soundscape', label: 'Soundscape', placeholder: 'e.g. Distant thunder...' },
    { id: 'texture', label: 'Texture', placeholder: 'e.g. Rough bark...' }
  ];
  const sensoryConfigToUse = data?.sensoryConfig?.length > 0 ? data.sensoryConfig : defaultSensoryConfig;
  
  const [pulse, setPulse] = useState<PulseState>('neutral');

  const handlePolishDescription = async () => {
    if (!description) return;
    setIsPolishingDesc(true);
    setPrevDescription(description); // Store original for revert
    try {
       const polished = await polishDescription(description);
       setDescription(polished);
       toast("Applied AI Polish", {
          description: "Grammar and flow improved. You can revert to your original version if preferred.",
          action: { label: "Revert", onClick: () => { setDescription(prevDescription || description); setPrevDescription(null); } }
       });
    } catch (error) {
       console.error("Failed to polish description");
    } finally {
       setIsPolishingDesc(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Weave the narrative of your memory here...',
      }),
    ],
    content: data?.prose || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none max-w-none text-white/90 leading-relaxed min-h-[400px] cursor-text',
      },
    },
    onFocus: () => {
      setLastFocusedField('script');
    },
  });

  useEffect(() => {
    if (!editor) return;
    const content = editor.getText();
    const result = analyzeSentiment(content);
    setPulse(result.state);
  }, [editor?.getText()]);

  // Auto-save effect
  useEffect(() => {
    if (!editor) return;
    const handler = setTimeout(() => {
      // Logic: Only update if something has ACTUALLY changed compared to the incoming data prop
      const hasChanged = 
        title !== (data?.title || '') ||
        description !== (data?.description || '') ||
        location !== (data?.location || '') ||
        country !== (data?.country || 'none') ||
        day !== (data?.dateComponents?.day || 'none') ||
        month !== (data?.dateComponents?.month || 'none') ||
        year !== (data?.dateComponents?.year || 'none') ||
        editor.getHTML() !== (data?.prose || '') ||
        chapterTitle !== (data?.chapterTitle || '') ||
        posterStyle !== (data?.posterStyle || 'cinematic') ||
        director !== (data?.credits?.director || '') ||
        producer !== (data?.credits?.producer || '') ||
        starring !== (data?.credits?.starring || '') ||
        JSON.stringify(aiTakes) !== JSON.stringify(data?.aiTakes || null);

      if (hasChanged) {
        update({
          ...data,
          title,
          description,
          location,
          country,
          tags,
          date: (day !== 'none' && month !== 'none' && year !== 'none') ? `${day}-${month === 'none' ? '' : month}-${year}` : '',
          dateComponents: {
             day: day === 'none' ? '' : day, 
             month: month === 'none' ? '' : month, 
             year: year === 'none' ? '' : year 
          },
          prose: editor.getHTML(),
          sensory: sensoryValues,
          chapterTitle,
          usePoster,
          posterStyle,
          posterImageUrl,
          credits: {
             director,
             producer,
             starring,
             billingLine
          },
          aiTakes,
          status: data?.status || 'draft'
        });
      }
    }, 1000); // Increased debounce to 1s for better performance

    return () => clearTimeout(handler);
  }, [title, description, location, country, tags, day, month, year, sensoryValues, editor?.getHTML(), update, data?.status, chapterTitle, usePoster, posterStyle, director, producer, starring, billingLine, posterImageUrl]);

  const [aiTakes, setAiTakes] = useState<{ poetic?: string, direct?: string, nostalgic?: string } | null>(null);

  const handleAIExpand = async () => {
    if (!editor) return;
    setIsExpanding(true);
    try {
       const { from, to } = editor.state.selection;
       const selectedText = editor.state.doc.textBetween(from, to, ' ');
       const isSelection = selectedText && selectedText.trim().length > 3;
       
       const textToWeave = isSelection ? selectedText : editor.getText();

       const response = await expandWithAI(description, sensoryConfigToUse, sensoryValues, tags, textToWeave, !!isSelection);
       
       if (typeof response === 'string') {
         setAiTakes({ direct: response });
       } else {
         setAiTakes(response as any);
       }
    } catch (e) {
      console.error("AI Weaver Failed", e);
    } finally {
      setIsExpanding(false);
    }
  };

  const handlePublish = async () => {
    if (!data?.id) {
       toast.error("Save Required", { description: "Wait a moment for the initial auto-save to finish." });
       return;
    }
    
    const missingFields = [];
    if (!title?.trim()) missingFields.push("Title");
    if (!description?.trim()) missingFields.push("Description");
    if (year === 'none') missingFields.push("Date (Year required)");
    if (!data?.videoUrl) missingFields.push("Video Recording");

    if (missingFields.length > 0) {
       toast.error("Requirements Missing", { 
         description: `To publish to Cinema, please provide: ${missingFields.join(", ")}.`,
         icon: <AlertCircle className="w-4 h-4 text-white" />,
         className: "text-white"
       });
       return;
    }

    setIsPublishing(true);
    try {
       const res = await publishMemoryAction(data.id);
       if (res.success) {
          toast.success("Success!", { 
            description: "Your memory is now live in the Cinema.",
            icon: <Rocket className="w-4 h-4 text-green-500" />
          });
          update({ ...data, status: 'published' });
          router.push('/cinema');
       } else {
          toast.error("Publish Failed", { description: res.message });
       }
    } catch (e) {
       toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
       setIsPublishing(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!data?.id) return;
    setIsUnpublishing(true);
    try {
      const res = await unpublishMemoryAction(data.id);
      if (res.success) {
        toast.success("Moved to Draft", { 
          description: "This memory has been removed from the Cinema and returned to Studio drafts.",
          icon: <Edit3 className="w-4 h-4 text-amber-500" />
        });
        update({ ...data, status: 'draft' });
      } else {
        toast.error("Failed to unpublish", { description: res.message });
      }
    } catch (e) {
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <LayoutGroup>
    <div className="flex flex-col xl:flex-row gap-8 w-full pb-40 relative">
      
      <AnimatePresence>
        {focusedColumn && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFocusedColumn(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150]"
            />
            
            {/* Zen Overlay Content Registry */}
            {focusedColumn === 'hook' && (
              <motion.div 
                layoutId="theatrical-hook-panel"
                className="fixed inset-y-[5vh] inset-x-4 lg:inset-x-[10vw] z-[200] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh]"
              >
                <div className="bg-black/40 p-8 rounded-t-3xl border border-amber-500/30 flex justify-between items-center backdrop-blur-2xl">
                   <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                     <div>
                       <h2 className="text-3xl font-headline text-white bg-gradient-to-br from-white via-white/95 to-white/40 bg-clip-text text-transparent italic pb-1">Theatrical Hook</h2>
                       <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.4em]">Cinematic Focal Point • Zen Mode</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <button onClick={() => setFocusedColumn(null)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group border border-white/10">
                        <Minimize2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                   </div>
                </div>

                <div className="flex-grow w-full bg-black/60 p-10 rounded-b-3xl border border-t-0 border-amber-500/30 shadow-2xl space-y-8 overflow-y-auto flex flex-col">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Direct Consciousness Entry</label>
                    <div className="flex items-center gap-4">
                      {recognition && (
                        <button onClick={toggleDictation} className={`p-2.5 rounded-xl transition-all duration-300 ${isDictating ? 'text-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-white/20 hover:text-white border border-white/5 hover:bg-white/5'}`}>
                          <Mic className={isDictating ? 'w-5 h-5 animate-pulse' : 'w-5 h-5'} />
                        </button>
                      )}
                      <button onClick={handlePolishDescription} disabled={isPolishingDesc || !description} className="px-6 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-500 hover:text-black transition-all disabled:opacity-20">{isPolishingDesc ? 'Refining...' : 'Draft Polish'}</button>
                    </div>
                  </div>
                  <textarea 
                    value={description} 
                    autoFocus
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Close your eyes. Enter the memory. What is the first thing your audience sees?" 
                    className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-2xl md:text-3xl text-white font-serif transition-all leading-[1.6] resize-none flex-grow placeholder:text-white/5 tracking-tight" 
                  />
                  <div className="pt-8 border-t border-white/5">
                     <div className="flex justify-between items-end mb-4">
                        <div className="flex items-center gap-4">
                           <span className={`text-xs font-black uppercase tracking-[0.4em] ${gauge.color}`}>{gauge.label}</span>
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                           <span className="text-xs font-mono font-bold text-white/40">{wordCount} WORDS</span>
                        </div>
                        <p className="text-xs text-white/40 font-serif italic max-w-md text-right">{gauge.hint}</p>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${gauge.width}%` }} className={`h-full transition-colors duration-1000 ${gauge.bg} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} /></div>
                  </div>
                </div>
              </motion.div>
            )}

            {focusedColumn === 'guide' && (
              <motion.div 
                layoutId="story-guide-panel"
                className="fixed inset-y-[5vh] inset-x-4 lg:inset-x-[10vw] z-[200] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh]"
              >
                <div className="bg-black/40 p-8 rounded-t-3xl border border-sky-500/30 flex justify-between items-center backdrop-blur-2xl">
                   <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
                     <div>
                       <h2 className="text-3xl font-headline text-white bg-gradient-to-br from-white via-white/95 to-white/40 bg-clip-text text-transparent italic pb-1">Story Script</h2>
                       <p className="text-[10px] font-black text-sky-400/60 uppercase tracking-[0.4em]">Narrative Foundation • Edit & Refine</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <button onClick={() => setFocusedColumn(null)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group border border-white/10">
                        <Minimize2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                   </div>
                </div>
                <div className="flex-grow w-full bg-black/60 p-10 rounded-b-3xl border border-t-0 border-sky-500/30 shadow-2xl overflow-y-auto">
                    <div className="max-w-4xl mx-auto prose prose-invert prose-2xl prose-sky">
                       <EditorContent editor={editor} className="h-full w-full" />
                    </div>
                </div>
              </motion.div>
            )}

            {focusedColumn === 'showcase' && (
              <motion.div 
                layoutId="dramatic-showcase-panel"
                className="fixed inset-y-[5vh] inset-x-4 lg:inset-x-[10vw] z-[200] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh]"
              >
                <div className="bg-black/40 p-8 rounded-t-3xl border border-rose-500/30 flex justify-between items-center backdrop-blur-2xl">
                   <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                     <div>
                       <h2 className="text-3xl font-headline text-white bg-gradient-to-br from-white via-white/95 to-white/40 bg-clip-text text-transparent italic pb-1">Dramatic Showcase</h2>
                       <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.4em]">Theatrical Aesthetic • Visualization</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <button onClick={() => setFocusedColumn(null)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group border border-white/10">
                        <Minimize2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                   </div>
                </div>
                <div className="flex-grow w-full bg-black/60 p-10 rounded-b-3xl border border-t-0 border-rose-500/30 shadow-2xl overflow-y-auto flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-8">
                       <div>
                          <label className="block text-xs font-bold text-white/40 uppercase mb-4 tracking-widest text-center">Cinematic Poster</label>
                          <div className="flex justify-center">
                            <div className="w-[300px] shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                              <CinemaPoster memory={{ ...data, title, chapterTitle, usePoster, posterStyle, posterImageUrl, credits: { director, producer, starring, billingLine } }} />
                            </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10">
                       <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
                          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Master Credits</label>
                          <button onClick={handlePosterAI} disabled={isGeneratingPoster} className="text-[10px] font-black text-rose-400 uppercase tracking-wider hover:underline">{isGeneratingPoster ? 'Generating...' : 'Regenerate Credits'}</button>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-1">Director</label>
                            <input type="text" value={director} onChange={(e) => setDirector(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-medium focus:border-rose-500/40 outline-none transition-all" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-1">Producer</label>
                            <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-medium focus:border-rose-500/40 outline-none transition-all" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-1">Starring</label>
                            <input type="text" value={starring} onChange={(e) => setStarring(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-medium focus:border-rose-500/40 outline-none transition-all" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-1">Billing Block</label>
                            <textarea value={billingLine} onChange={(e) => setBillingLine(e.target.value)} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs italic text-white/60 focus:border-rose-500/40 outline-none transition-all resize-none" />
                         </div>
                       </div>
                    </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Column 1: Story Guide (The Narrative Heart) - BLUE THEME */}
      <motion.div 
        layout
        layoutId="story-guide-panel"
        className={`w-full xl:w-1/3 flex flex-col relative drop-shadow-xl transition-opacity duration-1000 ${focusedColumn ? 'opacity-10 scale-95 blur-md grayscale' : 'opacity-100 z-10'}`}
      >
        <div className="bg-black/20 p-6 rounded-t-2xl border border-b-0 border-sky-500/20 flex justify-between items-center backdrop-blur-sm">
             <div className="flex flex-col">
               <h2 className="text-xl font-headline text-white bg-gradient-to-br from-white via-white/95 to-white/40 bg-clip-text text-transparent">Story Script</h2>
               <p className="text-[9px] font-black text-sky-400/40 uppercase tracking-[0.2em] -mt-0.5">Edit and expand your script</p>
             </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 ring-1 ring-white/5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={toggleDictation} 
                        className={`p-2 rounded-lg transition-all ${isDictating && lastFocusedField === 'script' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-white/30 hover:text-sky-400 hover:bg-white/5'}`}
                      >
                         <Mic className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">Dictate to Script</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={handleAIExpand} 
                        disabled={isExpanding}
                        className="p-2 text-white/30 hover:text-sky-400 hover:bg-white/5 rounded-lg transition-all disabled:opacity-20"
                      >
                         {isExpanding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">AI Weaver (Expand)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

             <button onClick={() => setFocusedColumn('guide')} className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-sky-400 transition-all border border-transparent hover:border-sky-500/20">
               <Maximize2 className="w-4 h-4" />
             </button>
             <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-sky-500/20">
               <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Pulse</span>
               <motion.div variants={pulseVariants} animate={pulse} className={`w-2.5 h-2.5 rounded-full ${pulseColors[pulse]}`} />
             </div>
           </div>
        </div>
        <div className="flex-grow w-full bg-black/10 p-8 rounded-b-2xl border border-t-0 border-sky-500/20 shadow-inner min-h-[600px] prose-invert prose-sky opacity-80">
          <EditorContent editor={editor} className="h-full w-full" />
        </div>
      </motion.div>

      {/* Column 2: Identity & Brief (The Snapshot) - AMBER THEME */}
      <motion.div layout layoutId="theatrical-hook-panel" className={`w-full xl:w-1/3 flex flex-col relative drop-shadow-2xl transition-all duration-700 ease-in-out z-10 ${focusedColumn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className={col2HeaderClasses}>
           <div className="flex items-center gap-4">
             <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">Theatrical Hook</h2>
             </div>
           </div>
           {!isHookFocused && (
             <button onClick={() => setFocusedColumn('hook')} className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-amber-400 transition-all border border-transparent hover:border-amber-500/20">
               <Maximize2 className="w-4 h-4" />
             </button>
           )}
        </div>

        <div className={col2BodyClasses.replace('overflow-y-auto', '')}>
          {!isHookFocused && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <div className="w-1.5 h-6 bg-[var(--room-accent)] rounded-full" />
                <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em]">Identity Metadata</h3>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 tracking-wider">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A name for this memory..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--room-accent)] focus:ring-1 focus:ring-[var(--room-accent)] outline-none transition-all text-white font-medium" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 tracking-wider">Date of Memory</label>
                  <div className="flex gap-2">
                    <Select value={day} onValueChange={setDay}>
                      <SelectTrigger className="w-1/3 bg-black/40 border-white/10 text-white rounded-lg p-3 h-auto"><SelectValue placeholder="Day" /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">Day</SelectItem>
                        {Array.from({length: 31}, (_, i) => (i+1).toString()).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="w-1/3 bg-black/40 border-white/10 text-white rounded-lg p-3 h-auto"><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">Month</SelectItem>
                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="w-1/3 bg-black/40 border-white/10 text-white rounded-lg p-3 h-auto"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">Year</SelectItem>
                        {Array.from({length: 100}, (_, i) => (new Date().getFullYear() - i).toString()).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 tracking-wider">Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-white/40 uppercase mb-1.5 tracking-wider">Country</label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="w-full bg-black/40 border-white/10 text-white rounded-lg p-3 h-auto"><SelectValue placeholder="Country" /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">Select...</SelectItem>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!focusedColumn && (
            <motion.div 
              layoutId="theatrical-hook-panel-content"
              initial={false}
              animate={{ 
                borderColor: gauge.color.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : 
                             gauge.color.includes('amber') ? 'rgba(251, 191, 36, 0.2)' : 
                             gauge.color.includes('sky') ? 'rgba(56, 189, 248, 0.2)' : 
                             gauge.color.includes('rose') ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255,255,255,0.05)',
                backgroundColor: gauge.color.includes('emerald') ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.2)'
              }}
              className="p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-1000 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Theatrical Hook</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 ring-1 ring-white/5">
                    {recognition && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={toggleDictation} 
                              className={`p-2 rounded-lg transition-all ${isDictating && lastFocusedField === 'hook' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-white/30 hover:text-amber-400 hover:bg-white/5'}`}
                            >
                               <Mic className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-950 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">Dictate to Hook</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={handlePolishDescription} 
                            disabled={isPolishingDesc || !description}
                            className="p-2 text-white/30 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all disabled:opacity-20"
                          >
                             {isPolishingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">AI Polish (Hook)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <textarea 
                value={description} 
                onFocus={() => { setLastFocusedField('hook'); }} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={8} 
                placeholder="A brief theatrical summary of this memory..." 
                className="w-full bg-black/40 border-0 outline-none focus:outline-none focus:ring-0 rounded-xl p-6 text-[var(--room-accent)]/90 font-serif transition-all leading-relaxed resize-none shadow-inner h-full text-sm" 
              />
              <div className="px-1">
                 <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${gauge.color} transition-colors duration-500`}>{gauge.label}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-mono font-bold text-white/50">{wordCount} <span className="opacity-30">WORDS</span></span>
                       </div>
                       <p className="text-[10px] text-white/30 font-medium italic leading-tight max-w-[320px]">{gauge.hint}</p>
                    </div>
                 </div>
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${gauge.width}%` }} className={`h-full transition-colors duration-500 ${gauge.bg}`} /></div>
              </div>
            </motion.div>
          )}

          {!focusedColumn && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Emotion Signature</label>
              <div className="flex flex-wrap gap-2">
                {EMOTION_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${tags.includes(tag) ? 'bg-[var(--room-accent)]/20 border-[var(--room-accent)] text-[var(--room-accent)]' : 'bg-black/20 border-white/5 text-white/40 hover:text-white/80'}`}>{tag}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Column 3: Dramatic Showcase (Poster & Chapter) - ROSE/GOLD THEME */}
      <motion.div 
        layout
        layoutId="dramatic-showcase-panel"
        className={`w-full xl:w-1/3 flex flex-col relative drop-shadow-xl transition-opacity duration-1000 ${focusedColumn ? 'opacity-20 pointer-events-none scale-95 blur-sm' : 'opacity-100 z-10'}`}
      >
        {/* Theatrical Showcase */}
        <div className="bg-black/20 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                   <h3 className="text-sm font-headline text-white bg-gradient-to-br from-white via-white/95 to-white/40 bg-clip-text text-transparent flex items-center gap-2 cursor-help">
                      <Film className="w-4 h-4 text-rose-400" />
                      Dramatic Showcase
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                    Configure cinematic assets and posters for your memory
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button onClick={() => setFocusedColumn('showcase')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setUsePoster(!usePoster)}
                    className={`relative w-10 h-6 rounded-full transition-all ${usePoster ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${usePoster ? 'left-5' : 'left-1'}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                  {usePoster ? 'Disable Poster' : 'Enable Poster'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {usePoster && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <PosterPicker videoUrl={data?.videoUrl} currentPoster={posterImageUrl} onUpdate={(url) => setPosterImageUrl(url || '')} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">Visual Aesthetic</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cinematic', 'modern', 'minimalist'].map((style) => (
                    <button key={style} onClick={() => setPosterStyle(style as any)} className={`py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${posterStyle === style ? 'bg-[var(--room-accent)] text-slate-950 border-[var(--room-accent)]' : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5'}`}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Billing Block Credits</h4>
                  <button onClick={handlePosterAI} disabled={isGeneratingPoster} className="text-[9px] font-black text-[var(--room-accent)] uppercase tracking-tighter hover:underline opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20 font-bold">
                    {isGeneratingPoster ? 'Auto-filling...' : 'Auto-fill credits'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Director" className="bg-black/50 border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-[var(--room-accent)]/30 outline-none" />
                  <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)} placeholder="Producer" className="bg-black/50 border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-[var(--room-accent)]/30 outline-none" />
                  <input type="text" value={starring} onChange={(e) => setStarring(e.target.value)} placeholder="Starring" className="col-span-2 bg-black/50 border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-[var(--room-accent)]/30 outline-none" />
                  <textarea 
                    value={billingLine} 
                    onChange={(e) => setBillingLine(e.target.value)} 
                    placeholder="A Chronicle Cinema Production..." 
                    rows={2} 
                    className="col-span-2 bg-black/50 border border-white/5 rounded-lg p-2.5 text-[9px] text-white/40 leading-tight italic resize-none focus:border-[var(--room-accent)]/30 outline-none" 
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 pt-6 border-t border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Theatrical Preview</p>
                <div className="w-[160px] transform hover:scale-105 transition-transform duration-500 cursor-zoom-in drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <CinemaPoster memory={{ ...data, title, chapterTitle, usePoster, posterStyle, posterImageUrl, credits: { director, producer, starring, billingLine } }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Floating Bar: Contextual Status & Master Actions */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-slate-950/90 backdrop-blur-2xl border border-white/10 px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5 group">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 uppercase tracking-[0.4em] font-black mb-1">Film Status</span>
          <div className="flex items-center gap-2">
            {data?.status === 'published' ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Cinema Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Draft Edit</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-px h-10 bg-white/10 mx-2" />
        
        {data?.status === 'published' ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePublish} 
              disabled={isPublishing} 
              className="px-8 py-3 bg-[var(--room-accent)] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/btn"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />}
              Update Reel
            </button>
            <button 
              onClick={handleRevertToDraft} 
              disabled={isUnpublishing} 
              className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 border border-white/5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              Retire to Draft
            </button>
          </div>
        ) : (
          <button 
            onClick={handlePublish} 
            disabled={isPublishing} 
            className="px-10 py-4 bg-[var(--room-accent)] text-slate-950 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(var(--room-accent-rgb),0.3)] hover:scale-105 active:scale-95 hover:brightness-110 transition-all flex items-center gap-3 group/btn"
          >
            {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
            Publish to Cinema
          </button>
        )}
      </div>
    </div>
    </LayoutGroup>
  );
}
