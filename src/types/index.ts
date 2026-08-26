/**
 * @fileOverview Centralized type definitions for the Memory Weaver application.
 * This is the single source of truth to prevent module resolution conflicts.
 */

export * from './roles';

export interface MediaAttachment {
  url: string;
  type: string; // 'image' | 'video' | 'audio'
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
  thumbnailUrl?: string;
  size?: number;
}

export type CatalystType = 'aroma' | 'soundscape' | 'visual' | 'polish' | 'clarity';

export interface Catalyst {
  id: string;
  type: CatalystType;
  value: string; // The user-defined content
  timestamp: number;
}

export interface ScriptBlock {
  id: string; // UUID for React rendering and drag-drop
  type: 'hook' | 'beat' | 'bridge'; // Defines styling and AI importance
  text: string; // The actual prose
  catalysts: Catalyst[]; // Limited to 3 via logic
  analysis?: {
    sentiment: number; // -1 to 1
    pace: 'slow' | 'balanced' | 'fast';
  };
}

export interface StageDirection {
  type: 'visual' | 'audio' | 'beat';
  content: string;
  timecode: string;
}

export interface BeatSheetItem {
  beat: string;
  timing: string;
  visual: string;
}

export interface StructuredScript {
  cleanScript: string;
  stageDirections: StageDirection[];
  beatSheet: string[];
  generatedSoundtrackUrl?: string;
  preFlightBrief?: {
    sensoryAnchors: string[];
    vocalInstructions: string[];
    soundscapeIntegration: string;
    heroMoment: string;
  };
}

export type TimeframeScope = 'Moment' | 'Year' | 'Generation' | 'Legacy';

export interface Memory {
  id: string;
  userId: string;
  promptId?: string;
  title: string;
  description: string;
  category: string | MemoryCategory;
  location: string;
  city?: string;
  country?: string;
  videoUrl?: string;
  emotionTags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  status?: 'draft' | 'pre-release' | 'published' | 'completed';
  mediaAttachments?: MediaAttachment[];
  imageUrl?: string;
  isLegacy?: boolean;
  sensoryConfig?: SensoryPromptTemplate[];
  chapterTitle?: string;
  usePoster?: boolean;
  posterStyle?: 'cinematic' | 'modern' | 'minimalist';
  posterImageUrl?: string;
  credits?: {
    director?: string;
    producer?: string;
    starring?: string;
    billingLine?: string; // Condensed small-caps credits line
  };
  dateComponents?: {
    day?: string;
    month?: string;
    year?: string;
  };
  timeframeScope?: TimeframeScope;
  narratorAgeAtTime?: number;
  durationQuantity?: number;
  durationUnit?: 'days' | 'months' | 'years';
  prose?: string;
  scriptBlocks?: ScriptBlock[]; // NLE architecture array
  content?: string;
  modality?: 'pen' | 'voice' | null;
  tags?: string[];
  sensory?: Record<string, string>;
  aiTakes?: { poetic?: string; direct?: string; nostalgic?: string; master?: string } | null;
  productionStage?: number;
  trimStart?: number;
  trimEnd?: number;
  cameraActive?: boolean;
  videoStory?: string; // Fused narrative from Hook + Transcript
  guestViewCount?: number;
  sharedWith?: string[]; // UIDs of users who claimed access via share link
  vaultTier?: 'free' | 'host_pass' | 'lifetime_vault';
  passcode?: string;
  optionalPasscode?: string;
  hlsMasterPlaylistUrl?: string;
  atmosphericSuggestions?: string[]; // Script Supervisor enhancements
  emotionalBeats?: {
    time: number;
    label: string;
    color: string;
    description: string;
  }[];
  structuredScript?: StructuredScript | null;
  originalHook?: string;
  scriptHistory?: {
    timestamp: string;
    text: string;
    visionType: string;
    visionLabel?: string;
  }[];
  isProductionLocked?: boolean;
  activeVision?: 'soul' | 'sensory' | 'cinematic' | string;
  activeVisionLabel?: string;
  productionTakes?: any[]; // The archived alternate drafts
  previousDraftState?: string; // 1-Prior-Version Instant Undo Fallback Slot (MW-34)
  isReviewing?: boolean;
  fusionManifest?: FusionManifest;
}

export type PremiereMode = 'fusion' | 'raw';

export interface FusionManifest {
  rawVideoUrl: string;
  videoStory: string;
  posterImageUrl?: string;
  soundtrackUrl?: string;
  opticsProfile?: 'vintage' | 'noir' | 'vibrant' | 'sepia' | 'natural' | string;
  duckingVolume?: number;
  credits?: {
    narrator?: string;
    director?: string;
    producedAt?: string;
  };
}

export interface TranscriptSegment {
  startTime: number; // In seconds
  endTime: number;
  text: string;
  speaker?: string;
}

export interface Chapter {
  startTime: number;
  title: string;
  description: string;
  type: 'hook' | 'incident' | 'struggle' | 'climax' | 'resolution';
}

export interface DirectorsNotepad {
  transcript: TranscriptSegment[];
  emotionalBeats: {
    time: number;
    label: string;
    color: string;
    description: string;
  }[];
  entities: {
    name: string;
    type: string;
    mention: string;
  }[];
  directorNotes: string;
  videoStory?: string; // Fused narrative synthesized from transcript and hook
  suggestedChapters: Chapter[];
  analyzedAt?: string;
}

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

export interface SensoryPromptTemplate {
  id: string;
  label: string;
  placeholder: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  text: { en: string; gu: string };
  isFlaggedForReuse?: boolean;
  subPrompts?: Prompt[];
  sensoryPrompts?: SensoryPromptTemplate[];
}

export interface LocalizedPromptText {
  title: string;
  description: string;
  sensoryCues?: string[];
}

export interface LocalizedPrompt {
  id: string;
  chapterId: string;
  eraCoordinates?: string;
  en: LocalizedPromptText;
  native?: LocalizedPromptText & {
    languageCode: 'gu' | 'pa' | 'hi' | 'ur' | 'es' | 'zh';
    scriptName: string;
  };
  transliteration?: {
    title: string;
    description: string;
  };
}

export interface PromptGroup {
  id: string;
  title: { en: string; gu: string };
  prompts: Prompt[];
}

export interface StorageQuota {
  total: number;
  used: number;
}

export interface Contact {
  id: string;
  email: string;
  name?: string;
  lastUsedAt: any; // Firestore Timestamp
}

export interface UserAccount {
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
  directorPassStatus?: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  freeDirectorPassActivatedDate?: string;
  paidDirectorPassExpiryDate?: string;
  storageUsedBytes?: number;
  storageQuota?: StorageQuota;
  vaultQuotaGb?: number;
  flaggedPrompts?: string[];
  isPremium?: boolean;
  membershipTier?: 'sandbox' | 'director_complimentary' | 'director_monthly' | 'generational_vault';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  lastPaymentDate?: string;
}

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export interface StoryRequest {
  id: string;
  promptId: string;
  promptTitle?: string; // Unified name for the requested story
  guestName: string;
  guestEmail: string;
  directorId: string;
  status: 'pending' | 'fulfilled' | 'ignored';
  timestamp: any; // Firestore timestamp
}
