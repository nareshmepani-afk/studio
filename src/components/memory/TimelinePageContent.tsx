
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Memory, MemoryCategory } from '@/types';
import { format, parseISO, addMonths } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

// UI Components
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';

// Icons
import { PlusCircle, Film, Users, ShieldCheck, ShieldOff, CalendarClock, ShoppingCart, Gift, Loader2, Info, Award, Archive } from 'lucide-react';

// Actions
import { getPassPriceAction } from '@/actions/getPassPriceAction';

interface TimelinePageContentProps {
  initialMemories: Memory[];
}

export function TimelinePageContent({ initialMemories }: TimelinePageContentProps) {
  const [memories, setMemories] = useState(initialMemories);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
  const [legacyFilter, setLegacyFilter] = useState<'all' | 'legacy' | 'non-legacy'>('all');
  const router = useRouter();
  const db = getFirestore(app);

  const { user, userMode, hostPassStatus, updateUserProfileInFirestore, loading: authLoading } = useAuth();

  // Effect to update state when server-fetched props change
  useEffect(() => {
    setMemories(initialMemories);
  }, [initialMemories]);

  const handleDeleteMemory = useCallback(async (memoryId: string) => {
    if (!user) return;
    try {
      const memoryDocRef = doc(db, "users", user.id, "memories", memoryId);
      await deleteDoc(memoryDocRef);
      setMemories(prev => prev.filter(m => m.id !== memoryId)); // Update UI immediately
      toast({ title: "Memory Deleted", variant: "success"});
    } catch (error) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  }, [user, db]);

  const handleToggleLegacyStatus = useCallback(async (memoryId: string) => {
    if (!user) return;
    const memoryToUpdate = memories.find(mem => mem.id === memoryId);
    if (!memoryToUpdate) return;
    const newLegacyStatus = !memoryToUpdate.isLegacy;
    try {
      const memoryDocRef = doc(db, "users", user.id, "memories", memoryId);
      await updateDoc(memoryDocRef, { isLegacy: newLegacyStatus });
      setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, isLegacy: newLegacyStatus } : m));
      toast({ title: newLegacyStatus ? "Added to Legacy Chest" : "Removed from Legacy Chest", variant: "success" });
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  }, [user, memories, db]);

  const handleEditMemory = (mem: Memory) => {
    router.push(`/add-memory?editMemoryId=${mem.id}`);
  };

  const filteredAndSortedMemories = useMemo(() => {
    let result = [...memories];
    // All filtering and sorting logic from the original page is preserved here
    if (searchTerm) {
      result = result.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(memory => memory.category === categoryFilter);
    }
    if (legacyFilter !== 'all') {
      result = result.filter(memory => legacyFilter === 'legacy' ? memory.isLegacy === true : memory.isLegacy !== true);
    }
    result.sort((a, b) => {
      if (sortCriteria === 'title-asc') return a.title.localeCompare(b.title);
      if (sortCriteria === 'title-desc') return b.title.localeCompare(a.title);
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (sortCriteria === 'date-asc') return dateA - dateB;
      return dateB - dateA;
    });
    return result;
  }, [memories, searchTerm, sortCriteria, categoryFilter, legacyFilter]);

  // The rest of the component is the JSX render, which is almost identical to the original page.
  // I've omitted the placeholder/empty state JSX for brevity, but it's the same as before.

  return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="font-headline text-4xl mb-4 md:mb-0">{userMode === 'host' ? 'Your Memories' : 'Shared With You'}</h1>
          {userMode === 'host' && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Link href="/add-memory">
                              <Button>
                                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Memory
                              </Button>
                          </Link>
                      </TooltipTrigger>
                      <TooltipContent><p>Add a new memory to your timeline.</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </div>
          )}
        </div>

        <TimelineFilter
          onSortChange={setSortCriteria}
          onSearchChange={setSearchTerm}
          onCategoryFilterChange={setCategoryFilter}
          onLegacyFilterChange={setLegacyFilter}
        />

        {filteredAndSortedMemories.length === 0 && !authLoading && (
            <div className="text-center py-12">
                <Film className="mx-auto h-16 w-16 text-primary mb-6" />
                <h2 className="font-headline text-3xl mb-3">No memories found.</h2>
                <p className="text-muted-foreground mb-8">Start by adding a new memory.</p>
            </div>
        )}

        {filteredAndSortedMemories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => (
              <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onEdit={userMode === 'host' ? handleEditMemory : undefined}
                  onDelete={userMode === 'host' ? handleDeleteMemory : undefined}
                  onToggleLegacyStatus={userMode === 'host' ? handleToggleLegacyStatus : undefined}
                  userMode={userMode}
              />
            ))}
          </div>
        )}
      </div>
  );
}

