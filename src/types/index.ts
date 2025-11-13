
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  name?: string;
  profileInfo?: string; // For AI cues
  avatarUrl?: string;
  dateOfBirth?: string; // ISO string
  countryOfBirth?: string;
  city?: string;
  townArea?: string;

  // Guest Pass fields
  sharedAccessStatus?: 'free_pass_active' | 'paid_pass_active' | 'free_pass_expired' | 'paid_pass_expired' | 'no_pass_initiated';
  freePassActivatedDate?: string; // ISO string - when the 6-month free GUEST pass was first activated
  paidPassExpiryDate?: string; // ISO string - when the current 31-day paid GUEST pass expires
  viewedSharedMemoryIds?: string[]; // IDs of shared memories viewed by this user when in guest mode

  // Host Pass fields
  hostPassStatus?: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  freeHostPassActivatedDate?: string; // ISO string - when the 6-month free HOST pass was first activated
  paidHostPassExpiryDate?: string;    // ISO string - when the current 31-day paid HOST pass expires
  storageUsedBytes?: number; // Estimated storage used by the host
}

export type UserMode = 'host' | 'guest';

export interface MediaAttachment {
  id: string; // Unique ID for this media item within a memory
  type: 'video' | 'audio';
  url: string; // URL to the media file (e.g., Firestore Storage URL)
  filename?: string; // Optional: original filename
  startTime?: number; // Optional: start time in seconds for pseudo-trim
  endTime?: number;   // Optional: end time in seconds for pseudo-trim
  duration?: number;  // Optional: total duration of the media in seconds
  size?: number; // Optional: size of the media file in bytes
}

export const emotionTagsList = [
  'Happy', 'Sad', 'Reflective', 'Funny', 'Joy', 'Loss', 'Gratitude', 'Love',
  'Anger', 'Fear', 'Surprise', 'Excitement', 'Hope', 'Peace', 'Nostalgia', 'Inspiration'
] as const;

export type EmotionTag = typeof emotionTagsList[number];

export const memoryCategoriesList = [
  'Travel', 'Family', 'Work', 'Personal Growth', 'Hobbies', 'Education', 'Celebrations', 'Challenges', 'Friends', 'Other'
] as const;

export type MemoryCategory = typeof memoryCategoriesList[number];

export interface Memory {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  emotionTags?: EmotionTag[];
  mediaAttachments?: MediaAttachment[];
  imageUrl?: string; // Fallback image if no media or for card previews
  userId: string; // The ID of the user who owns/created this memory
  location?: string; // For geographical context, e.g., "Paris" or "Yellowstone National Park"
  country?: string;  // For country context, e.g., "France" or "USA"
  isLegacy?: boolean; // For designating memories for the Legacy Chest
  promptId?: string; // ID of the prompt this memory fulfills
  category?: MemoryCategory;
  createdAt?: Timestamp; // Firestore Timestamp for when the memory was created
  updatedAt?: Timestamp; // Firestore Timestamp for when the memory was last updated
}

export interface PromptText {
  en: string;
  gu: string;
  [key: string]: string; // For future languages
}
export interface Prompt {
  id: string;
  text: PromptText;
  isFlaggedForReuse: boolean;
  userId?: string; // If prompts are user-specific
}

export interface PromptGroup {
  id: string; // e.g., 'part-i'
  title: {
    en: string;
    gu: string;
    [key: string]: string;
  }; // e.g., 'Part I: Roots and Foundations'
  prompts: Prompt[];
}

// Storage Quotas
export const FREE_TIER_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024; // 10 MB (Kept for reference)
export const STANDARD_HOST_STORAGE_QUOTA_BYTES = 600 * 1024 * 1024; // 600 MB - for users with an active host pass (interpreted as per-memory/chapter limit)



