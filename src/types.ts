export type PageProps<T = {}> = {
  params: T;
  searchParams: { [key: string]: string | string[] | undefined };
};

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

export interface MediaAttachment {
  url: string;
  type: string; // 'image' | 'video' | 'audio'
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
  thumbnailUrl?: string;
  size?: number;
}

export type Memory = {
  id: string;
  userId: string;
  promptId?: string;
  title: string;
  description: string;
  videoUrl: string;
  category: string;
  location: string;
  emotionTags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  mediaAttachments?: MediaAttachment[];
};

export type ActionResponse = {
  success: boolean;
  message: string;
};

export type Prompt = {
  id: string;
  title: string;
  description: string;
  text: { en: string; gu: string };
  isFlaggedForReuse?: boolean;
  subPrompts?: Prompt[];
};

export type PromptGroup = {
  id: string;
  title: { en: string; gu: string };
  prompts: Prompt[];
};

export type User = {
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
  hostPassStatus?: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  freeHostPassActivatedDate?: string;
  paidHostPassExpiryDate?: string;
  storageUsedBytes?: number;
};

export type UserMode = 'viewer' | 'editor' | 'admin' | 'host' | 'guest';
