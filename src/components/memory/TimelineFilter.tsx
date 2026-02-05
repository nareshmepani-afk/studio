
'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memoryCategoriesList, MemoryCategory } from '@/types';
import { Search, SlidersHorizontal, ArrowUpDown, ShieldCheck, ShieldOff } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  onSearchChange: Dispatch<SetStateAction<string>>;
  onCategoryFilterChange: Dispatch<SetStateAction<MemoryCategory | 'all'>>;
  onSortChange: Dispatch<SetStateAction<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>>;
  onLegacyFilterChange: Dispatch<SetStateAction<'all' | 'legacy' | 'non-legacy'>>;
}

export const TimelineFilter: React.FC<Props> = ({
  onSearchChange,
  onCategoryFilterChange,
  onSortChange,
  onLegacyFilterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card/60 backdrop-blur-sm border-b p-4 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search memories..."
            className="pl-8 w-full"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select onValueChange={(value) => onCategoryFilterChange(value as MemoryCategory | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {memoryCategoriesList.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => onSortChange(value as 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc')}>
              <SelectTrigger>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => onLegacyFilterChange(value as 'all' | 'legacy' | 'non-legacy')}>
              <SelectTrigger>
                <SelectValue placeholder="Legacy Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Memories</SelectItem>
                <SelectItem value="legacy"><ShieldCheck className="mr-2 h-4 w-4" />Legacy Only</SelectItem>
                <SelectItem value="non-legacy"><ShieldOff className="mr-2 h-4 w-4" />Not Legacy</SelectItem>
              </SelectContent>
            </Select>
        </div>
      )}
    </div>
  );
};
