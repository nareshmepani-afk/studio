
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
  category: string;
  emotionTags: string[];
  location?: string;
  country?: string;
  userId: string;
  mediaAttachments?: MediaAttachment[];
  createdAt?: string;
  updatedAt?: string;
  promptId?: string;
}

// Placeholder data based on your MemoryForm component
export const memoryCategoriesList = [
  "Personal",
  "Family",
  "Travel",
  "Work",
  "Milestone",
  "Dream",
  "Other",
];

export const emotionTagsList = [
  "Happy",
  "Sad",
  "Anxious",
  "Excited",
  "Peaceful",
  "Angry",
  "Grateful",
  "Nostalgic",
];
