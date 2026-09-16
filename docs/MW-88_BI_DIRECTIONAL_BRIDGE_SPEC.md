# 🌉 Architectural Specification: Milestone MW-88 The Bi-Directional Memory Bridge

**Initiative:** MW-88 The Bi-Directional Memory Bridge ("Armchair Capture, Cinema Polish")  
**Target Routes:** `/studio/fireside`, `/studio`, `/studio/production/[id]`  
**Author:** Antigravity (Station 1: The Lead Architect)  
**Constitutional Governance:** `C:\Users\home\studio\.agents\AGENTS.md` (Rules 5, 7, 8, 20, 26, 37)  
**Canonical Curriculum Anchor:** `C:\Users\home\studio\src\lib\curriculum\masterStoryStructure.ts`  
**Shared Data Contract:** `C:\Users\home\studio\src\types\curriculum.ts`  
**Grounding Vaults:**
- 📐 Systems Architecture & Engineering Vault
- 🎧 Storyteller Care & White-Glove Support Vault

---

## 1. Executive Summary & The Ergonomic Bridge Thesis

### 1.1 The Core Product Thesis: "Armchair Capture, Cinema Polish"
The Memory Weaver platform unifies two distinct physical operating environments around a single, immutable narrative truth:
1. **The Storyteller's Sanctuary (Mobile Fireside — `/studio/fireside`):** An elderly narrator (parent or grandparent aged 65–85+) sits comfortably in an armchair or couch with a smartphone. They speak intimate, unhurried memories into a warm, low-cognitive-load interface featuring single-card prompt sparks, an oversized 88px tactile recording button, and native rear-camera scanning for vintage family album photos.
2. **The Family Producer's Flight Deck (Desktop Soundstage — `/studio/production/[id]`):** An adult child, grandchild, or tech-confident narrator sits at a workstation desk on a PC, Mac, or iPad Pro. They command the 6-Part curriculum matrix, polish the auto-transcription in the conversational Scriptorium, layer orchestral scores (528Hz Solfeggio Triads), apply Ken Burns pan/zoom to scanned photographs, colour grade the master reel, and render a 2.39:1 widescreen cinema heirloom.

### 1.2 The Bi-Directional Handshake Problem
Without a deterministic architectural bridge, these two surfaces risk becoming disconnected silos:
- If a scene is mastered on desktop, an elder opening their phone could become confused by empty prompts or accidentally overwrite the master reel.
- If an elder records a 3-minute spoken memory on their phone, the desktop soundstage must not force the family director to manually recreate the script, re-type prompts, or upload raw files.

**Milestone MW-88 resolves this by establishing an automated, bi-directional memory bridge linked via canonical `sceneId`s.**

### 1.3 Constitutional Non-Degradation (Rule 7)
All bridge components and hooks are purely additive. The protected soundstage files (`C:\Users\home\studio\src\components\studio\SoloStage.tsx` and `ProductionDeckContainer.tsx`) remain strictly untouched. Preloaded mobile take ingestion is executed non-invasively through upstream prop passing and contextual wrapper banners.

---

## 2. Unified Data Schema Contract & Multi-Take Schema

### 2.1 The Root Schema Contract (`src/types/curriculum.ts`)
The bi-directional state bridge is governed by `UnifiedCurriculumMemory`:

```typescript
export interface UnifiedCurriculumMemory {
  id: string;                               // Unique Memoir Document UUID
  userId: string;                           // Firebase Auth UID
  sceneId: string;                          // Canonical Scene ID (e.g. "part-1-scene-2")
  partNumber: number;                       // 1 through 6
  sceneNumber: number;                      // Scene sequence index
  sceneTitle: string;                       // "The House I Grew Up In"
  originSurface: OriginSurface;             // "fireside_mobile" | "soundstage_desktop"
  currentStatus: SceneCaptureStatus;        // "locked" | "ready_for_action" | "captured" | "mastered"
  actsCompleted: ActIdentifier[];           // ["act1", "act2", "act3"]
  smartLandingTarget: ActIdentifier;        // "act3" (Director's Review)
  prose: string;                            // Polished narrative text from Scriptorium
  originalHook?: string;                    // Spoken audio hook
  sensorySparks?: string[];                 // Extracted sensory details (e.g. "rain on tin roof")
  transcriptionText?: string;               // Speech-to-text transcript
  takes: MemoirTake[];                      // Multi-take stack across mobile and desktop
  activeTakeId: string;                     // Pointer to active/preferred take
  photos: HeirloomPhotoAttachment[];        // Digitised vintage album prints
  directorialPolish: DirectorialPolishMetadata; // Orchestral score, Ken Burns, colour grading
  bonusNotes: BonusMemoryNote[];            // Additive mobile notes preserving master reel
  createdAt: string;                        // ISO 8601 string
  lastModified: string;                     // ISO 8601 string
}
```

