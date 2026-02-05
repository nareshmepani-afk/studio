'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Smile, CalendarIcon, Layers } from 'lucide-react';
import { memoryCategoriesList, emotionTagsList, MemoryCategory } from '@/types';

interface MetadataInspectorProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  selectedCategory: MemoryCategory | undefined;
  setSelectedCategory: (value: MemoryCategory | undefined) => void;
  location: string;
  setLocation: (value: string) => void;
  selectedEmotionTags: string[];
  handleEmotionTagToggle: (tagId: string) => void;
  selectedYear: number;
  setSelectedYear: (value: number) => void;
  selectedMonth: number;
  setSelectedMonth: (value: number) => void;
  selectedDay: number;
  setSelectedDay: (value: number) => void;
  years: number[];
  months: { value: number; label: string; }[];
  days: number[];
  isSubmitting: boolean;
  handleSubmit: () => void;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({
  title, setTitle,
  description, setDescription,
  selectedCategory, setSelectedCategory,
  location, setLocation,
  selectedEmotionTags, handleEmotionTagToggle,
  selectedYear, setSelectedYear,
  selectedMonth, setSelectedMonth,
  selectedDay, setSelectedDay,
  years, months, days,
  isSubmitting,
  handleSubmit
}) => {
  return (
    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
        <div className='space-y-1'>
            <Label htmlFor='title' className="text-sm font-medium text-muted-foreground">Title</Label>
            <Input id='title' value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your memory a name..." className='text-lg font-headline h-auto p-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent' />
        </div>

        <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea id='description' value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the moment..." className='leading-relaxed bg-transparent' />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label className="flex items-center text-xs text-muted-foreground"><CalendarIcon className="mr-1.5 h-3 w-3" /> Date</Label>
                <div className="grid grid-cols-3 gap-1">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className='h-8 text-xs bg-transparent'><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>{years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className='h-8 text-xs bg-transparent'><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>{months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                    <SelectTrigger className='h-8 text-xs bg-transparent'><SelectValue placeholder="Day" /></SelectTrigger>
                    <SelectContent>{days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}</SelectContent>
                </Select>
                </div>
            </div>
            <div className="space-y-1">
                <Label className="flex items-center text-xs text-muted-foreground"><MapPin className="mr-1.5 h-3 w-3" /> Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did this happen?" className='h-8 text-xs bg-transparent' />
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            <Select onValueChange={(value) => setSelectedCategory(value as MemoryCategory)} value={selectedCategory}>
            <SelectTrigger className='text-xs h-7 w-auto gap-1.5 pl-2 pr-2 border-dashed bg-transparent'>
                <Layers className="h-3 w-3" />
                <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
                {memoryCategoriesList.map(cat => <SelectItem key={cat.id} value={cat.id} className='text-xs'>{cat.label}</SelectItem>)}
            </SelectContent>
            </Select>
            {emotionTagsList.map(tag => (
                <div key={tag.id} 
                onClick={() => handleEmotionTagToggle(tag.id)} 
                className={`flex items-center rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors ${selectedEmotionTags.includes(tag.id) ? 'bg-primary/10 border-primary/40' : 'border-dashed hover:border-primary/40'}`}>
                    <Smile className="h-3 w-3 mr-1 opacity-60" />
                    {tag.label}
                </div>
            ))}
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Memory'}
        </Button>
    </div>
  );
};
