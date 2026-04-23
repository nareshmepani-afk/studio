import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  PenTool, Mic, Sparkles, MapPin, Calendar, Tag, ArrowRight, ArrowLeft, 
  Save, Rocket, AlertCircle, Loader2, Edit3, ChevronRight, Maximize2, 
  Trash2, Plus, Info, Layout, Layers, Wand2, Music, Wind, Coffee,
  FileText, Film, Image as ImageIcon, Video, Heart, Share2, MoreHorizontal
} from 'lucide-react';
import { Memory, SensoryPromptTemplate, ActionResponse } from '@/types';
import { useDictionary } from '@/hooks/use-dictionary';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CinemaPoster } from '@/components/memory/CinemaPoster';
import { analyzeSentiment, PulseState } from '@/utils/sentimentScore';
import { polishDescription, expandWithAI } from '@/actions/aiWeaver';
import { publishMemoryAction, unpublishMemoryAction } from '@/actions/memoryActions';

interface MemoryFormProps {
  data: Partial<Memory>;
  update: (data: Partial<Memory>) => void;
  productionStage?: number;
  setProductionStage?: (stage: number) => void;
  modality?: 'pen' | 'voice' | null;
  setModality?: (val: 'pen' | 'voice' | null) => void;
  forceAct?: string;
  onWordCountChange?: (count: number) => void;
}