### 2.2 Multi-Take Stack Architecture (`MemoirTake`)
To preserve authentic family history, recording a new take on either device **NEVER destroys or overwrites previous takes**:

```typescript
export interface MemoirTake {
  id: string;                               // "take_mobile_01", "take_desktop_02"
  takeNumber: number;                       // Sequential take number
  source: 'fireside_mobile' | 'soundstage_desktop';
  mediaMode: 'audio' | 'video';
  mediaUrl: string;                         // Cloud Storage public stream URL
  storagePath: string;                      // "/users/{uid}/memoirs/{id}/takes/take_01.webm"
  durationSeconds: number;
  createdAt: string;
  waveformRms?: number[];                   // Pre-computed audio peaks for 0ms scrubbers
  resolution?: string;                      // "720p", "1080p", "4k"
  codec?: string;                           // "video/webm;codecs=vp8,opus"
  label: string;                            // "Take 1 (Fireside Mobile)"
  isPreferred: boolean;                     // Active stream mounted in master timeline
}
```

### 2.3 Firestore Collection Topology
All curriculum state is stored under a deterministic hierarchical path:
```text
/users/{uid}/memoirs/{memoirId}/scenes/{sceneId}
├── Document Fields (UnifiedCurriculumMemory)
├── Subcollection: /takes/{takeId}
└── Subcollection: /bonus_notes/{noteId}
```

---

## 3. Scenario A: Desktop Soundstage ➔ Fireside Armchair Studio

When a family producer completes Act III / Act IV in the Desktop Soundstage and publishes the master reel, the mobile Fireside Armchair Studio immediately adapts its presentation:

```text
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE FIRESIDE STUDIO                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🌟 Vault Progress: 3 of 8 Stories Woven                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🎬 Theatrical Master Reel Completed in Soundstage ✓     │ │
│ │ Scene 1: "Child of Two Worlds"                          │ │
│ │                                                         │ │
│ │ ⏱️ Duration: 3m 42s   📷 Photos: 4 Scanned              │ │
│ │ 🎼 Score: 528Hz Solfeggio Strings (Warm Amber)          │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🍿 [ Watch Theatrical Reel ]                        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ➕ [ Add Bonus Memory Note / Photo ]                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Celebratory Completed Card State
- **Golden Laurel Wreath Badge:** `[ 🎬 Theatrical Master Reel Completed in Soundstage ✓ ]` rendered in glowing amber (`#F59E0B`) with subtle obsidian border glow.
- **Summary Metrics HUD:** Displays duration, number of scanned heirloom photos, and applied orchestral score title.
- **Master Reel Shield:** The mobile record button is replaced with celebratory action buttons, permanently preventing accidental overwrites of the family's finished masterpiece.

### 3.2 Contextual Mobile Actions
1. **Primary CTA — `[ 🍿 Watch Theatrical Reel ]`:**
   - Opens the dedicated **Mobile Cinema Lightbox Player** (`FiresideCinemaLightbox.tsx`).
   - Renders the rendered 2.39:1 master reel with hardware-accelerated Ken Burns photo pan/zoom and ducked orchestral score.
   - Designed for the elder narrator to re-live their story in their armchair or cast to an Apple TV / Google Cast screen.
