
import { Timestamp } from 'firebase/firestore';

// Represents a user in the system
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Custom fields
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'trialing';
  lastLogin?: Timestamp;
}

// Defines the structure for a media attachment in a memory
export interface MediaAttachment {
  id: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  filename: string;
  size?: number; // Size in bytes
  duration?: number; // Duration in seconds for video/audio
  startTime?: number; // For trims
  endTime?: number;   // For trims
  createdAt?: Timestamp;
}

// Represents a memory created by a user
export interface Memory {
  id: string;
  title: string;
  date: string; // ISO 8601 format
  description: string;
  emotionTags: EmotionTag[];
  userId: string;
  location?: string;
  country?: string;
  mediaAttachments?: MediaAttachment[];
  imageUrl?: string; // Optional cover image if no video/image attachment
  isLegacy?: boolean; // Part of the Legacy Chest
  promptId?: string; // Linked to a specific prompt
  category?: MemoryCategory;
  createdAt?: string; // ISO 8601 format
  updatedAt?: string; // ISO 8601 format
}

// Predefined list of emotion tags for consistency
export const emotionTagsList = [
  'Happy', 'Joy', 'Love', 'Excitement', 'Gratitude', 'Peace', 'Hope',
  'Reflective', 'Nostalgia', 'Sadness', 'Grief', 'Fear', 'Anger', 
  'Surprise', 'Funny', 'Melancholy', 'Inspiration', 'Triumph'
] as const; // `as const` makes it a readonly tuple

export type EmotionTag = typeof emotionTagsList[number];

// Predefined list of memory categories
export const memoryCategoriesList = [
  'Family', 'Travel', 'Work', 'Hobbies', 'Health', 'Education', 'Achievements', 'Relationships', 'Spirituality', 'Personal Growth'
] as const;

export type MemoryCategory = typeof memoryCategoriesList[number];


// Represents a single prompt for the user
export interface Prompt {
    id: string;
    text: {
        en: string;
        gu: string;
    };
    isFlaggedForReuse?: boolean;
    userId?: string; // To whom this prompt might be private/custom
    subPrompts?: Prompt[]; // Array of sub-prompts
}

// Represents a group of related prompts
export interface PromptGroup {
  id: string;
  title: {
    en: string;
    gu: string;
  };
  prompts: Prompt[];
}
