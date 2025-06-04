
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import type { Memory, MemoryCategory, User } from '@/types';
import { memoryCategories } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaRecorder } from './MediaRecorder';
import { generateMemoryCuesAction } from '@/actions/generateMemoryCuesAction';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MemoryFormProps {
  memory?: Memory; // For editing
  onSubmit: (memoryData: Omit<Memory, 'id' | 'userId'>, userProfileForCues?: string) => void;
  isSubmitting?: boolean;
}

export function MemoryForm({ memory, onSubmit, isSubmitting }: MemoryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(memory?.title || '');
  const [date, setDate] = useState<Date | undefined>(memory ? new Date(memory.date) : new Date());
  const [description, setDescription] = useState(memory?.description || '');
  const [category, setCategory] = useState<MemoryCategory>(memory?.category || memoryCategories[0]);
  const [userProfile, setUserProfile] = useState(user?.profileInfo || '');
  const [aiCues, setAiCues] = useState<string[]>([]);
  const [isLoadingCues, setIsLoadingCues] = useState(false);

  useEffect(() => {
    if (user?.profileInfo && !memory) { // Pre-fill profile if new memory and user has profile
      setUserProfile(user.profileInfo);
    }
  }, [user, memory]);


  const handleGenerateCues = async () => {
    if (!userProfile.trim()) {
      toast({ title: "Profile Info Needed", description: "Please provide some information about yourself in the 'Your Profile for Cues' field.", variant: "destructive" });
      return;
    }
    setIsLoadingCues(true);
    try {
      const result = await generateMemoryCuesAction({
        userProfile: userProfile,
        currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      });
      setAiCues(result.memoryCues);
      if (result.memoryCues.length === 0) {
        toast({ title: "No Cues Generated", description: "Try refining your profile information." });
      } else {
        toast({ title: "Memory Cues Generated!", description: "Check the suggestions below." });
      }
    } catch (error) {
      console.error("Failed to generate cues", error);
      toast({ title: "Error Generating Cues", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
    setIsLoadingCues(false);
  };

  const handleCueClick = (cue: string) => {
    // Example: append cue to description or set as title if empty
    if (!title) setTitle(cue);
    else setDescription(prev => `${prev}\nInspired by: ${cue}`);
    toast({ title: "Cue Applied!", description: `"${cue}" added to your memory.` });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!date) {
      toast({ title: "Date Required", description: "Please select a date for the memory.", variant: "destructive" });
      return;
    }
    onSubmit({ title, date: date.toISOString(), description, category }, userProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{memory ? 'Edit Memory' : 'Add New Memory'}</CardTitle>
          <CardDescription>Capture the details of your moment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Vacation in Italy" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your memory..." rows={4} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: MemoryCategory) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {memoryCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <MediaRecorder />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI-Powered Memory Cues</CardTitle>
          <CardDescription>Get suggestions for memories based on your profile and current context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="user-profile">Your Profile for Cues (Interests, past events, etc.)</Label>
            <Textarea id="user-profile" value={userProfile} onChange={(e) => setUserProfile(e.target.value)} placeholder="e.g., Loves hiking, visited Paris in 2022, recently started learning guitar." rows={3} />
          </div>
          <Button type="button" onClick={handleGenerateCues} disabled={isLoadingCues} variant="outline">
            {isLoadingCues ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            Get AI Cues
          </Button>
          {aiCues.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">Suggested Cues:</h4>
              <ul className="list-disc list-inside space-y-1">
                {aiCues.map((cue, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    <button type="button" onClick={() => handleCueClick(cue)} className="text-primary hover:underline text-left">
                      {cue}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end p-0 pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (memory ? 'Save Changes' : 'Add Memory')}
        </Button>
      </CardFooter>
    </form>
  );
}
