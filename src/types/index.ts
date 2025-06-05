
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
}

export const emotionTagsList = [
  'Happy', 'Sad', 'Reflective', 'Funny', 'Joy', 'Loss', 'Gratitude', 'Love',
  'Anger', 'Fear', 'Surprise', 'Excitement', 'Hope', 'Peace', 'Nostalgia', 'Inspiration'
] as const;

export type EmotionTag = typeof emotionTagsList[number];

export interface Memory {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  emotionTags?: EmotionTag[]; // Replaces category
  mediaAttachments?: MediaAttachment[];
  imageUrl?: string;
  userId: string;
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
