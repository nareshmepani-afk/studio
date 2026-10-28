# Architectural RFC-MW-156: The Living Chronicles (Diary Studio) & Multi-Format Publishing Foundry

- **RFC Reference:** `RFC-MW-156`
- **Roadmap Epic:** `EPIC-MW-V2-001` (Milestone v2.0 Backlog)
- **Pre-Wiring Audit Reference:** `AUDIT-MW-147` (Zero-Blob Persistence Guard & Collection-Parameterized Storage Plumbing)
- **Authoring Team:** Lead Architecture (Gemini), Creative Director (Naresh), & Chat 0 (Mission Control Dispatch Brain)
- **Status:** RATIFIED ROADMAP SPECIFICATION (v2.0 Architecture / v1.0 Zero-Cost Storage Pre-Wiring)
- **Governing Rules:** Rule 7 (Universal Non-Degradation), Rule 11 (Spoken Monologue Integrity), Rule 12 (Zero-Latency Optimistic UI), Rule 14 (Story Hook & Zero-Blob Invariant), Rule 20 (UK English Orthography), Rule 26 (Elder Ergonomics), Rule 35 (Indic Unicode PDF Subsets), Rule 49.6 (Strict Relay Gate), Rule 51 (Explicit Provenance)

---

## 1. Executive Summary & The "Two Chambers" Architectural Model

Memory Weaver v1.0 establishes **The Heirloom Folio**: a curated, 31-scene autobiographical masterwork structured across five life acts (`Part I: Roots` through `Part V: Wisdom & Legacy`). However, human memory operates across two distinct temporal rhythms:

1. **Retrospective Life Synthesis (The Curated Masterwork):** Deep, reflective storytelling across life chapters.
2. **Continuous Living Dispatches (The Daily & Weekly Stream):** Spontaneous reflections, travel dispatches, seasonal family milestones, grandchildren's first words, kitchen recipes, and quiet evening thoughts.

To honour both rhythms without polluting or destabilising the 31-scene Filofax architecture, Memory Weaver v2.0 introduces **The "Two Chambers" Vault Architecture**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY WEAVER GENERATIONAL VAULT (v2.0)                          │
├────────────────────────────────────────────┬─────────────────────────────────────────────┤
│        🏛️ CHAMBER I: THE HEIRLOOM FOLIO    │     📓 CHAMBER II: THE LIVING CHRONICLES    │
│           (The Curated Autobiography)      │        (The Continuous Diary Studio)        │
├────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ • Fixed 31-Scene Canonical Spine           │ • Unbounded Chronological & Thematic Stream │
│ • 5-Act Production Soundstage & Fireside   │ • Zero-Friction Spontaneous Capture         │
│ • Structured Prompts (p1..p31)             │ • Ambient Two-Layer Semantic Tagging        │
│ • Firestore: users/{uid}/memories/{docId}  │ • Firestore: users/{uid}/chronicles/{logId} │
│ • Output: Master Documentary & Folio Box   │ • Output: 4-Way Publishing Foundry          │
└────────────────────────────────────────────┴──────────────────────┬──────────────────────┘
                                                                    │
                                    [ ✨ Promote / Distil Cluster ]  │
                                    ◄───────────────────────────────┘
                         (Foundry Output 1 feeds curated drafts into Chamber I)
```

---

## 2. Strict Subcollection Isolation & Database Schema

### 2.1 The Subcollection Isolation Invariant
To guarantee zero regression to v1.0 studio queries, Filofax spine counters, and scene correlation shields (`BUG-MW-143` / `TOOL-MW-145`):
- **Chamber I (Heirloom Folio):** Persists exclusively to `users/{uid}/memories/{memoryId}`.
- **Chamber II (Living Chronicles):** Persists exclusively to `users/{uid}/chronicles/{logId}`.
- **Hard Prohibition:** Chronicle entries MUST NEVER be written into `users/{uid}/memories/`. No `promptId` (`p1`–`p31`) is required for a Chronicle entry, eliminating any risk of shadow documents or split-brain scene collisions.

### 2.2 Canonical `ChronicleEntry` Schema
```typescript
export type ChronicleModality = 'voice' | 'video' | 'prose' | 'photo_dispatch';