2. **Secondary CTA — `[ ➕ Add Bonus Memory Note / Photo ]`:**
   - Triggers an ergonomic bottom-sheet drawer (`BonusMemoryDrawer.tsx`).
   - Allows the elder to record an additive voice note (e.g. *"I remembered Aunt Meena was also there that morning"*) or photograph an extra album print.
   - Appends to `bonusNotes` without modifying the mastered reel video or duration.

### 3.3 Smart Auto-Ingress & Vault Progress HUD
- When the elder opens `/studio/fireside`, the studio hook (`useCurriculumVault.ts`) queries all scenes for the active memoir.
- The single-card carousel automatically scrolls past all completed/mastered scenes and cues the **first unrecorded pending scene** (e.g. auto-advancing to Scene 2: *"The House I Grew Up In"*).
- The sticky top HUD displays real-time vault completion progress: `🌟 Vault Progress: X of Y Stories Woven`.

---

## 4. Scenario B: Fireside Armchair Studio ➔ Desktop Soundstage

When an elder records a take on mobile, the family director opening the scene on desktop experiences **"Smart Landing on Act III, Upstream Hydration in Acts I & II"**:

```text
Desktop URL: /studio/production/{id}?scene=part-1-scene-2

┌────────────────────────────────────────────────────────────────────────┐
│ 📱 Spoken memories and vintage photos from Fireside have preloaded     │
│ this scene. You are in Act III to apply cinematic score and colour     │
│ grading, or you can step back into Act I or II to refine the script    │
│ or record an additional take.                                          │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┬──────────────────────────────────────────────┐
│ ACT I: SCRIPTORIUM      │ • Fully hydrated with speech-to-text         │
│ (Refine & Polish)       │ • Sensory sparks pre-populated               │
├─────────────────────────┼──────────────────────────────────────────────┤
│ ACT II: SOUNDSTAGE      │ • Mobile take loaded as Take 1               │
│ (Optional 4K Re-Take)   │ • Teleprompter populated from Act I prose    │
├─────────────────────────┼──────────────────────────────────────────────┤
│ ACT III: REVIEW (FOCUS) │ • Auto-landed target surface                 │
│ (Score & Polish)        │ • Mobile take mounted on playback timeline   │
│                         │ • Album photos queued for Ken Burns          │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### 4.1 Default Focus: Act III Director's Review
- **Immediate Value:** The family director avoids repetitive setup. The mobile audio or video recording is already mounted on the master timeline scrubber (`Master Reel Playback Timeline`).
- **Ken Burns Queue Ready:** Scanned family album photos appear in the Ken Burns photo staging shelf with automated pan/zoom presets applied.
- **Audio Fusion Ready:** The director can immediately audition orchestral scores (e.g. *"528Hz Solfeggio Triad"*) and hear it duck smoothly under the elder's spoken voice.

### 4.2 Upstream Non-Destructive Hydration (Acts I & II)
- **Act I (Scriptorium):**
  * The raw speech-to-text transcript from the mobile recording is loaded into the prose editor.
  * The family director can correct phonetic spelling of ancestral village names (e.g. *"Kutch"*, *"Jalandhar"*), add missing historical dates, and trigger AI Polish (`polishDescription`) to refine the prose while preserving authentic voice.
- **Act II (Soundstage):**
  * The mobile recording is safely mounted as `Take 1 (Fireside Mobile)`.
  * The teleprompter displays the polished prose from Act I.
  * The family can choose to record an optional 4K studio take on an external webcam (`Take 2: 4K Studio Soundstage`). Both takes coexist side-by-side in the take switcher.

### 4.3 Desktop Ingress Notification Banner
- Mounted at the top of the desktop production deck when `originSurface === 'fireside_mobile'` and `actsCompleted.length === 0`:
  ```text
  📱 Spoken memories and vintage photos from Fireside have preloaded this scene. You are in Act III to apply cinematic score and colour grading, or you can step back into Act I or II to refine the script or record an additional take.
  ```
- Styled with high-contrast amber firelight styling (`border-amber-500/30 bg-amber-500/10 text-amber-200`) with instant one-click jump pills: `[ Step Back to Act I ]`, `[ Record 4K Re-Take in Act II ]`, `[ Dismiss ]`.

---

## 5. Plane.so Sprint 5 Ticket Breakdown

Milestone MW-88 is structured into three atomic, sequentially executable execution tickets:

### 🎫 MW-88-T1 (Ticket #251): Unified Curriculum Vault Query Hook
- **File:** `C:\Users\home\studio\src\hooks\useCurriculumVault.ts`
- **Scope:** React hook interfacing with Firestore `/users/{uid}/memoirs/{id}/scenes`. Provides real-time scene maps, multi-take querying, take promotion transactions, and vault progress metrics (`totalScenes`, `capturedScenes`, `masteredScenes`).
- **Deliverable:** Fully typed hook exporting `useCurriculumVault(memoirId)` with Vitest unit tests.

### 🎫 MW-88-T2 (Ticket #252): Fireside Completed Reel Card, Mobile Cinema Lightbox & Bonus Note Trigger
- **Files:**
  * `C:\Users\home\studio\src\components\fireside\FiresideCompletedReelCard.tsx`
  * `C:\Users\home\studio\src\components\fireside\FiresideCinemaLightbox.tsx`
  * `C:\Users\home\studio\src\components\fireside\BonusMemoryDrawer.tsx`
- **Scope:** Renders golden laurel wreath completed card in the mobile carousel, mounts the 2.39:1 cinema lightbox player, and implements the additive bonus note / photo drawer.
- **Deliverable:** Accessible, touch-optimised mobile components conforming to Rule 26 elder ergonomics.

### 🎫 MW-88-T3 (Ticket #253): Desktop Soundstage Ingress Banner, Smart Act III Landing & Upstream Pre-Hydration
- **Files:**
  * `C:\Users\home\studio\src\components\studio\CurriculumIngressBanner.tsx`
  * `C:\Users\home\studio\src\hooks\useCurriculumHydration.ts`
- **Scope:** Ingress banner at top of `/studio/production/[id]`, automated landing on Act III for mobile-origin scenes, and bi-directional hydration of Scriptorium (Act I) and Soundstage Take 1 (Act II).
- **Deliverable:** Zero changes to `SoloStage.tsx` or `ProductionDeckContainer.tsx`. Purely additive wrapper logic.

---

## 6. Quality, Invariants & Verification Matrix

### 6.1 Vitest Unit Testing Shield (`src/test/curriculum_bridge.test.ts`)
- **Test 1 (Multi-Take Promotion):** Assert that adding a new take increments `takeNumber` and preserves previous takes without data loss.
- **Test 2 (Additive Bonus Note):** Assert that appending a bonus note does not alter `masterReelUrl` or `masterReelDuration`.
- **Test 3 (Smart Landing Target Resolver):** Assert that a scene with `originSurface === 'fireside_mobile'` and empty `actsCompleted` returns `smartLandingTarget === 'act3'`.
- **Test 4 (Vault Progress Calculation):** Assert that 3 captured scenes out of 8 total scenes calculates `progressPercentage === 37.5%`.

### 6.2 Native Playwright Responsive Testing Suite
- **Mobile Viewport (360×740px):** Verify that completed card displays laurel badge, lightbox opens full-screen, and zero horizontal scroll exists (`scrollWidth <= clientWidth`).
- **Desktop Viewport (1440×900px):** Verify that Ingress Banner renders above Act III with functioning navigation jump pills.

---

## 7. Phased Implementation Roadmap

```text
┌──────────────────────────────────────────────────────────────┐
│ SPRINT 5: MILESTONE MW-88 THE BI-DIRECTIONAL MEMORY BRIDGE   │
├──────────────────────────────────────────────────────────────┤
│ ✅ MW-88: Architecture Specification & Schema Contracts      │
│ ⏳ MW-88-T1: Unified Curriculum Vault Query Hook             │
│ ⏳ MW-88-T2: Fireside Completed Reel Card & Cinema Lightbox  │
│ ⏳ MW-88-T3: Desktop Ingress Banner & Smart Act III Landing  │
│ ⏳ MW-88-T4: Vitest Invariant Suite & Staging Verification   │
└──────────────────────────────────────────────────────────────┘
```
