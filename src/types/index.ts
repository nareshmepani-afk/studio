
export interface User {
  id: string;
  email: string;
  name?: string;
  profileInfo?: string; // For AI cues
}

export interface MediaAttachment {
  id: string; // Unique ID for this media item within a memory
  type: 'video' | 'audio';
  url: string; // URL to the media file (e.g., Firestore Storage URL)
  filename?: string; // Optional: original filename
  startTime?: number; // Optional: start time in seconds for pseudo-trim
  endTime?: number;   // Optional: end time in seconds for pseudo-trim
  duration?: number;  // Optional: total duration of the media in seconds
}

export interface Memory {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  category: MemoryCategory;
  mediaAttachments?: MediaAttachment[]; // New structure for one or more media items
  imageUrl?: string; // For cover image (can be a frame from video or separate upload)
  userId: string;
}

export type MemoryCategory = 'Travel' | 'Family' | 'Work' | 'Personal' | 'Friends' | 'Event' | 'Other';

export const memoryCategories: MemoryCategory[] = ['Travel', 'Family', 'Work', 'Personal', 'Friends', 'Event', 'Other'];

export interface PromptText {
  en: string;
  gu: string;
  [key: string]: string; // For future languages
}
export interface Prompt {
  id: string;
  text: PromptText; // Changed from string to PromptText
  isFlaggedForReuse: boolean;
  userId?: string; // If prompts are user-specific
}

