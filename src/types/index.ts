
export interface Memory {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  category?: MemoryCategory;
  location?: string;
  emotionTags?: string[];
  memoryDate?: string;
  createdAt: any;
  mediaAttachments?: {
    url: string;
    type: string;
  }[];
}

export type MemoryCategory = 'personal' | 'family' | 'work' | 'travel';
