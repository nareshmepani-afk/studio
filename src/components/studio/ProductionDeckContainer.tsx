'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { storyScripts } from '@/lib/storyScripts';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductionDeck from './ProductionDeck';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProductionDeckContainerProps {
  promptId: string;
  isModal?: boolean;
}

export function ProductionDeckContainer({ promptId, isModal = false }: ProductionDeckContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { chapters, isLoading: studioLoading } = useStudioData(user?.uid || 'guest');
  const pathname = usePathname();
  
  // THE INVISIBLE DISMISSAL: If we are in modal mode but navigated away from production, 
  // we must return null to ensure the "layering" doesn't block the dashboard.
  const isProductionRoute = pathname?.includes('/production/');
  
  const [selectedProductionData, setSelectedProductionData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  // To avoid circular layout state, we just keep it simple. If it's modal, we use takeover.
  // We can still support the drawer mode if needed, but takeover is the default.
  const [layoutMode, setLayoutMode] = useState<'takeover' | 'drawer'>('takeover');

  useEffect(() => {
    if (studioLoading || !chapters.length) return;

    // Logic replicated from StudioDashboard handleStartChapter
    const chapterPrompts = chapters.flatMap(c => c.prompts);
    const cp = chapterPrompts.find(p => p.id === promptId);
    
    let memoryToEdit = null;

    if (cp?.memory) {
        // Rehydrate memory data for the deck
        const pid = cp.memory.promptId;
        const script = pid ? storyScripts[pid] : '';
        const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';
        
        let loadedProse = cp.memory.prose || cp.memory.content || '';
        if (!loadedProse || loadedProse === '<p></p>' || loadedProse === '<p><br></p>' || loadedProse.trim() === '') {
            loadedProse = formattedProse;
        }

        memoryToEdit = {
            ...cp.memory,
            prose: loadedProse
        };
    } else {
        // New Production Draft
        const template = cp;
        const script = promptId ? storyScripts[promptId] : '';
        const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';

        memoryToEdit = {
          title: template?.title || '',
          description: template?.description || '',
          promptId: promptId,
          status: 'draft',
          prose: formattedProse,
          sensoryConfig: [], // Default empty
        };
    }

    if (memoryToEdit) {
        setSelectedProductionData(memoryToEdit);
        setIsReady(true);
    }
  }, [chapters, studioLoading, promptId]);

  const handleUpdateProduction = useCallback(async (updatedData: any) => {
    if (!user) return;
    
    // Optimistic Update
    setSelectedProductionData(updatedData);

    try {
      const { id, ...dataToSave } = updatedData;
      if (id) {
         await updateDoc(doc(db, 'users', user.uid, 'memories', id), dataToSave);
      } else {
         // Create local in DB
         const memoriesRef = collection(db, 'users', user.uid, 'memories');
         const newDoc = await addDoc(memoriesRef, {
            ...dataToSave,
            createdAt: new Date().toISOString()
         });
         setSelectedProductionData((prev: any) => ({ ...prev, id: newDoc.id }));
      }
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  }, [user]);

  const handleClose = () => {
    // If it's a modal, we want to go back to the dashboard
    router.back();
  };

  const toggleLayoutMode = () => {
    const next = layoutMode === 'takeover' ? 'drawer' : 'takeover';
    setLayoutMode(next);
  };

  if (!isReady || !selectedProductionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline mb-2 text-primary/80 italic">Preparing Stage...</h2>
      </div>
    );
  }

  const containerContent = (
    <>
      {isModal && (
        <div className="absolute top-6 right-6 z-[110]">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={handleClose}
             className="rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all w-12 h-12"
           >
             <Plus className="w-6 h-6 rotate-45" />
           </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto custom-scrollbar h-full">
        <ProductionDeck 
          memoryData={selectedProductionData} 
          onUpdate={handleUpdateProduction} 
          layoutMode={layoutMode}
          onToggleLayout={toggleLayoutMode}
        />
      </div>
    </>
  );

  if (isModal) {
    if (!isProductionRoute) return null;
    
    return (
      <>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[30]"
        />
        
        {/* The Deck Modal */}
        <motion.div
          initial={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
          animate={layoutMode === 'takeover' ? { opacity: 1, scale: 1 } : { x: 0 }}
          exit={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "fixed z-[40] bg-slate-950 border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500",
            layoutMode === 'takeover' 
              ? "inset-0 top-16 h-[calc(100vh-64px)] border-t shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
              : "top-16 right-0 bottom-0 w-full md:w-[75%] h-[calc(100vh-64px)] border-l"
          )}
        >
          {containerContent}
        </motion.div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex items-center p-4 border-b border-white/10">
        <Button onClick={() => router.push('/studio')} variant="ghost" className="text-white/60 hover:text-white">
          &larr; Exit to Studio
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        {containerContent}
      </div>
    </div>
  );
}
