
"use client";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { memoryCategoriesList, type MemoryCategory } from '@/types';
import { ListFilter, Search, Layers } from 'lucide-react';

interface TimelineFilterProps {
  onSortChange: (sortBy: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc') => void;
  onCategoryFilterChange: (category: MemoryCategory | 'all') => void;
  onSearchChange: (searchTerm: string) => void;
}

export function TimelineFilter({ onSortChange, onCategoryFilterChange, onSearchChange }: TimelineFilterProps) {
  return (
    <div className="mb-8 p-4 bg-card rounded-lg shadow sticky top-16 z-40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="search-memories" className="block text-sm font-medium text-muted-foreground mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-memories"
              type="search"
              placeholder="Search memories..."
              className="pl-10"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-muted-foreground mb-1">Sort by</label>
          <Select onValueChange={(value) => onSortChange(value as any)} defaultValue="date-desc">
            <SelectTrigger id="sort-by">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest first)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
          <Select onValueChange={(value) => onCategoryFilterChange(value as MemoryCategory | 'all')} defaultValue="all">
            <SelectTrigger id="category-filter">
              <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {memoryCategoriesList.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
