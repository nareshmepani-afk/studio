# RFC-001: Universal Sensory Narrative Primitives, Video Suite Parity & Desktop Master Architecture

- **Document ID:** RFC-001 (ARCH-MW-133)
- **Status:** DRAFT — PENDING TEAM CONSENSUS (RULE 43 ACTIVE)
- **Target Epic:** Sprint 12 (Universal Core Primitives & Studio Parity)
- **File Target Path:** `C:\Users\home\studio\docs\rfcs\RFC-001-shared-sensory-primitives-and-studio-parity.md`
- **Authors:** Naresh Mepani (Human Lead), Lead Architect (Gemini), Claude (Quality Gatekeeper)
- **Target Implementation Agent:** Chat 2: The Flash Executor
- **Governance Anchor:** Codified Rule 48 in `C:\Users\home\studio\.agents\AGENTS.md`

---

## 1. Executive Summary & Problem Statement

### 1.1 The Context
With the successful rollout of ARCH-MW-127 (Commit `323bf43d`), Memory Weaver achieved a unified 31-scene Single Source of Truth (SSOT) across Desktop Studio (`/studio`) and Fireside Studio (`/studio/fireside`).

### 1.2 The Problem
While curriculum data is now synchronized, the narrative text editing and video recording engines remain architecturally fragmented:
1. **Divergent Script Editors:** Desktop uses a typewriter layout inside `MemoryForm.tsx`, Fireside uses a custom textarea inside `SingleCardPromptCarousel.tsx`, and the Freeform Creator (`/add-memory`) uses a detached TipTap instance.
2. **Duplicated Caret & NLP Logic:** Both Desktop and Fireside independently maintain logic for sensory anchor detection (`detectSensoryAnchors`), caret positioning, and modality highlighting, creating maintenance overhead.
3. **Unclear Video Studio Boundaries:** The exact boundaries between Desktop Studio’s feature-rich director workstation and Fireside Mobile’s armchair recording booth have never been formally codified, risking feature bloat on mobile.

---

## 2. Core Architectural Principles: "Desktop Master, Mobile Companion"

1. **Desktop Sets the Capability Ceiling:** Desktop Studio is the master reference implementation. It supports professional workstation workflows: multi-take recording, dense beat reordering, multi-track timeline inspection, and precision typewriter scripting.
2. **Fireside is the Distraction-Free Armchair Booth:** Fireside adapts Desktop's master engine for touchscreens. It prioritizes emotional safety, high legibility, and effortless single-tap recording for older narrators.
3. **Shared Narrative Primitives:** Core text-entry and modality detection logic must reside in shared primitives located at `C:\Users\home\studio\src\components\studio\shared/`.

---

## 3. Comprehensive Divergence Matrix: Desktop Workstation vs. Fireside Booth

