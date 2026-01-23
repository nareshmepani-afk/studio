
import { z } from 'zod';

export const memoryCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type MemoryCategory = z.infer<typeof memoryCategorySchema>;

export const memoryCategoriesList: MemoryCategory[] = [
    { id: "personal_reflection", label: "Personal Reflection" },
    { id: "family_event", label: "Family Event" },
    { id: "travel", label: "Travel" },
    { id: "career_milestone", label: "Career Milestone" },
    { id: "health_wellness", label: "Health and Wellness" },
    { id: "learning_education", label: "Learning and Education" },
    { id: "relationship", label: "Relationship" },
    { id: "hobby_interest", label: "Hobby and Interest" },
    { id: "spiritual_journey", label: "Spiritual Journey" },
    { id: "civic_engagement", label: "Civic Engagement" },
    { id: "childhood", label: "Childhood" },
    { id: "daily_life", label: "Daily Life" },
    { id: "dreams_aspirations", label: "Dreams and Aspirations" },
    { id: "challenges_growth", label: "Challenges and Growth" },
    { id: "cultural_traditions", label: "Cultural Traditions" },
];

// Added EmotionTag interface and list
export interface EmotionTag {
    id: string;
    label: string;
}

export const emotionTagsList: EmotionTag[] = [
    { id: 'happy', label: 'Happy' },
    { id: 'sad', label: 'Sad' },
    { id: 'anxious', label: 'Anxious' },
    { id: 'excited', label: 'Excited' },
    { id: 'peaceful', label: 'Peaceful' },
    { id: 'angry', label: 'Angry' },
    { id: 'grateful', label: 'Grateful' },
    { id: 'nostalgic', label: 'Nostalgic' },
];

export interface MediaAttachment {
    id: string;
    url: string;
    type: 'audio' | 'video';
    filename: string;
    duration?: number;
    trimStart?: number;
    trimEnd?: number;
}

export interface Memory {
    id: string;
    title: string;
    date: string;
    description: string;
    category: MemoryCategory | string;
    userId: string;
    createdAt?: any;
    updatedAt?: any;
    mediaAttachments: MediaAttachment[];
    isLegacy?: boolean;
    location?: string;
    country?: string;
    emotionTags: string[]; // Array of emotion tag IDs
    promptId?: string;
    imageUrl?: string;
    userDefinedOrder?: number;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  text: {
    en: string;
    gu: string;
  };
  isFlaggedForReuse?: boolean;
  subPrompts?: Prompt[];
}

export interface PromptGroup {
  id: string;
  title: {
    en: string;
    gu: string;
  };
  prompts: Prompt[];
}

export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
    countryOfBirth?: string;
    city?: string;
    townArea?: string;
    sharedAccessStatus: 'no_pass_initiated' | 'free_pass_active' | 'paid_pass_active' | 'free_pass_expired' | 'paid_pass_expired';
    freePassActivatedDate?: string;
    paidPassExpiryDate?: string;
    hostPassStatus: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
    freeHostPassActivatedDate?: string;
    paidHostPassExpiryDate?: string;
    storageUsedBytes: number;
    storageQuota: { total: number; used: number };
}

/**
 * A standard response format for server-side actions.
 * Provides a clear success/failure status and a corresponding message.
 */
export interface ActionResponse {
  success: boolean;
  message: string;
  // Can optionally include data in the response
  data?: any;
}

export type UserMode = 'host' | 'guest';
