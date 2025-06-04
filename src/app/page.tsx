
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { mockMemories } from '@/lib/mockData';
import type { Memory, MemoryCategory } from '@/types';
import { PlusCircle, BookHeart, BellRing } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Not implemented yet, but for future
  
  const { setPendingRequestCount } = useAuth(); // Get setPendingRequestCount from context

  // Mock incoming requests data
  const mockPendingRequests = [
    { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123' },
    { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456' },
  ];


  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMemories(mockMemories);
      setIsLoading(false);
      // Simulate setting pending request count
      setPendingRequestCount(mockPendingRequests.length); 
    }, 500);
  }, [setPendingRequestCount]); // Add setPendingRequestCount to dependency array

  const handleEditMemory = (memory: Memory) => {
    // Navigate to edit page or open modal
    console.log('Edit memory:', memory);
    // For now, just log. In a real app, you'd navigate to an edit page.
    // router.push(`/edit-memory/${memory.id}`);
  };

  const handleDeleteMemory = (memoryId: string) => {
    setMemories(prevMemories => prevMemories.filter(m => m.id !== memoryId));
    // Call API to delete
  };

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(memory => memory.category === categoryFilter);
    }

    // Sort
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
  }, [memories, searchTerm, sortCriteria, categoryFilter]);


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
          onCategoryFilterChange={setCategoryFilter}
          onSearchChange={setSearchTerm}
        />

        {filteredAndSortedMemories.length === 0 && mockPendingRequests.length === 0 ? ( // Also check if there are no pending requests for this specific empty state
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

        {/* Incoming Memory Requests Section */}
        <div className="mt-16"> 
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
