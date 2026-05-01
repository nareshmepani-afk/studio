'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductionDeck from '@/components/studio/ProductionDeck';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { mockPrompts } from '@/lib/mockData';
import { storyScripts } from '@/lib/storyScripts';

function ProductionDeckConnector() {
  const searchParams = useSearchParams();
  const editMemoryId = searchParams.get('editMemoryId');
  const { user, loading: authLoading } = useAuth();
  
  const [memoryData, setMemoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(editMemoryId);
  const [layoutMode, setLayoutMode] = useState<'takeover' | 'drawer'>('takeover');

  const onToggleLayout = () => {
    setLayoutMode(prev => prev === 'takeover' ? 'drawer' : 'takeover');
  };

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;
    
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    if (editMemoryId) {
      const fetchMemory = async () => {
        try {
          const docRef = doc(db, 'users', user.uid, 'memories', editMemoryId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const retrieved = docSnap.data();
            
            // Rehydrate legacy db skeletons with explicit library fallback
            const pid = retrieved.promptId;
            const template = pid ? mockPrompts.find(p => p.id === pid) : null;
            const script = pid ? storyScripts[pid] : '';
            const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';

            let loadedProse = retrieved.prose || retrieved.content || '';
            // If the database has an empty TipTap state, override it with the live story script library
            if (!loadedProse || loadedProse === '<p></p>' || loadedProse === '<p><br></p>' || loadedProse.trim() === '') {
                loadedProse = formattedProse;
            }

            setMemoryData({ 
                id: docSnap.id, 
                ...retrieved,
                title: retrieved.title || template?.text?.en || template?.title || '',
                description: retrieved.description || template?.description || '',
                status: retrieved.status || 'draft',
                prose: loadedProse,
                sensoryConfig: retrieved.sensoryConfig || template?.sensoryPrompts || []
            });
            setActiveMemoryId(docSnap.id);
          } else {
            console.error("Memory not found!");
          }
        } catch (error) {
          console.error("Error fetching memory:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchMemory();
    } else {
      // If no ID is passed, build a brand new prompt overlay
      const promptId = searchParams.get('promptId');
      
      if (promptId) {
        const template = mockPrompts.find(p => p.id === promptId);
        const script = storyScripts[promptId] || '';
        const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';
        
        setMemoryData({
          title: template?.text?.en || template?.title || '',
          description: template?.description || '',
          status: 'draft',
          prose: formattedProse,
          sensoryConfig: template?.sensoryPrompts || [],
        });
      } else {
        setMemoryData({ sensoryConfig: [], status: 'draft' });
      }
      setLoading(false);
    }
  }, [authLoading, user?.uid, editMemoryId]);

  const handleUpdate = async (updatedData: any) => {
    // Optimistic UI update so TipTap/Sensory Bridge feels fast
    setMemoryData(updatedData); 
    
    if (!user?.uid) return;

    try {
      const { id, ...dataToSave } = updatedData;
      
      if (activeMemoryId) {
         // Record exists natively, run sequential updates
         const docRef = doc(db, 'users', user.uid, 'memories', activeMemoryId);
         await updateDoc(docRef, dataToSave);
      } else {
         // This is a brand new memory created via ?promptId or ?custom=true
         // We must create the document on the first keystroke debounce!
         const memoriesRef = collection(db, 'users', user.uid, 'memories');
         const promptId = searchParams.get('promptId') || (searchParams.get('custom') === 'true' ? 'custom' : 'unknown');
         
         const newDoc = await addDoc(memoriesRef, {
            ...dataToSave,
            promptId,
            createdAt: new Date().toISOString() // Ensure timestamp matches schema requirements
         });
         
         setActiveMemoryId(newDoc.id); // Bind future keystrokes to this new document
         // CRITICAL: Inject the newly minted database ID directly back into the live frontend UI object!
         setMemoryData((prev: any) => ({ ...prev, id: newDoc.id }));
         console.log("New Memory Created Instantly in Firestore:", newDoc.id);
      }
    } catch (error) {
      console.error("Error auto-saving memory: ", error);
    }
  };

  if (authLoading || loading) return <div className="p-8 text-white font-mono opacity-60 animate-pulse">Initializing Cinematic Personas...</div>;
  if (!user) return <div className="p-8 text-rose-400 font-mono">Authentication required to view this memory.</div>;
  if (!memoryData) return <div className="p-8 text-amber-400 font-mono">Memory could not be loaded.</div>;

  return (
    <ProductionDeck 
      memoryData={memoryData} 
      onUpdate={handleUpdate} 
      layoutMode={layoutMode}
      onToggleLayout={onToggleLayout}
    />
  );
}

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { StudioProvider } from '@/hooks/studio/useStudioState';

export default function AddMemoryPage() {
  return (
    <AuthenticatedPageWrapper>
      <StudioProvider>
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col">
          <Suspense fallback={<div className="p-8 text-white font-mono opacity-60">Wiring Engine...</div>}>
            <ProductionDeckConnector />
          </Suspense>
        </div>
      </StudioProvider>
    </AuthenticatedPageWrapper>
  );
}
