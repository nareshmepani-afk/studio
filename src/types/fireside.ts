/**
 * 🎙️ Fireside Voice Studio Domain Types & Ergonomic Constants
 *
 * Milestone: MW-87 (Ticket #245 / MW-244)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics)
 */

// ---------------------------------------------------------------------------
// 1. Language & Locale Definitions
// ---------------------------------------------------------------------------

export type FiresideLanguage = 'en' | 'gu' | 'pa' | 'hi';

export const FIRESIDE_LANGUAGE_LABELS: Record<FiresideLanguage, string> = {
  en: 'English',
  gu: 'ગુજરાતી (Gujarati)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  hi: 'हिन्दी (Hindi)',
};

// ---------------------------------------------------------------------------
// 2. Elder Touch Targets & Ergonomic Constants (Rule 26)
// ---------------------------------------------------------------------------

export const FIRESIDE_TOUCH_TARGETS = {
  /** Minimum touch envelope for buttons and primary toggles */
  MIN_BUTTON_HEIGHT_PX: 56,
  /** Oversized circular touch boundary for the central record button */
  RECORD_BUTTON_SIZE_PX: 88,
  /** Secondary action touch diameter (pause, retake, delete) */
  SECONDARY_BUTTON_SIZE_PX: 56,
  /** Minimum high-contrast text size for story prompts and status labels */
  MIN_FONT_SIZE_PX: 18,
  /** Obsidian matte background token */
  OBSIDIAN_BG: '#0A0A0A',
  /** Warm amber firelight accent token */
  AMBER_ACCENT: '#F59E0B',
  /** Muted ember background for card surfaces */
  EMBER_SURFACE: '#171717',
} as const;

export const FIRESIDE_HAPTIC_PATTERNS = {
  /** Start recording cadence (two crisp pulses) */
  START: [40, 60, 40],
  /** Pause recording cadence (single brief tap) */
  PAUSE: [30],
  /** Stop and save cadence (ascending confirmation pulse) */
  STOP: [60, 80, 100],
  /** Photo shutter digitisation pulse */
  PHOTO: [50],
} as const;

// ---------------------------------------------------------------------------
// 3. Audio Recording & Web Audio Pipeline Interfaces
// ---------------------------------------------------------------------------

export type RecordingLifecycleStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'saved'
  | 'error';

export type MicrophonePermissionState = 'prompt' | 'granted' | 'denied';

export interface FiresideAudioMetrics {
  durationSeconds: number;
  sampleRate: number;
  channelCount: number;
  averageRms: number;
  peakDecibels: number;
  codec: string;
}

export interface FiresideRecordingState {
  status: RecordingLifecycleStatus;
  durationSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  permissionState: MicrophonePermissionState;
  wakeLockActive: boolean;
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// 4. Physical Album Photo Digitisation
// ---------------------------------------------------------------------------

export type PhotoUploadStatus = 'pending' | 'uploading' | 'synced' | 'failed';

export interface HeirloomPhotoAttachment {
  id: string;
  localUri: string; // blob: or data: URL for optimistic preview
  storageUrl: string | null; // Remote Firebase Storage URL once synchronised
  storagePath?: string; // e.g. /users/{uid}/fireside/{draftId}/photos/{photoId}.jpg
  caption: string;
  capturedAt: string; // ISO 8601 string
  originalFilename: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  aspectRatio: number;
  rotation: number; // 0, 90, 180, 270 degrees
  uploadStatus: PhotoUploadStatus;
}

// ---------------------------------------------------------------------------
// 5. Single-Card Prompt Carousel (MW-245)
// ---------------------------------------------------------------------------

export type PromptCategory =
  | 'childhood'
  | 'roots'
  | 'love'
  | 'wisdom'
  | 'traditions'
  | 'lessons'
  | 'humour'
  | 'legacy';

export interface FiresidePromptSpark {
  id: string;
  category: PromptCategory;
  title: string;
  sparks: Record<FiresideLanguage, string>;
  followUpQuestions: Record<FiresideLanguage, string[]>;
  recommendedPhotoPrompt: Record<FiresideLanguage, string>;
}

// ---------------------------------------------------------------------------
// 6. Draft Synchronisation & Persistence (MW-248)
// ---------------------------------------------------------------------------

export type DraftSyncState =
  | 'local_only'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'error';

export interface FiresideMemoryDraft {
  id: string;
  userId: string;
  title: string;
  promptId: string | null;
  promptText: string;
  promptLanguage: FiresideLanguage;
  audioMetrics: FiresideAudioMetrics;
  audioStoragePath: string | null;
  audioStorageUrl: string | null;
  photos: HeirloomPhotoAttachment[];
  transcriptionText: string | null;
  prose: string;
  notes: string;
  syncState: DraftSyncState;
  createdAt: string;
  lastModified: string;
}

// ---------------------------------------------------------------------------
// 7. IndexedDB Vault Cache Schema
// ---------------------------------------------------------------------------

export interface FiresideLocalVaultRecord {
  draftId: string;
  userId: string;
  audioBlob: Blob | null;
  draft: FiresideMemoryDraft;
  lastCachedAt: number; // Unix timestamp in ms
  uploadAcknowledged: boolean;
}
