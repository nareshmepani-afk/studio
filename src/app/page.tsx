
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { mockMemories } from '@/lib/mockData';
import type { Memory } from '@/types'; // Removed MemoryCategory
import { PlusCircle, BookHeart, BellRing } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; 

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  // Removed categoryFilter state
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  
  const { setPendingRequestCount } = useAuth(); 

  const mockPendingRequests = [
    { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123' },
    { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456' },
  ];


  useEffect(() => {
    const timer = setTimeout(() => {
      setMemories(mockMemories);
      setIsLoading(false);
      setPendingRequestCount(mockPendingRequests.length); 
    }, 500);
    return () => clearTimeout(timer);
  }, [setPendingRequestCount]); 

  useEffect(() => {
    const scrollToHash = () => {
      if (window.location.hash === '#incoming-requests') {
        const element = document.getElementById('incoming-requests');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    if (!isLoading) {
      scrollToHash();
    }

    window.addEventListener('hashchange', scrollToHash, false);

    return () => {
      window.removeEventListener('hashchange', scrollToHash, false);
    };
  }, [isLoading]); 

  const handleEditMemory = (memory: Memory) => {
    console.log('Edit memory:', memory);
  };

  const handleDeleteMemory = (memoryId: string) => {
    setMemories(prevMemories => prevMemories.filter(m => m.id !== memoryId));
  };

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories;

    if (searchTerm) {
      result = result.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.emotionTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) // Optional: search in emotion tags
      );
    }

    // Category filter logic removed

    result.sort((a, b) => {
      switch (sortCriteria) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [memories, searchTerm, sortCriteria]); // Removed categoryFilter dependency


  if (isLoading) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4">
           <p>Loading memories...</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="font-headline text-4xl mb-4 md:mb-0">Your Memories</h1>
          <Link href="/add-memory" passHref>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Memory
            </Button>
          </Link>
        </div>

        <TimelineFilter
          onSortChange={setSortCriteria}
          // onCategoryFilterChange prop removed
          onSearchChange={setSearchTerm}
        />

        {filteredAndSortedMemories.length === 0 && mockPendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <BookHeart className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Welcome to Memory Weaver!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              This is where your life’s moments will live, forever.
            </p>
            <Link href="/add-memory" passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" />
                Record Your First Memory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onEdit={handleEditMemory}
                onDelete={handleDeleteMemory}
              />
            ))}
          </div>
        )}

        <div id="incoming-requests" className="mt-16"> 
          <div className="flex items-center mb-4">
            <BellRing className="h-8 w-8 text-primary mr-3" />
            <h2 className="font-headline text-3xl">Incoming Memory Requests</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Guests have requested these memories. Click one to start fulfilling it.
          </p>
          <div className="p-6 bg-card rounded-lg shadow-md">
            { mockPendingRequests.length > 0 ? (
                <ul className="space-y-3">
                  {mockPendingRequests.map(req => (
                    <li key={req.id} className="p-3 border rounded-md hover:bg-secondary transition-colors cursor-pointer">
                      <p className="font-medium">{req.text}</p>
                      <p className="text-sm text-muted-foreground">Requested by: {req.user}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center">No pending memory requests.</p>
              )
            }
          </div>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}
