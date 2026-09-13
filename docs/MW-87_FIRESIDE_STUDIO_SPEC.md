# 🎙️ Architectural & Product Specification: Milestone MW-87 Fireside Voice Studio

**Initiative:** MW-87 Fireside Voice Studio Suite  
**Plane.so Reference:** Ticket #245 (MW-244)  
**Author:** Antigravity (Station 1: The Lead Architect)  
**Target Route:** `/studio/fireside`  
**Constitutional Governance:** `C:\Users\home\studio\.agents\AGENTS.md` (Rules 5, 7, 8, 20, 26, 37)  
**Grounding Vaults:**
- 📐 Systems Architecture & Engineering Vault
- 🎧 Storyteller Care & White-Glove Support Vault

---

## 1. Executive Summary & Ergonomic Thesis

### 1.1 The Elder Narrator Friction with Teleprompter Soundstages
The desktop soundstage (`/studio` via `SoloStage.tsx`) provides an immersive, multi-camera teleprompter experience designed for confident, self-directed narrators. However, extensive user feedback from our multi-generational gifting demographic reveals that elder storytellers—parents and grandparents aged 65 to 85+ ("The Storytellers")—face significant cognitive and physical friction on desktop setups:
- **Pacing Anxiety:** Synchronised teleprompter scroll speeds create subconscious pressure to keep up with text, stripping spoken delivery of its natural cadence, pauses, and emotional depth.
- **Gaze Tracking Stress:** Elders feel self-conscious staring directly into webcam lenses while monitoring video feeds, producing stiff, performative posture rather than relaxed reminiscence.
- **Hardware Friction:** Desktop keyboards, trackpads, and external webcams require sitting upright at desks or dining tables, an unnatural posture for intimate life reflection.

### 1.2 The Armchair Physical Context (*Zuhandenheit*)
The Fireside Voice Studio is engineered around the natural domestic posture of reminiscence: sitting comfortably in an armchair, resting on a sofa, or gathered by the fire with a smartphone or resting tablet:
- **Audio-First Intimacy:** Eliminating the teleprompter transforms storytelling from an audition into a warm fireside conversation. The device can rest on an armrest or coffee table while the storyteller speaks freely.
- **Tactile Physicality:** Elder storytellers often hold physical heirloom artefacts—vintage black-and-white photographs, wedding albums, letters, or handwritten recipe books. The Fireside Studio makes digitising these tactile treasures effortless through native camera capture.
- **One-Handed Mobile Reach:** All primary controls are anchored within the ergonomic bottom thumb zone of modern mobile viewports (`360×740px` to `414×896px`).

### 1.3 Accessibility & Sensory Standards (Rule 26)
- **High-Contrast Colour Palette:** Pure obsidian matte backdrop (`#0A0A0A`) paired with warm amber firelight accents (`#F59E0B`) and muted ember card surfaces (`#171717`).
- **Elder Touch Envelopes:**
  * Minimum button height: `56px` across all interactive targets.
  * Central Tactile Record Button: Oversized `88px × 88px` circular touch boundary.
  * Secondary Action Buttons (Pause, Retake, Delete): `56px × 56px`.
- **Large Typography:** Minimum body and prompt text size of `18px`, with high-contrast font weights (600–700) ensuring legibility without requiring reading glasses.
- **British English Orthography (Rule 20):** Strict UK spelling across all labels, notifications, docstrings, and schemas (`digitisation`, `synchronisation`, `visualiser`, `honour`, `centre`, `realise`, `programme`, `categorise`, `initialise`).

---

## 2. System Architecture & Route Hierarchy

### 2.1 Route & URL Parameter Schema
The Fireside Voice Studio mounts at the dedicated route:
```text
/studio/fireside
```
Supported URL query parameters:
| Parameter | Type | Purpose | Example |
| :--- | :---: | :--- | :--- |
| `id` | `string` | Deep-link or resume an existing memory draft | `?id=mem_draft_882` |
| `prompt` | `string` | Pre-select a specific story spark card | `?prompt=childhood_scents` |
| `lang` | `en\|gu\|pa\|hi` | Set the active prompt language | `?lang=gu` |

### 2.2 Provider Hierarchy & Pure Non-Degradation (Rule 7)
The Fireside Studio is mounted completely independently of the desktop soundstage. The desktop files (`C:\Users\home\studio\src\components\studio\SoloStage.tsx` and `ProductionDeckContainer.tsx`) remain 100% untouched.

