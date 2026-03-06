
export interface Memory {
  id: string;
  promptId?: string, 
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

export interface User {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    bio?: string;
    createdAt: any;
    updatedAt: any;
    hostPassStatus?: 'not_started' | 'free_host_pass_active' | 'paid_host_pass_active' | 'host_pass_expired';
    flaggedPrompts: string[];
}

export type MemoryCategory = 'personal' | 'family' | 'work' | 'travel';

export interface Prompt {
    id: string;
    text: {
      en: string;
      gu: string;
    };
}
  
export interface PromptGroup {
    id: string;
    title: {
      en: string;
      gu: string;
    };
    prompts: Prompt[];
}
