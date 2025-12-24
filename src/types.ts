
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
    isTrimmed?: boolean;
    startTime?: number;
    endTime?: number;
}

export interface Memory {
    id: string;
    title: string;
    date: string;
    description: string;
    category: MemoryCategory | string;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
    mediaAttachments: MediaAttachment[];
    isLegacy?: boolean;
    location?: string;
    emotionTags?: string[]; // Array of emotion tag IDs
    promptId?: string;
}

export interface Prompt {
  id: string;
  title: string;
  question: string;
  category: MemoryCategory | string; // Can be a string for backward compatibility
}

export interface PromptGroup {
  group: string;
  prompts: Prompt[];
}

export interface UserDetails {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  birthDate?: string;
  location?: string;
}