```text
┌─────────────────────────────────────────────────────────────┐
│ src/app/studio/fireside/page.tsx                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ StudioProviders (Auth, Firestore, Storage)              │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ FiresideStudioContainer (100dvh Vertical Frame)     │ │ │
│ │ │ ├── FiresideHeader (Language Toggle, Draft Status)  │ │ │
│ │ │ ├── SingleCardPromptCarousel (MW-245)               │ │ │
│ │ │ ├── AlbumPhotoCaptureTray (MW-247)                  │ │ │
│ │ │ ├── TactileVoiceRecorder & Visualiser (MW-246)      │ │ │
│ │ │ └── PermissionDenialRecoveryOverlay                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Mobile Viewport Integrity (Rule 8)
- Container height is strictly bounded to `100dvh` (`min-height: 100dvh; max-height: 100dvh; overflow: hidden;`).
- Zero horizontal overflow: `scrollWidth <= clientWidth` across all target viewports:
  * `360×740px` (Samsung Galaxy S8+)
  * `375×667px` (iPhone SE / iPhone 8)
  * `390×844px` (iPhone 14 / 15)
  * `820×1180px` (iPad Air / Tablet in armchair lap)

---

## 3. Detailed Sub-Module Specifications

### 3.1 MW-245: Single-Card Prompt Carousel
- **Component Path:** `C:\Users\home\studio\src\components\fireside\SingleCardPromptCarousel.tsx`
- **Ergonomics:** Renders one card at a time to prevent cognitive overload. Cards display an evocative memory category badge (`childhood`, `roots`, `love`, `wisdom`, `traditions`, `lessons`, `humour`, `legacy`).
- **Bilingual & Indic Dialect Support:**
  * Displays prompt text in the selected language (`en`, `gu`, `pa`, `hi`).
  * Features an inline language pill selector to switch between English and mother tongue instantly.
- **Card Interaction:**
  * Smooth horizontal drag/swipe gestures using Framer Motion (`x` drag with spring constraints).
  * Prominent, accessible "Next Spark ➔" (`56px` height) and "Previous Spark" controls.
  * Expandable "Follow-up Questions" drawer revealing gentle probing questions to keep memories flowing.
  * Contextual "Photo Idea" badge (e.g. *"Look for a photo of your mother's kitchen"*).

### 3.2 MW-246: Tactile Web Audio Voice Recorder
- **Component Path:** `C:\Users\home\studio\src\components\fireside\TactileVoiceRecorder.tsx`
- **Audio Processing Pipeline:**
  ```text
  Microphone (navigator.mediaDevices.getUserMedia({ audio: true }))
      │
      ▼
  Web Audio AudioContext (Sample Rate: 48kHz, Latency: 'interactive')
      │
      ▼
  DynamicsCompressorNode (Threshold: -24dB, Knee: 30, Ratio: 12, Attack: 0.003s, Release: 0.25s)
      │
      ▼
  AnalyserNode (fftSize: 256, smoothingTimeConstant: 0.8) ──► Circular Amber VU Waveform
      │
      ▼
  MediaStreamAudioDestinationNode
      │
      ▼
  MediaRecorder (audio/webm;codecs=opus with audio/wav fallback)
  ```
- **Elder Tactile Controls:**
  * **Record Button:** `88px × 88px` circular button centered in the bottom thumb bar. Amber flame glow pulse animation when recording.
  * **Pause/Resume:** `56px` secondary circular button.
  * **Haptic Feedback:** Hardware vibration cadences triggered via `navigator.vibrate`:
    - Start: `[40, 60, 40]ms`
    - Pause: `[30]ms`
    - Stop / Complete: `[60, 80, 100]ms`
  * **Circular Waveform Visualiser:** Ambient circular VU ring reacting in real time to speech amplitude, giving immediate reassurance that voice is being captured without needing complex meters.

### 3.3 MW-247: Physical Album Photo Capture & Compression
- **Component Path:** `C:\Users\home\studio\src\components\fireside\AlbumPhotoCaptureTray.tsx`
- **Camera Ingress:**
  ```html
  <input 
    type="file" 
    accept="image/*" 
    capture="environment" 
    id="fireside-album-camera" 
    class="hidden" 
  />
  ```
  Tapping the oversized "Photograph Album" button (`56px` height, camera icon) directly launches the mobile device's rear camera for digitising vintage photo prints held on the storyteller's lap.
- **Client-Side Compression Pipeline:**
  * Loads captured image into an in-memory `HTMLCanvasElement`.
  * Computes bounding box: Max dimension `1600px` (preserving aspect ratio).
  * Encodes to JPEG at `0.82` quality.
  * Corrects orientation using EXIF orientation tags.
  * Typical file size reduction: From 8–15 MB raw camera capture to 250–500 KB compressed JPEG without visible loss on vintage print textures.
- **Attachment Tray:**
  * Horizontal scroll tray displaying Polaroid-style thumbnails with caption input fields.
  * One-tap "Rotate" (`90°`) and "Retake" buttons.

### 3.4 MW-248: Resilient Firestore Draft Synchronisation Engine
- **Hook Path:** `C:\Users\home\studio\src\hooks\useFiresideSync.ts`
- **Data Flow:**
  1. Real-time updates write immediately to local `IndexedDB` (`fireside_vault_store`).
  2. Debounced background synchronisation (`3000ms`) writes metadata to Firestore collection `/users/{uid}/memories/{draftId}`.
  3. Recorded WebM audio blobs and JPEG attachments are uploaded chunk-by-chunk to Firebase Storage (`/users/{uid}/fireside/{draftId}/audio.webm`).
  4. Network disconnects trigger an amber "Saved to Device" badge. The engine automatically resumes synchronisation upon reconnection.

---

## 4. Mobile-First Ergonomic & Hardware Guards

### 4.1 Screen Wake Lock API Guard (`navigator.wakeLock`)
- **The Problem:** Elderly narrators frequently pause for 30 to 60 seconds while gathering their thoughts or reflecting on emotional memories. Mobile Safari and Android Chrome default to a 30-second screen timeout, which can suspend background audio threads or turn off the display.
- **The Implementation:**
  ```typescript
  let wakeLockSentinel: WakeLockSentinel | null = null;

  async function acquireWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      } catch (err) {
        console.warn('Screen Wake Lock request failed:', err);
      }
    }
  }

  async function releaseWakeLock(): Promise<void> {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      } catch (err) {
        console.warn('Screen Wake Lock release failed:', err);
      }
    }
  }
  ```
- **Lifecycle:**
  * Acquired immediately upon transitioning to `status === 'recording'`.
  * Preserved during `status === 'paused'`.
  * Released when recording is stopped, saved, or the user navigates away.

### 4.2 Permission Denial Recovery Slate
- **The Problem:** Elderly users may accidentally tap "Deny" or "Block" on the browser's initial microphone permission dialogue. Standard web apps fail silently or display unhelpful generic errors.
- **The Implementation:**
  When `permissionState === 'denied'`, the Fireside Studio renders a full-screen, high-contrast modal with amber step-by-step illustrations tailored to the detected OS:
  * **iOS Safari:** "Microphone Access Blocked" ➔ Step 1: Tap the `aA` icon in the address bar ➔ Step 2: Tap *Website Settings* ➔ Step 3: Set *Microphone* to *Allow*.
  * **Android Chrome:** "Microphone Access Blocked" ➔ Step 1: Tap the Lock icon beside the URL ➔ Step 2: Tap *Permissions* ➔ Step 3: Toggle *Microphone* to *On*.
  * Features a prominent "I've Enabled It — Try Again" button (`56px` height) triggering a permissions re-check.

### 4.3 Optimistic IndexedDB Vault Retention
- **The Problem:** Home Wi-Fi can drop unexpectedly during long recordings, risking loss of irreplaceable spoken memoirs.
- **The Implementation:**
  1. The complete raw WebM audio blob is written into `IndexedDB` (`fireside_vault_store`) **before** any network upload begins.
  2. The background storage upload stream dispatches to Firebase Storage.
  3. The local IndexedDB audio blob is **only pruned or marked as uploaded** once a verified HTTP 200 response with storage URL is received and acknowledged.
  4. If the browser tab is closed, refreshed, or crashes during recording, reopening `/studio/fireside` immediately detects the orphaned IndexedDB blob and prompts: *"We preserved your recording from earlier. Would you like to keep it?"*

---

## 5. Quality, Invariants & Verification Matrix

### 5.1 Vitest Invariant Test Suite (`fireside.test.ts`)
- **Test 1: Web Audio State Transitions:** Verify deterministic progression between `idle` ➔ `recording` ➔ `paused` ➔ `recording` ➔ `processing` ➔ `saved`.
- **Test 2: Photo Compression Ratio Assertion:** Verify that a simulated 4000×3000 test canvas compresses to ≤1600px max dimension and generates a JPEG blob under 500 KB.
- **Test 3: IndexedDB Fallback & Optimistic Cache:** Verify that audio blobs persist in mock IndexedDB and survive draft updates.
- **Test 4: Multilingual Prompt Coverage:** Assert that all 8 prompt categories in `FiresidePromptSpark` contain non-empty strings across all 4 languages (`en`, `gu`, `pa`, `hi`).

### 5.2 Native Playwright Responsive Testing Suite
Headless Playwright assertions targeting `dev.memoryweaver.studio/studio/fireside`:
| Viewport | Device Profile | Target Invariant |
| :--- | :--- | :--- |
| **360 × 740 px** | Samsung Galaxy S8+ | `scrollWidth <= clientWidth` (zero horizontal overflow); Record button touch envelope `≥88px`; Primary buttons `≥56px`. |
| **375 × 667 px** | iPhone SE (Compact) | Single-card carousel fits without clipping; Record bar remains docked within viewport. |
| **820 × 1180 px** | iPad Air (Armchair Lap) | Two-column layout adaptation; album photo tray renders side-by-side with waveform. |

---

## 6. Phased Implementation Roadmap

```text
┌──────────────────────────────────────────────────────────────┐
│ SPRINT 4: MILESTONE MW-87 FIRESIDE VOICE STUDIO              │
├──────────────────────────────────────────────────────────────┤
│ ✅ MW-244: Architecture Specification & TypeScript Contracts │
│ ⏳ MW-245: Single-Card Prompt Carousel Component Deck       │
│ ⏳ MW-246: Tactile Web Audio Voice Recorder & VU Visualiser  │
│ ⏳ MW-247: Album Camera Capture & Canvas Compression Pipe    │
│ ⏳ MW-248: Resilient IndexedDB / Firestore Sync Engine       │
│ ⏳ MW-249: Route Mounting (/studio/fireside) & Vitest Suite   │
└──────────────────────────────────────────────────────────────┘
```
