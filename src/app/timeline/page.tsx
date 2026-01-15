"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { Loader2, Calendar } from 'lucide-react';
import type { Memory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function TimelinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && db) {
      setIsLoading(true);
      const memoriesQuery = query(
        collection(db, "users", user.uid, "memories"), 
        orderBy('userDefinedOrder', 'asc') // Order by the new field
      );
        
      const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        const memoriesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Memory[];
        setMemories(memoriesData);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const handleEdit = (memory: Memory) => {
    router.push(`/add-memory?editMemoryId=${memory.id}`);
  };

  const handleDelete = async (memoryId: string) => {
    if (!user) return;

    const memoryToDeleteIndex = memories.findIndex(m => m.id === memoryId);
    if (memoryToDeleteIndex === -1) return;

    const memoryToDelete = memories[memoryToDeleteIndex];

    try {
      // 1. Delete the document from Firestore
      await deleteDoc(doc(db, "users", user.uid, "memories", memoryId));

      // 2. Delete associated media from Storage
      if (memoryToDelete.mediaAttachments?.length) {
        const fileRef = ref(storage, memoryToDelete.mediaAttachments[0].url);
        await deleteObject(fileRef);
      }

      // 3. Re-index the remaining memories
      const remainingMemories = memories.filter(m => m.id !== memoryId);
      const batch = writeBatch(db);
      remainingMemories.forEach((memory, index) => {
        const memoryRef = doc(db, "users", user.uid, "memories", memory.id);
        batch.update(memoryRef, { userDefinedOrder: index });
      });
      await batch.commit();

      toast({ title: "Success", description: "Memory deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete memory.", variant: "destructive" });
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination || !user) return;

    const reorderedMemories = Array.from(memories);
    const [movedItem] = reorderedMemories.splice(result.source.index, 1);
    reorderedMemories.splice(result.destination.index, 0, movedItem);

    setMemories(reorderedMemories);

    const batch = writeBatch(db);
    reorderedMemories.forEach((memory, index) => {
      const memoryRef = doc(db, "users", user.uid, "memories", memory.id);
      batch.update(memoryRef, { userDefinedOrder: index });
    });

    try {
      await batch.commit();
      toast({ title: "Success", description: "Timeline reordered!" });
    } catch (error) {
      setMemories(memories);
      toast({ title: "Error", description: "Failed to reorder timeline.", variant: "destructive" });
    }
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">Your Timeline</h1>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="timeline">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  memories.map((memory, index) => (
                    <Draggable key={memory.id} draggableId={memory.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <MemoryCard 
                            memory={memory}
                            onEdit={() => handleEdit(memory)}
                            onDelete={() => handleDelete(memory.id)}
                            userMode={"host"}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </AuthenticatedPageWrapper>
  );
}