| Dimension | Desktop Studio (`/studio/production/[id]`)<br>*(The Director's Workstation)* | Fireside Studio (`/studio/fireside`)<br>*(The Armchair Recording Booth)* | Shared Core Engine / Invariant |
| :--- | :--- | :--- | :--- |
| **Target User & Posture** | Lean-forward, curatorial, analytical.<br>Creator sits with mouse & physical keyboard. | Lean-back, intimate, conversational.<br>Elder narrator holds iPad/phone on couch. | Sourced from `masterStoryStructure.ts` (31 canonical scenes). |
| **Act I: Script Preparation** | **Full Scriptorium:**<br>• Typewriter font (`Courier Prime`)<br>• Section looping & beat re-ordering<br>• Catalyst triggers & prompter speed customizer | **Armchair Script Editor:**<br>• Warm serif font (`Georgia / Merriweather`)<br>• Persistent Inspiration Spark card (`💡`)<br>• Tactile Sensory Seed chips (`🌿`) | NLP sensory cue extraction via `detectSensoryAnchors` in `useDirectorInk.ts`. |
| **Act II: Sensory Weaving** | Multi-column beat inspector with granular sensory cue overrides and word density scoring. | Single-column woven preview card with auto-illuminating modality pills. | Modality taxonomy (Soundscape, Visual, Aroma) bound via `<SensoryModalityKey />`. |
| **Act III: Recording & Teleprompter** | **Multi-Take Soundstage:**<br>• Multi-take folder (Take 1, Take 2, Take 3)<br>• Granular WPM slider (80–180 WPM)<br>• Audio input selector (e.g. DJI Mic 2 vs USB)<br>• Audio waveform & VU meters<br>• 16:9 widescreen video framing | **One-Tap Recording Booth:**<br>• Big Red Button: `[ Start Talking ]`<br>• Fixed prompter cadence at 120 WPM<br>• Portrait (9:16 / 4:5) mobile framing<br>• Zero technical dials; single `[ ↺ Retake ]`<br>• Automatic ambient noise suppression | Shared `navigator.mediaDevices` stream capture & Cloud Storage upload pipeline. |
| **Act IV: Review & Editing** | **The Master Screening Suite:**<br>• Multi-track timeline scrubber<br>• Head/tail trim handles<br>• Side-by-side multi-take comparator<br>• B-roll archival photo placement markers<br>• Full video export & reel mastering | **The Living Room Screening Room:**<br>• Clean video playback player<br>• `[ Photograph Vintage Album Print ]` drawer<br>• `[ Bonus Memory Drawer ]` for spoken postscripts<br>• 1-tap `[ Seal & Complete Scene ]`<br>• **Direct QR Code to Cinema Room TV view** | Encrypted Firestore take metadata & CRC32c cloud storage verification. |

---

## 4. Technical Design: The Shared Narrative Primitives

### 4.1 Primitive 1: `<SensoryScriptEditor />`
- **Location:** `C:\Users\home\studio\src\components\studio\shared\SensoryScriptEditor.tsx`
- **Architecture:** Dual-layer CSS Grid overlay (`gridArea: 1/1/2/2`).
  - Top layer: Transparent interactive `<textarea>` managing native caret navigation.
  - Bottom layer: Rendered tokenized HTML layer with real-time sensory underlines.
- **Props Interface:**
  ```typescript
  export interface SensoryScriptEditorProps {
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
    typography?: 'typewriter' | 'serif'; // Typewriter = Desktop, Serif = Fireside
    language?: 'en-GB' | 'gu' | 'pa' | 'hi';
    rows?: number;
    className?: string;
    textareaClassName?: string;
    readOnly?: boolean;
    disabled?: boolean;
    dataTestId?: string;
    ariaLabel?: string;
    onDetectedAnchorsChange?: (anchors: DetectedAnchor[]) => void;
  }

  export interface SensoryScriptEditorRef {
    pulseAndSelectWord: (word: string, modality?: 'soundscape' | 'visual' | 'aroma') => void;
    focus: (options?: FocusOptions) => void;
    getTextarea: () => HTMLTextAreaElement | null;
  }
  ```

### 4.2 Primitive 2: `<SensoryModalityKey />`
- **Location:** `C:\Users\home\studio\src\components\studio\shared\SensoryModalityKey.tsx`
- **Architecture:** Interactive counter pills showing live sensory matches:
  - 🎧 **Soundscape (N):** Sky Blue (`border-sky-400 bg-sky-500/15 text-sky-300`)
  - 👁️ **Visual (N):** Emerald Green (`border-emerald-400 bg-emerald-500/15 text-emerald-300`)
  - ☕ **Aroma / Taste (N):** Amber Gold (`border-amber-400 bg-amber-500/15 text-amber-300`)
- **Interaction:** Tapping any pill calls `editorRef.pulseAndSelectWord(word, modality)`, which jumps the caret, applies a luminous CSS pulse animation, and selects the word natively via `setSelectionRange`.

---

## 5. System Governance Codification (Rule 48 in `AGENTS.md`)

```markdown
# 48. Shared Narrative Primitives & Cross-Surface Component Invariant

## 48.1 Mandatory Primitive Extraction
Whenever core narrative interactions—such as script drafting, sensory highlighting, teleprompter displays, photo capture, or audio recording—are deployed across both Desktop Studio (`/studio`) and Fireside Mobile (`/studio/fireside`), agents are strictly forbidden from implementing parallel duplicate components. 

Core interaction logic MUST be extracted into reusable primitives residing under:
- `C:\Users\home\studio\src\components\studio\shared/`
- `C:\Users\home\studio\src\components\shared/`

## 48.2 Dual-Layer Highlighting, Shared Hook & Ref Contract
Text input surfaces utilizing sensory NLP detection must share core highlight calculation via the `useSensoryHighlight` hook / canonical detection utilities (`detectSensoryAnchors`, `filterDominantSensoryAnchors`). On mobile and standalone drafting surfaces, `<SensoryScriptEditor />` provides:
1. Dual-layer CSS Grid overlay (`gridArea: 1/1/2/2`) with zero-drift typographic lockstep (`px-0`, `mx-0`, matching `font-weight`, `box-sizing: border-box`).
2. Unicode-aware Indic segmentation (`gu`, `pa`, `hi`) keeping non-anchor text as unbroken contiguous nodes.
3. Imperative ref contract exposing `pulseAndSelectWord(word, modality)`, `focus()`, and `getTextarea()`.
4. Configurable typography prop (`typography: 'serif' | 'typewriter'`).
(Surfaces with advanced custom requirements, such as Desktop's `SentenceWrapper` with TipTap, sentence catalysts, and drag-and-drop tooltips, consume the shared `useSensoryHighlight` hook in Phase 2 rather than forcing monolithic `<SensoryScriptEditor />` replacement).

## 48.3 Modal Chromatic Lockstep
Sensory modality indicators across all surfaces must adhere strictly to Rule 45 chromas:
- 🎧 **Soundscape:** Sky Blue (`text-sky-400 border-sky-400 bg-sky-500/15`)
- 👁️ **Visual:** Emerald Green (`text-emerald-400 border-emerald-400 bg-emerald-500/15`)
- ☕ **Aroma / Taste:** Amber Gold (`text-amber-400 border-amber-400 bg-amber-500/15`)

## 48.4 Single-Icon Discipline
Card headers and interactive pills must never double-render icons (e.g. `💡 💡` or `🌿 🌿`). Icons must appear exactly once as the leading glyph.
```

---

## 6. Phased Rollout Plan

- **Phase 1 (Sprint 12 — Completed under ARCH-MW-132):**
  - Build shared primitives `<SensoryScriptEditor />` and `<SensoryModalityKey />`.
  - Wire into `SingleCardPromptCarousel.tsx` (Fireside Booth).
  - Codify Rule 48 into `AGENTS.md`.
  - Verify with 30 Vitest assertions (`sensory_script_editor.test.tsx`, `fireside_prompt_carousel.test.tsx`).
- **Phase 2 (Sprint 13):**
  - Integrate shared primitives into `MemoryForm.tsx` (Desktop Master Scriptorium).
  - Audit `C:\Users\home\studio\src\app\add-memory\page.tsx`.
  - Implement a TipTap sensory extension adapter or integrate `<SensoryScriptEditor />` without disrupting Firestore autosave.
- **Phase 3 (Sprint 14):**
  - Implement Physical Keepsake QR Bridge & Cinema Room TV casting bridge.

---

## 7. Out-of-the-Box Team Brainstorm & Call for Contributions

Every team member is requested to contribute at least one creative, unconventional idea to elevate this release:

### 💡 For Naresh (Executive Producer & Diaspora Storyteller):
- **Challenge:** How can we bridge physical family heirlooms with digital video recording?
- **Seed Idea (Physical Keepsake QR Bridge):** Sealing a scene generates a printable, vintage-bordered postcard or physical archival insert with a gold foil-style QR code. Grandparents can place it inside an existing physical photo album, allowing grandchildren to scan the album page with their phone and watch the video take.
- **Producer Addition (Naresh Mepani - 2026-10-10):**
  > *"Like the idea, also include QR Code to the Cinema Room."*
  - **Enhanced Architecture:** The physical keepsake card will feature a **Dual QR Code Architecture**:
    1. **Personal Memory Reel QR:** Points directly to the sealed scene video reel (`https://dev.memoryweaver.studio/cinema?id=[memoryId]`).
    2. **Cinema Room TV Bridge QR:** Points to the big-screen living room playback player (`https://dev.memoryweaver.studio/cinema/tv?id=[memoryId]`), enabling multi-generational family viewing on smart TVs without typing URLs or logging in on TV browsers.

### 🛡️ For Claude (Quality Gatekeeper):
- **Challenge:** How can we ensure zero regression across both surfaces without doubling manual QA time?
- **Seed Idea (Visual Regression Playwright Snapshots):** Introduce automated dual-viewport snapshot tests (390px iPhone vs 1440px Desktop) that render the shared editor side by side and fail the build if caret positioning or underline offsets drift by more than 1 pixel.

### 🧠 For Chat 0 (Mission Control Dispatch Brain):
- **Challenge:** How do we handle network hiccups when elders record long video takes on mobile?
- **Seed Idea (IndexedDB Offline Vault):** Implement a chunked IndexedDB blob storage layer. If a mobile device loses Wi-Fi mid-recording, the video take is safely preserved locally and synchronizes automatically once connectivity returns.

### ⚡ For Chat 2 (The Flash Executor):
- **Challenge:** How do we make sensory cue detection instantaneous on low-powered mobile devices?
- **Seed Idea (Web Worker NLP Engine):** Offload regex tokenization and lemma matching from the React main thread to a dedicated Web Worker (`sensory-worker.ts`), ensuring 60fps typing even on massive 2,000-word scripts.

---

## 8. Team Sign-Off & Consensus Gate (Rule 43)

| Role | Name | Status | Sign-off Date | Notes / Conditions |
| :--- | :--- | :--- | :--- | :--- |
| **Product & Cultural Lead** | Naresh Mepani | 🟢 APPROVED WITH AMENDMENT | 2026-10-10 | Approved Physical Keepsake QR Bridge; mandated direct QR Code to Cinema Room TV view. |
| **System Architect** | Lead Architect (Gemini) | 🟢 APPROVED | 2026-10-10 | Architecture validated; Phase 1 verified on dev edge; Phase 2 scoped. |
| **Quality Gatekeeper** | Claude (Opus / Sonnet) | 🟢 APPROVED WITH CONDITIONS | 2026-10-10 | Approved with Phase 1 hotfixes: B1 (Card 51 accuracy), B2 (dual-layer drift elimination), B3 (modality count harmonization), B4 (Desktop SentenceWrapper hook decoupling in Phase 2), B5 (Keepsake QR privacy/revocation architecture in Phase 3). |
| **Mission Control** | Chat 0 | ⏳ PENDING REVIEW | — | Preparing Plane.so Epic #339 link and IndexedDB Offline Vault roadmap. |
| **Executor** | Chat 2 | 🟢 PHASE 1 REMEDIATED | 2026-10-10 | Executed B2 zero-drift and Indic segmentation hotfixes under ARCH-MW-133; tests passing. |