export type ChronicleSparkTag =
  | 'daily_reflection'
  | 'expedition_travel'
  | 'family_milestone'
  | 'heritage_recipe'
  | 'letter_to_future'
  | 'quiet_observation'
  | 'custom';

export interface ChronicleSemanticMetadata {
  /** Silent AI classification status — never blocks synchronous capture (Rule 12) */
  classificationStatus: 'pending' | 'completed' | 'skipped' | 'failed';
  /** Extracted people mentioned in the entry (e.g. ["Aarav", "Grandmother Savitri"]) */
  peopleMentioned: string[];
  /** Geographic or domestic places identified (e.g. ["Ahmedabad", "Kew Gardens"]) */
  locations: string[];
  /** Dominant emotional cadence (e.g. "gratitude", "nostalgic_warmth", "humour") */
  emotionalCadence?: string;
  /** Inferred life era or year reference if retrospective */
  inferredEra?: string;
  /** Thematic cluster slugs used by the Publishing Foundry */
  themeClusters: string[];
  /** ISO timestamp of background indexing completion */
  classifiedAt?: string;
}

export interface ChronicleEntry {
  id: string;
  userId: string;

  /** Core Narrative Content (lang="en-GB" | "gu-IN" | "pa-IN" | "hi-IN" per Rule 20.2) */
  title: string;
  prose: string;
  locale: 'en-GB' | 'gu-IN' | 'pa-IN' | 'hi-IN';
  modality: ChronicleModality;

  /** Permanent Cloud Storage HTTPS URLs — blob: URLs strictly forbidden (Rule 14) */
  audioUrl?: string;
  audioStoragePath?: string;
  audioDurationSeconds?: number;
  videoUrl?: string;
  videoStoragePath?: string;
  videoDurationSeconds?: number;
  photos: Array<{
    id: string;
    storagePath: string;
    storageUrl: string;
    caption?: string;
    capturedAt?: string;
  }>;

  /** Layer 1: Optional Narrator-Selected Upfront Spark Tags */
  sparkTags: ChronicleSparkTag[];
  customUserTags: string[];

  /** Layer 2: Silent Background Semantic AI Classification */
  semanticMeta: ChronicleSemanticMetadata;

  /** Publishing Foundry Lineage */
  promotedToFolioMemoryId?: string;
  includedInCodexIds: string[];

