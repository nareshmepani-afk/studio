
export interface MediaAttachment {
  id: string;
  url: string;
  type: 'video' | 'audio';
  startTime?: number;
  endTime?: number;
  isTrimmed?: boolean;
  duration?: number;
  filename?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string; // This is the category ID
  emotionTags: string[]; // This is an array of tag IDs
  location?: string;
  country?: string;
  userId: string;
  mediaAttachments?: MediaAttachment[];
  createdAt?: string;
  updatedAt?: string;
  promptId?: string;
}

// Corrected Type Definitions
export interface MemoryCategory {
  id: string;
  label: string;
}

export interface EmotionTag {
  id: string;
  label: string;
}

// Corrected List of Category Objects
export const memoryCategoriesList: MemoryCategory[] = [
  { id: "personal", label: "Personal" },
  { id: "family", label: "Family" },
  { id: "travel", label: "Travel" },
  { id: "work", label: "Work" },
  { id: "milestone", label: "Milestone" },
  { id: "dream", label: "Dream" },
  { id: "other", label: "Other" },
];

// Corrected List of Emotion Tag Objects
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
