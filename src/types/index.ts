/**
 * @fileOverview Centralized type definitions for the Memory Weaver application.
 * This is the single source of truth to prevent module resolution conflicts.
 */

export * from './roles';

export interface MediaAttachment {
  url: string;
  type: string; // 'image' | 'video' | 'audio'
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
  thumbnailUrl?: string;
  size?: number;
}

export interface Memory {
  id: string;
  userId: string;
  promptId?: string;
  title: string;
  description: string;
  category: string | MemoryCategory;
  location: string;
  city?: string;
  country?: string;
  videoUrl?: string;
  emotionTags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  status?: 'draft' | 'published';
  mediaAttachments?: MediaAttachment[];
  imageUrl?: string;
  isLegacy?: boolean;
  sensoryConfig?: SensoryPromptTemplate[];
  chapterTitle?: string;
  usePoster?: boolean;
  posterStyle?: 'cinematic' | 'modern' | 'minimalist';
  posterImageUrl?: string;
  credits?: {
    director?: string;
    producer?: string;
    starring?: string;
    billingLine?: string; // Condensed small-caps credits line
  };
  dateComponents?: {
    day?: string;
    month?: string;
    year?: string;
  };
  prose?: string;
  content?: string;
}

export interface TranscriptSegment {
  startTime: number; // In seconds
  endTime: number;
  text: string;
  speaker?: string;
}

export interface Chapter {
  startTime: number;
  title: string;
  description: string;
  type: 'hook' | 'incident' | 'struggle' | 'climax' | 'resolution';
}

export interface DirectorsNotepad {
  transcript: TranscriptSegment[];
  emotionalBeats: {
    time: number;
    label: string;
    color: string;
    description: string;
  }[];
  entities: {
    name: string;
    type: string;
    mention: string;
  }[];
  directorNotes: string;
  suggestedChapters: Chapter[];
  analyzedAt: string;
}

export type MemoryCategory = {
  id: string;
  label: string;
};

export const memoryCategoriesList: MemoryCategory[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'travel', label: 'Travel' },
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'special_event', label: 'Special Event' },
];

export type EmotionTag = {
  id: string;
  label: string;
};

export const emotionTagsList: EmotionTag[] = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'excited', label: 'Excited' },
  { id: 'nostalgic', label: 'Nostalgic' },
  { id: 'proud', label: 'Proud' },
  { id: 'loved', label: 'Loved' },
];

export interface SensoryPromptTemplate {
  id: string;
  label: string;
  placeholder: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  text: { en: string; gu: string };
  isFlaggedForReuse?: boolean;
  subPrompts?: Prompt[];
  sensoryPrompts?: SensoryPromptTemplate[];
}

export interface PromptGroup {
  id: string;
  title: { en: string; gu: string };
  prompts: Prompt[];
}

export interface StorageQuota {
  total: number;
  used: number;
}

export interface Contact {
  id: string;
  email: string;
  name?: string;
  lastUsedAt: any; // Firestore Timestamp
}

export interface UserAccount {
  uid: string;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  dateOfBirth?: string;
  countryOfBirth?: string;
  city?: string;
  townArea?: string;
  sharedAccessStatus?: 'no_pass_initiated' | 'free_pass_active' | 'paid_pass_active' | 'free_pass_expired' | 'paid_pass_expired';
  freePassActivatedDate?: string;
  paidPassExpiryDate?: string;
  directorPassStatus?: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  freeDirectorPassActivatedDate?: string;
  paidDirectorPassExpiryDate?: string;
  storageUsedBytes?: number;
  storageQuota?: StorageQuota;
  flaggedPrompts?: string[];
  isPremium?: boolean;
}

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export interface StoryRequest {
  id: string;
  promptId: string;
  promptTitle?: string; // Unified name for the requested story
  guestName: string;
  guestEmail: string;
  directorId: string;
  status: 'pending' | 'fulfilled' | 'ignored';
  timestamp: any; // Firestore timestamp
}