export function MemoryForm({ 
  data, 
  update,
  productionStage = 0,
  setProductionStage,
  modality: propModality,
  setModality: propSetModality,
  forceAct,
  onWordCountChange
}: MemoryFormProps) {
  const router = useRouter();
  
  // Lifted state management: use props if provided, otherwise local state
  const [internalModality, setInternalModality] = useState<'pen' | 'voice' | null>(data?.modality || null);
  const modality = propModality !== undefined ? propModality : internalModality;
  const setModality = propSetModality || setInternalModality;
  const [title, setTitle] = useState(data?.title || '');
  const [description, setDescription] = useState(data?.description || '');
  const [location, setLocation] = useState(data?.location || '');
  const [country, setCountry] = useState(data?.country || 'none');
  const [tags, setTags] = useState<string[]>(data?.tags || []);
  const [day, setDay] = useState(data?.dateComponents?.day || 'none');
  const [month, setMonth] = useState(data?.dateComponents?.month || 'none');
  const [year, setYear] = useState(data?.dateComponents?.year || 'none');
  const [isDictating, setIsDictating] = useState(false);
  const [isPolishingDesc, setIsPolishingDesc] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'title' | 'description' | 'script' | 'metadata' | null>(null);
  
  // Poster State
  const [usePoster, setUsePoster] = useState(data?.usePoster ?? true);
  const [posterStyle, setPosterStyle] = useState(data?.posterStyle || 'cinematic');
  const [chapterTitle, setChapterTitle] = useState(data?.chapterTitle || '');
  const [director, setDirector] = useState(data?.credits?.director || '');
  const [producer, setProducer] = useState(data?.credits?.producer || '');
  const [starring, setStarring] = useState(data?.credits?.starring || '');
  const [billingLine, setBillingLine] = useState(data?.credits?.billingLine || 'A Chronicle Cinema Production');
  const [posterImageUrl, setPosterImageUrl] = useState(data?.posterImageUrl || '');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // Sensory State
  const [sensoryValues, setSensoryValues] = useState<Record<string, string>>(data?.sensory || {});
  
  // UI States
  const [focusedColumn, setFocusedColumn] = useState<'guide' | 'sensory' | 'poster' | null>(null);
  const [isGuideFullyClosed, setIsGuideFullyClosed] = useState(false);

  const { transcript, isListening, startListening, stopListening, resetTranscript } = useDictionary();

  // Logic: Act-Aware Sidebar Automation (respecting forceAct prop)
  useEffect(() => {
    if (forceAct === 'guide') setFocusedColumn('guide');
    else if (forceAct === 'sensory') setFocusedColumn('sensory');
    else if (forceAct === 'poster') setFocusedColumn('poster');
  }, [forceAct]);

  useEffect(() => {
    if (transcript && isDictating) {
      if (lastFocusedField === 'title') setTitle(transcript);
      else if (lastFocusedField === 'description') setDescription(transcript);
      else if (lastFocusedField === 'script' && editor) {
        editor.commands.setContent(transcript);
      }
    }
  }, [transcript, isDictating, lastFocusedField]);

  const toggleDictation = () => {
    if (isListening) {
      stopListening();
      setIsDictating(false);
    } else {
      resetTranscript();
      startListening();
      setIsDictating(true);
      toast("Sonic Modality Active", {
        description: "Your voice is now the scribe's ink.",
        icon: <Mic className="w-4 h-4 text-amber-500" />
      });
    }
  };

  const handleToggleColumn = (col: 'guide' | 'sensory' | 'poster' | null) => {
    setFocusedColumn(prev => prev === col ? null : col);
    if (col !== null) setIsGuideFullyClosed(false);
  };

  const handleRejuvenatePoster = async () => {
    setIsGeneratingPoster(true);
    try {
      // In a real app, this calls an API to analyze tags/description and pick/generate an image
      // Here we simulate a polish to the metadata
      setChapterTitle(title || "The Unspoken Chapter");
      setBillingLine(`A Chronicle Cinema Production • Filmed on location in ${location || 'the mind'}`);
      
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

  const defaultSensoryConfig: SensoryPromptTemplate[] = [
    { id: 'aroma', label: 'Aroma', placeholder: 'e.g. Pine needles, rain...' },
    { id: 'soundscape', label: 'Soundscape', placeholder: 'e.g. Distant thunder...' },
    { id: 'texture', label: 'Texture', placeholder: 'e.g. Rough bark...' }
  ];
  const sensoryConfigToUse = (data?.sensoryConfig && data.sensoryConfig.length > 0) ? data.sensoryConfig : defaultSensoryConfig;
  
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
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      onWordCountChange?.(words);
    }
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

       const response = await expandWithAI(description, sensoryConfigToUse as any[], sensoryValues, tags, textToWeave, !!isSelection);
       
       const generatedText = typeof response === 'string' ? response : (response.direct || response.poetic || response.nostalgic || '');
       
       if (generatedText) {
         if (isSelection) {
           editor.commands.insertContent(generatedText);
         } else {
           editor.commands.setContent(generatedText);
         }
         toast.success("Script Expanded", { description: "The AI has woven your memory into a cinematic script." });
       }
       setAiTakes(typeof response === 'string' ? { direct: response } : (response as any));
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
    <div className="relative w-full z-10 px-8 pb-24 pt-4">
    <LayoutGroup>
      <div className="w-full relative">
        <AnimatePresence onExitComplete={() => setIsGuideFullyClosed(true)}>
        {focusedColumn && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleToggleColumn(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150]"
            />
            
            {focusedColumn === 'guide' && (
              <motion.div 
                layoutId="story-guide-panel"
                className="fixed inset-y-[5vh] inset-x-4 lg:inset-x-[10vw] z-[200] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh]"
              >
                <div className="flex-1 bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col">
                  {/* Story Guide Header */}
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-headline text-white italic">Narrative Architect</h2>
                        <p className="text-[10px] font-black text-sky-400/60 uppercase tracking-[0.3em]">AI-Driven Story Optimization</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleColumn(null)}
                      className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
                    >
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        </AnimatePresence>

        {/* --- MAIN THEATRICAL STAGES --- */}
        <div className="flex-1 min-w-0 px-4 xl:px-0">
          <AnimatePresence mode="wait">
            {/* ACT 1: THE CORE MEMORY (Title & Visual Hook) */}
            {productionStage === 0 && modality !== null && (
              <motion.div
                key="act-1"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full max-w-4xl mx-auto min-h-[80vh] flex flex-col pt-4 pb-32"
              >
                {/* Pinned Metadata Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                    <div className="w-8 h-px bg-emerald-500/30" />
                    Act I: The Inciting Memory
                  </div>
                </div>

                {/* Centered Scriptorium Content */}
                <div className="flex-1 flex flex-col justify-center space-y-24">
                  <div className="space-y-4">
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onFocus={() => setLastFocusedField('title')}
                      placeholder="GIVE YOUR MEMORY A CINEMATIC TITLE..."
                      className="w-full bg-transparent border-none text-4xl lg:text-5xl font-serif text-white/90 placeholder:text-white/5 focus:outline-none focus:ring-0 italic transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <div className="relative space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Story Hook</h3>
                        </div>
                        <button 
                          onClick={handlePolishDescription}
                          disabled={isPolishingDesc}
                          className="flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-all border border-white/5"
                        >
                           {isPolishingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                           Apply AI Polish
                        </button>
                      </div>
                      
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onFocus={() => setLastFocusedField('description')}
                        placeholder="SET THE SCENE. WHAT IS THE EMOTIONAL CORE OF THIS REMEMBRANCE?"
                        className="w-full bg-transparent border-none text-2xl text-white/70 placeholder:text-white/5 focus:outline-none focus:ring-0 min-h-[300px] resize-none leading-relaxed italic font-mono"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACT 2: THE FULL NARRATIVE (Modern Editor) */}
            {productionStage === 1 && (
              <motion.div
                key="act-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mx-auto min-h-[80vh] flex flex-col pt-4 pb-32"
              >
                {/* Pinned Metadata Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                    <div className="w-8 h-px bg-emerald-500/30" />
                    Act II: The Narrative Build
                  </div>
                </div>

                {/* Centered Editor Content */}
                <div className="flex-1 flex flex-col justify-center space-y-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-serif text-white/90 italic">Script & Dialogue</h2>
                    <button 
                      onClick={handleAIExpand}
                      disabled={isExpanding}
                      className="group relative flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       {isExpanding ? <Loader2 className="w-5 h-5 animate-spin text-sky-400" /> : <Sparkles className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform" />}
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] relative z-10">Weave Script with AI</span>
                    </button>
                  </div>

                  <div className="relative scriptorium-fade">
                    <EditorContent editor={editor} className="min-h-[600px] font-mono text-lg text-white/80" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACT 3: SENSORY & METADATA (Contextual Richness) */}
            {productionStage === 2 && (
              <motion.div
                key="act-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-4xl mx-auto space-y-12 pb-32 pt-4"
              >
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                      <div className="w-8 h-px bg-emerald-500/30" />
                      Act III: Sensory Deepening
                      <div className="w-8 h-px bg-emerald-500/30" />
                    </div>
                    <h2 className="text-6xl font-serif text-white/90 italic">Atmospheric Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(sensoryConfigToUse as SensoryPromptTemplate[]).map((config: SensoryPromptTemplate) => (
                    <motion.div 
                      key={config.id}
                      whileHover={{ translateY: -5 }}
                      className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-6 group hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-all">
                          {config.id === 'aroma' && <Wind className="w-5 h-5" />}
                          {config.id === 'soundscape' && <Music className="w-5 h-5" />}
                          {config.id === 'texture' && <Layers className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{config.label}</span>
                      </div>
                        <textarea 
                          value={sensoryValues[config.id] || ''}
                          onChange={(e) => handleSensoryChange(config.id, e.target.value)}
                          placeholder={config.placeholder}
                          className="w-full bg-transparent border-none text-white/70 placeholder:text-white/10 focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[100px] resize-none italic font-mono"
                        />
                    </motion.div>
                  ))}
                </div>

                <div className="p-12 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Global Coordinates</span>
                      </div>
                      <input 
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="WHERE DID THIS SOUL-PRINT HAPPEN?"
                        className="w-full bg-transparent border-none text-3xl font-headline text-white placeholder:text-white/5 focus:outline-none focus:ring-0 italic"
                      />
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Temporal Mark</span>
                      </div>
                      <div className="flex gap-4">
                         <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent border-none text-3xl font-headline text-white focus:outline-none focus:ring-0 italic">
                            <option value="none">Year</option>
                            {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                         {/* Simple Day/Month selectors would go here */}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ACT 4: THE POSTER & PUBLICATION (The Final Reveal) */}
            {productionStage === 3 && (
              <motion.div
                key="act-4"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full max-w-4xl mx-auto flex flex-col gap-24 pb-24 pt-4 items-center"
              >
                <div className="flex-1 space-y-12 max-w-xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                      <div className="w-8 h-px bg-emerald-500/30" />
                      Act IV: The Final Cut
                    </div>
                    <h2 className="text-6xl font-serif text-white/90 italic leading-tight">Prepare for the Premiere</h2>
                    <p className="text-white/40 text-lg leading-relaxed font-serif italic">Your memory has been woven. The credits are set. All that remains is to release it to the world's collective soul.</p>
                  </div>

                  <div className="space-y-8 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Theatrical Credits</h3>
                       <button 
                        onClick={handleRejuvenatePoster}
                        disabled={isGeneratingPoster}
                        className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                       >
                         {isGeneratingPoster ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                       </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Director</label>
                          <input type="text" value={director} onChange={(e) => setDirector(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-emerald-500/50 outline-none transition-all font-mono" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Producer</label>
                          <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-emerald-500/50 outline-none transition-all font-mono" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="relative group perspective-1000">
                   <div className="absolute -inset-10 bg-sky-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <motion.div 
                    whileHover={{ scale: 1.02, rotateY: -10, rotateX: 5 }}
                    className="relative"
                   >
                     <CinemaPoster memory={{ ...data, id: data.id || '', title, chapterTitle, usePoster, posterStyle, posterImageUrl, credits: { director, producer, starring, billingLine } } as Memory} />
                   </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
    </div>
  );
}

// Export removed for named export migration
