
export interface User {
  id: string;
  email: string;
  name?: string;
  profileInfo?: string; // For AI cues
}

export interface Memory {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  category: MemoryCategory;
  media?: { type: 'video' | 'audio'; url: string }[]; // Placeholder for media
  imageUrl?: string; // For cover image
  userId: string;
}

export type MemoryCategory = 'Travel' | 'Family' | 'Work' | 'Personal' | 'Friends' | 'Event' | 'Other';

export const memoryCategories: MemoryCategory[] = ['Travel', 'Family', 'Work', 'Personal', 'Friends', 'Event', 'Other'];

export interface Prompt {
  id: string;
  text: string;
  isFlaggedForReuse: boolean;
  userId?: string; // If prompts are user-specific
}
