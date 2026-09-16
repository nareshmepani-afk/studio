/**
 * 🏛️ Unified Curriculum & Multi-Take Memory Contracts
 *
 * Milestone: MW-88 The Bi-Directional Memory Bridge ("Armchair Capture, Cinema Polish")
 * Canonical Anchor: C:\Users\home\studio\src\lib\curriculum\masterStoryStructure.ts
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Universal Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics)
 */

import { HeirloomPhotoAttachment } from './fireside';
import { SceneCaptureStatus } from '@/lib/curriculum/masterStoryStructure';

// ---------------------------------------------------------------------------
// 1. Origin Surfaces & Take Sources
// ---------------------------------------------------------------------------

export type OriginSurface = 'fireside_mobile' | 'soundstage_desktop';

export type MemoirTakeSource = 'fireside_mobile' | 'soundstage_desktop';

export type ActIdentifier = 'act1' | 'act2' | 'act3' | 'act4';

// ---------------------------------------------------------------------------
// 2. Directorial Polish & Cinema Presentation Metadata
// ---------------------------------------------------------------------------

export type ColourGradePreset =
  | 'natural'
  | 'warm_amber'
  | 'vintage_sepia'
  | 'cinematic_teal'
  | 'monochrome_noir';

export type KenBurnsIntensity = 'subtle' | 'standard' | 'dramatic';

export type VocalClarityLevel = 'natural' | 'studio_boost' | 'broadcast';

export interface DirectorialPolishMetadata {
  /** Applied musical score ID from acoustic library */
  orchestralScoreId?: string;
  /** Human-readable score title (e.g. "528Hz Solfeggio Strings") */
  orchestralScoreTitle?: string;
  /** Score background ducking volume (0.0 to 1.0) */
  orchestralScoreVolume: number;
  /** Applied colour grading filter */
  colourGradePreset: ColourGradePreset;
  /** Ken Burns pan/zoom on vintage photo attachments */
  kenBurnsEnabled: boolean;
  /** Motion intensity for photo animations */
  kenBurnsIntensity: KenBurnsIntensity;
  /** Server-side or Web Audio dynamic noise cancellation */
  audioNoiseReductionEnabled: boolean;
  /** Spoken monologue vocal EQ enhancement */
  vocalClarityLevel: VocalClarityLevel;
  /** Cloud Storage URL of the rendered 2.39:1 master reel */
  masterReelUrl?: string;
  /** Duration in seconds of the rendered master reel */
  masterReelDuration?: number;
  /** ISO timestamp when master reel was rendered and verified */
  masteredAt?: string;
}

// ---------------------------------------------------------------------------
// 3. Multi-Take Architecture
// ---------------------------------------------------------------------------

export interface MemoirTake {
  id: string; // e.g. "take_mobile_01", "take_desktop_02"
  takeNumber: number;
  source: MemoirTakeSource;
  mediaMode: 'audio' | 'video';
  mediaUrl: string;
  storagePath: string;
  durationSeconds: number;
  createdAt: string; // ISO 8601 string
  waveformRms?: number[];
  resolution?: string; // "720p", "1080p", "4k"
  codec?: string;
  label: string; // e.g. "Take 1 (Fireside Mobile)", "Take 2 (4K Soundstage)"
  /** Indicates whether this take is the designated master audio/video stream */
  isPreferred: boolean;
}

// ---------------------------------------------------------------------------
// 4. Additive Bonus Notes & Album Attachments
// ---------------------------------------------------------------------------

export interface BonusMemoryNote {
  id: string;
  authorName: string;
  authorRole: 'storyteller' | 'producer' | 'family_member';
  text?: string;
  audioUrl?: string;
  photoUrl?: string;
  createdAt: string; // ISO 8601 string
}

// ---------------------------------------------------------------------------
// 5. Unified Curriculum Memory Contract (The Shared Cloud Spine)
// ---------------------------------------------------------------------------

export interface UnifiedCurriculumMemory {
  /** Firestore Document ID (e.g. memoir draft UUID) */
  id: string;
  /** User UID owning the memoir */
  userId: string;
  /** Canonical curriculum scene ID (e.g. "part-1-scene-2") */
  sceneId: string;
  /** Curriculum Part number (1 to 6) */
  partNumber: number;
  /** Scene index within part */
  sceneNumber: number;
  /** Human-readable scene title (e.g. "The House I Grew Up In") */
  sceneTitle: string;
  /** Primary origin surface where initial capture occurred */
  originSurface: OriginSurface;
  /** Current state machine status in the curriculum */
  currentStatus: SceneCaptureStatus;
  /** List of soundstage acts that have been visited or completed */
  actsCompleted: ActIdentifier[];
  /** Intelligent routing target when opening in Desktop Soundstage */
  smartLandingTarget: ActIdentifier;
  /** User or AI-polished prose text from Act I Scriptorium */
  prose: string;
  /** Original user spoken prompt or hook */
  originalHook?: string;
  /** Sensory catalysts extracted during speech synthesis */
  sensorySparks?: string[];
  /** Raw or edited speech-to-text transcript */
  transcriptionText?: string;
  /** Stack of all recorded takes across mobile and desktop */
  takes: MemoirTake[];
  /** Pointer to currently selected active take ID */
  activeTakeId: string;
  /** Digitised vintage photo attachments from physical album scanner */
  photos: HeirloomPhotoAttachment[];
  /** Cinema-grade directorial finishing parameters */
  directorialPolish: DirectorialPolishMetadata;
  /** Non-destructive additive notes added from mobile after soundstage master */
  bonusNotes: BonusMemoryNote[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last modification timestamp */
  lastModified: string;
}

// ---------------------------------------------------------------------------
// 6. Default Fallback Constructors & Helpers
// ---------------------------------------------------------------------------

export const DEFAULT_DIRECTORIAL_POLISH: DirectorialPolishMetadata = {
  orchestralScoreVolume: 0.25,
  colourGradePreset: 'warm_amber',
  kenBurnsEnabled: true,
  kenBurnsIntensity: 'standard',
  audioNoiseReductionEnabled: true,
  vocalClarityLevel: 'studio_boost',
};

/**
 * Creates an empty initial UnifiedCurriculumMemory skeleton
 */
export function createEmptyCurriculumMemory(params: {
  id: string;
  userId: string;
  sceneId: string;
  partNumber: number;
  sceneNumber: number;
  sceneTitle: string;
  originSurface: OriginSurface;
}): UnifiedCurriculumMemory {
  const now = new Date().toISOString();
  return {
    id: params.id,
    userId: params.userId,
    sceneId: params.sceneId,
    partNumber: params.partNumber,
    sceneNumber: params.sceneNumber,
    sceneTitle: params.sceneTitle,
    originSurface: params.originSurface,
    currentStatus: 'ready_for_action',
    actsCompleted: [],
    smartLandingTarget: 'act1',
    prose: '',
    takes: [],
    activeTakeId: '',
    photos: [],
    directorialPolish: { ...DEFAULT_DIRECTORIAL_POLISH },
    bonusNotes: [],
    createdAt: now,
    lastModified: now,
  };
}
