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
  /** Secondary action touch diameter (pause, retake, delete, flip camera) */
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
// 3. Media Mode & FaceTime/WhatsApp Selfie Video Defaults (MW-249 Pre-Architecture)
// ---------------------------------------------------------------------------

export type FiresideMediaMode = 'audio' | 'video';

export const FIRESIDE_VIDEO_DEFAULTS = {
  /** Target resolution for mobile selfie capture */
  TARGET_RESOLUTION: '720p',
  WIDTH: 1280,
  HEIGHT: 720,
  /** Cinematic 24fps target to preserve battery and minimise thermal throttling */
  FRAME_RATE: 24,
  /** Front-facing camera for intimate selfie memo orientation */
  FACING_MODE: 'user' as const,
  /** Fast-sync WhatsApp/FaceTime bitrate cap (900 kbps) for rapid cloud vault uploads */
  MAX_BITRATE_BPS: 900_000,
  /** 1-second chunk time-slicing for instant stop flushing and resilient IndexedDB buffering */
  CHUNK_TIMESLICE_MS: 1000,
  /** Minimum valid recording duration in seconds before saving to vault */
  MIN_RECORDING_SECONDS: 3,
  /** Preferred modern container format */
  CONTAINER_MIME: 'video/webm;codecs=vp8,opus',
  /** Universal iOS/macOS Safari fallback container */
  CONTAINER_FALLBACK_MIME: 'video/mp4',
} as const;

export interface FiresideVideoConstraints {
  width: { ideal: 1280; max: 1280 };
  height: { ideal: 720; max: 720 };
  frameRate: { ideal: 24; max: 30 };
  facingMode: 'user';
}

export interface FiresideVideoMetrics {
  width: number;
  height: number;
  frameRate: number;
  bitrateBps: number;
  codec: string;
  mirrored: boolean; // Selfie mirror transform for natural narrator reassurance
}

// ---------------------------------------------------------------------------
// 4. Audio & Video Recording Lifecycle Interfaces
// ---------------------------------------------------------------------------

export type RecordingLifecycleStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'saved'
  | 'error';

export type MicrophonePermissionState = 'prompt' | 'granted' | 'denied';
export type CameraPermissionState = 'prompt' | 'granted' | 'denied';

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
  mediaMode: FiresideMediaMode;
  durationSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  videoBlob: Blob | null;
  videoUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  permissionState: MicrophonePermissionState;
  cameraPermissionState: CameraPermissionState;
  wakeLockActive: boolean;
  videoMetrics?: FiresideVideoMetrics;
  audioMetrics?: FiresideAudioMetrics;
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// 5. Physical Album Photo Digitisation
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
// 6. Single-Card Prompt Carousel & Story Spine Links (MW-245)
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
  /** Link to shared curriculum scene spine (e.g. "part-1-scene-2") */
  linkedSceneId?: string;
  suggestedMediaMode?: FiresideMediaMode;
}

// ---------------------------------------------------------------------------
// 7. Draft Synchronisation & Master Spine Bridge (MW-248)
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
  /** Linked curriculum scene ID in masterStoryStructure.ts */
  sceneId?: string;
  mediaMode?: FiresideMediaMode;
  promptText: string;
  promptLanguage: FiresideLanguage;
  audioMetrics: FiresideAudioMetrics;
  videoMetrics?: FiresideVideoMetrics;
  audioStoragePath: string | null;
  audioStorageUrl: string | null;
  videoStoragePath?: string | null;
  videoStorageUrl?: string | null;
  photos: HeirloomPhotoAttachment[];
  transcriptionText: string | null;
  prose: string;
  notes: string;
  syncState: DraftSyncState;
  createdAt: string;
  lastModified: string;
}

// ---------------------------------------------------------------------------
// 8. IndexedDB Vault Cache Schema
// ---------------------------------------------------------------------------

export interface FiresideLocalVaultRecord {
  draftId: string;
  userId: string;
  mediaMode?: FiresideMediaMode;
  audioBlob: Blob | null;
  videoBlob?: Blob | null;
  bufferedChunksCount?: number;
  draft: FiresideMemoryDraft;
  lastCachedAt: number; // Unix timestamp in ms
  uploadAcknowledged: boolean;
}