  /** Temporal Coordinates */
  recordedDate: string; // ISO-8601 date of the lived moment
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Firestore Security Rules & Composite Indexes
- **Security Rules (`firestore.rules`):**
  ```javascript
  match /users/{userId}/chronicles/{logId} {
    allow read: if request.auth != null && (
      request.auth.uid == userId ||
      isCollaborator(userId, request.auth.uid) ||
      isAdmin(request.auth)
    );
    // Write permitted when vault entitlement is active; Read-Only Vault preserves read forever
    allow create, update, delete: if request.auth != null
      && request.auth.uid == userId
      && !isBlobUrlPresent(request.resource.data);
  }
  ```
- **Composite Indexes (`firestore.indexes.json`):**
  1. `userId ASC, recordedDate DESC` (Primary chronological timeline stream).
  2. `userId ASC, sparkTags ARRAY_CONTAINS, recordedDate DESC` (Spark tray filtering).
  3. `userId ASC, semanticMeta.themeClusters ARRAY_CONTAINS, recordedDate DESC` (Foundry compilation queries).

---

## 3. Capture Ergonomics & Ambient Two-Layer Tagging

Elders and busy storytellers abandon traditional journaling apps when forced to fill out taxonomy forms, folders, or mandatory category dropdowns before speaking. The Living Chronicles enforces **Zero-Taxonomy-Friction Capture** via a two-layer ambient architecture:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: OPTIONAL UPFRONT SPARK TRAY (Zero Mandatory Fields — 48px Elder Touch Targets)  │
│ [ 🌿 Daily Reflection ] [ ✈️ Travel Dispatch ] [ 👶 Family Milestone ] [ 🍲 Recipe ]     │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ SYNCHRONOUS CAPTURE & PERSISTENCE (Rule 12: 0ms Optimistic UI + Local Scratchpad)        │
│ • Speak (Voice/Video) or Type (Dual-Layer Canvas, lang="en-GB")                          │
│ • Media uploaded via chunkedAudioUpload.ts -> users/{uid}/chronicles/{logId}/...         │
│ • Firestore write committed with classificationStatus: 'pending'                         │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ (Decoupled Async Event)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: SILENT BACKGROUND SEMANTIC AI CLASSIFIER (Cloud Function / Genkit Worker)       │
│ • Extracts peopleMentioned, locations, emotionalCadence, and themeClusters               │
│ • Enforces Rule 11 (stripScreenplayCues) & Rule 20.3 (UK English Orthography)            │
│ • Patches semanticMeta with classificationStatus: 'completed'                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Layer 1: Optional Spark Tray
- Presents 4–6 tactile, 48px-minimum (`Rule 26`) ambient chips above the recording/writing surface.
- Tapping a spark chip pre-seeds a gentle sensory prompt (e.g. *"What aroma, sound, or small detail made today worth keeping?"*) and appends the tag to `sparkTags[]`.
- Narrators may ignore the tray entirely and immediately press `[ 🎙️ Record Dispatch ]` or begin typing.

### 3.2 Layer 2: Silent Background Semantic AI Classification
- Triggered asynchronously post-save so the narrator never waits on an LLM spinner (`Rule 12`).
- Analyses transcript/prose to populate `semanticMeta` (`peopleMentioned`, `locations`, `themeClusters`, `emotionalCadence`).
- Automatically groups related dispatches over months and years (e.g. *"14 Dispatches mentioning Aarav (2026–2028)"* or *"Summer Journey through Gujarat"*).

---

## 4. The Multi-Format Publishing Foundry (4 Compilation Outputs)

The Publishing Foundry transforms raw, chronological diary dispatches into curated family heirlooms across four distinct mediums:

| Output # | Foundry Format | Target Medium | Architectural Pipeline |
| :--- | :--- | :--- | :--- |
| **01** | **Heirloom Folio Feeder** (*"Promote to Scene"*) | Chamber I (`users/{uid}/memories`) | Synthesises 1–N selected Chronicle entries into a unified first-person spoken monologue (`stripScreenplayCues` per Rule 11) and seeds an Act I Scriptorium draft in a chosen Folio scene (`p1`–`p31`), recording `promotedToFolioMemoryId`. |
| **02** | **Interactive Web Codex** | Private Family Web Reader (`/codex/[codexId]`) | Compiles a themed or date-bounded collection (e.g. *"Our 2027 Autumn in Kyoto"*) into a widescreen editorial web folio with synchronized inline audio waveforms, photo lightboxes, and map pins. |
| **03** | **Printed Hardcover Volume** | Archival Print-Ready PDF (`pdf-lib`) | Generates typeset hardcover book signatures with embedded Noto Sans Indic Unicode subsets (`Rule 35` — zero tofu boxes for Gujarati, Punjabi, Hindi) and scannable golden wax-seal QR codes linking physical pages to spoken audio/video reels. |
| **04** | **Theatrical Audio Book** | Mastered Spoken Anthology (`.m4b` / `.mp3`) | Concatenates selected voice dispatches in chronological or thematic order, normalising loudness (`-16 LUFS`), injecting spoken chapter slates, and layering subtle ambient room-tone crossfades. |

---

## 5. Monetisation, Data Plan Economics & The Read-Only Vault Invariant

### 5.1 Tiered Membership & Expedition Passes
Because Chamber II encourages continuous, multi-year media ingestion (high-definition video dispatches, lossless voice memoirs, and photo galleries), v2.0 introduces sustainable cloud storage and AI compute economics:
- **Heirloom Folio Pass (v1.0 Core):** Covers the complete 31-scene autobiographical Folio and keepsake unboxing suite.
- **Living Chronicles Membership (Annual / Monthly Tier):** Unlocks unlimited Chamber II prose dispatches, tiered monthly high-definition video/voice storage allocation, background semantic indexing, and annual Publishing Foundry compilation credits.
- **Expedition Pass (One-Off Event Pack):** Time-bounded 30-day or 90-day capture & Codex compilation pass for milestone family trips, weddings, or sabbaticals.

### 5.2 The Read-Only Vault Invariant (Unbreakable Ethical Churn Protection)
Memory Weaver holds sacred generational family heritage. Therefore, the platform enforces an immutable constitutional guarantee:
> **The Read-Only Vault Invariant:** If a storyteller's Living Chronicles subscription or Expedition Pass expires or lapses, their vault transitions gracefully to `READ_ONLY_ARCHIVAL` state.
> - **Zero Deletion Guarantee:** Not a single video reel, voice memoir, photo, or prose entry is ever deleted, degraded, or hidden behind a paywall.
> - **Permanent Playback & Export:** The storyteller and their authorised family circle retain 100% viewing, streaming playback, and full GDPR archive download (`ZIP` export) rights in perpetuity.
> - **Graceful Capture Pause:** Only *new* Chamber II media ingestion and *new* Publishing Foundry compilations are paused until membership is renewed.

---

## 6. v1.0 Pre-Wiring Specification (Zero-Cost Hook for `AUDIT-MW-147`)

To ensure that v1.0 hardening (`AUDIT-MW-147`: Zero-Blob Persistence Guard) lays a future-proof foundation for v2.0 without touching any v1.0 UI components, the media storage and persistence helpers must be parameterised with a `targetCollection` discriminator now.

### 6.1 Storage Path Parameterisation (`C:\Users\home\studio\src\lib\media\chunkedAudioUpload.ts`)
Currently, `uploadAudioWithResiliency` (line 43), `uploadPhotosWithResiliency` (line 158), and `uploadVideoWithResiliency` (line 230) hardcode the storage path segment `fireside`:
```typescript
// Current v1.0 Hardcoded Path:
const storagePath = `users/${userId}/fireside/${draftId}/audio.webm`;
```

Under `AUDIT-MW-147`, these helpers must accept an optional `targetCollection` parameter defaulting to `'memories'` (preserving 100% backward compatibility with all existing callers and unit tests):

```typescript
export type VaultCollectionTarget = 'memories' | 'chronicles';

export interface MediaUploadOptions {
  /** Defaults to 'memories' for v1.0 Heirloom Folio; 'chronicles' reserved for v2.0 Diary Studio */
  targetCollection?: VaultCollectionTarget;
  onProgress?: (progressPercent: number) => void;
}
```

- **Storage Bucket Namespace Mapping:**
  - When `targetCollection === 'memories'` (default): preserves existing path `users/${userId}/fireside/${draftId}/...` (zero migration required for existing v1.0 assets).
  - When `targetCollection === 'chronicles'`: routes cleanly to `users/${userId}/chronicles/${draftId}/...`.

### 6.2 Shared Zero-Blob Persistence Guard (`assertZeroBlobUrls`)
In `AUDIT-MW-147`, the client-side Firestore write guard must validate payloads destined for *either* `users/{uid}/memories/{id}` or `users/{uid}/chronicles/{logId}`:
```typescript
export function assertZeroBlobUrls(
  payload: Record<string, unknown>,
  targetCollection: VaultCollectionTarget = 'memories'
): void {
  const urlFields = ['audioUrl', 'videoUrl', 'mediaUrl'] as const;
  for (const field of urlFields) {
    const val = payload[field];
    if (typeof val === 'string' && val.trim().startsWith('blob:')) {
      throw new Error(
        `[ZeroBlobGuard:${targetCollection}] Refusing to persist transient browser ${field} (${val}) to Firestore.`
      );
    }
  }
}
```

This zero-cost hook guarantees that when Chamber II (`users/{uid}/chronicles`) is activated in v2.0, the entire resilient upload, retry backoff, and zero-blob integrity pipeline works out-of-the-box with zero storage refactoring.
