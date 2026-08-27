# 🎙️ Memory Weaver (MW) Core Engine Backlog

This is the unified backlog and historical log for all **MW-*** ticket definitions, serving as the official project source of truth. Moving forward, **every task or modification must map to a ticket number in this log.**

---

## 📋 Ticket Index & Status

### Sprint 1 & 2: Media Engine & Foundation
*   `[x]` **MW-1:** `[V6.5] Project Memory & Knowledge Audit`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-2:** `Architect useMediaCapture.ts Hook`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-3:** `Resolve NotAllowedError in useCamera.ts (Handle permission denials)`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-4:** `Fix Framer Motion undefined opacity crash on Act II entry`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-5:** `Implement "Camera Permission" UI overlay for blocked states`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-6:** `[BUG] Act II Transition: Opacity Animation Crash`
    *   *Status:* **Accepted** (Signed off by Director)

### Sprint 3: Global Architectures & Mentorship (The Weave)
*   `[x]` **MW-7:** `Global Mentor Protocol: Stage-Aware Context Provider`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-8:** `Act II "Cognitive Bridge" Refactor (Architect Drawer & Auto-Trigger)`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-69:** `Diagnostic Support Overlay (Resend Bug Modal + Easter Egg)`
    *   *Status:* **Accepted** (Signed off by Director)
*   `[x]` **MW-70:** `Firebase App Hosting Environment Setup & Cloudflare Domain Routing`
    *   *Status:* **Accepted** (Signed off by Director)



---

## 🚀 Upcoming Backlog (Next Sprints)

### Sprint 4: Core Verification & Performance
*   `[ ]` **MW-9:** `[V6.6] Implement Git Hash Injection for Version Verification`
    *   *Status:* **Todo** (Refactored from `STU-V1`)
    *   *Description:* Inject unique git commit hashes into the runtime layout to verify build parity.
*   `[ ]` **MW-10:** `Refactor Storyteller View to be Ad-Blocker Proof (Fetch-First Strategy)`
    *   *Status:* **Todo** (Refactored from `STU-55`)
    *   *Description:* Avoid strict ad-blocker triggers by using initial data fetch prior to dynamic client scripts.

### Sprint 4.5: Automated E2E & Multi-Tenant Routing Gateway
*   `[x]` **MW-17:** `Relocate Client-Side FFmpeg Binaries to Local Public Directory`
    *   *Status:* **Done**
    *   *Description:* Removes unpkg.com CDN network dependencies from src/lib/ffmpeg-loader.ts for isolated build testing.
*   `[x]` **MW-18:** `Configure Playwright Media and Auth Bypasses`
    *   *Status:* **Done**
    *   *Description:* Refactor test-playwright-run.js to inject '--use-fake-device-for-media-stream' and leverage 'mode=guest' configurations across headless browser contexts.
*   `[x]` **MW-19:** `Build Out Admin Subdomain Edge Middleware & Base Layout`
    *   *Status:* **Done**
    *   *Description:* Establish subfolder routing rules at src/middleware.ts to intercept admin.memoryweaver.studio requests.

### Sprint 5: Role-Specific Production Suites & Architecture (Epic: MW-11)
*   `[x]` **MW-11:** `[EPIC] Unified APP_VERSION Single Source of Truth`
    *   *Status:* **Done**
*   `[x]` **MW-12:** `Pre-Flight Auth & Staging Isolation`
    *   *Status:* **Done**
*   `[ ]` **MW-13:** `Act I & II - Memory Form & Script Genesis Sync`
    *   *Status:* **In Progress**
*   `[ ]` **MW-14:** `Act III - Main Studio & Teleprompter Controls`
    *   *Status:* **In Progress**
*   `[ ]` **MW-15:** `Standalone Popout Teleprompter & Multi-Tab Sync`
    *   *Status:* **In Progress**
*   `[ ]` **MW-16:** `Visual HUD Overlay & Telemetry Diagnostics`
    *   *Status:* **In Progress**
*   `[x]` **MW-53:** `Unlocking Collaboration & Guest Director Room Switch State`
    *   *Status:* **Done**

### Completed & Verified Codebase Fixes (Pending Director Staging Sign-Off)
*   `[x]` **MW-20 / MW-100:** `Force Act I.1 Scriptorium Text Editor on Dashboard Edit Scene Click` (*Status:* **Verified**)
*   `[x]` **MW-21 / MW-101:** `Fix Release Sensory Lock UI Unsealing in MemoryForm` (*Status:* **Verified**)
*   `[x]` **MW-22 / MW-102:** `Enforce Dynamic Text Year Extraction & Exact Calendar Year Lock` (*Status:* **Verified**)
*   `[x]` **MW-23 / MW-103:** `Mathematical Temporal Horizon Calculation Engine` (*Status:* **Verified**)
*   `[x]` **MW-24 / MW-104:** `5-Card Soundtrack Synthesis Loop & Audio Preview Player` (*Status:* **Verified**)
*   `[x]` **MW-25 / MW-105:** `Interactive "Refresh Now" Button for Live Deployment Interceptor` (*Status:* **Verified**)
*   `[x]` **MW-26 / MW-106:** `Studio Upgrade Available Toast Banner` (*Status:* **Verified**)
*   `[x]` **MW-27 / MW-107:** `Zero-Data-Loss LocalStorage Persistence & Rehydration` (*Status:* **Verified**)
*   `[x]` **MW-28 / MW-108:** `V6.7 Scale Parity Engine: Full-Length Monologue Word Count Parity` (*Status:* **Verified**)
*   `[x]` **MW-30 / MW-111:** `Fix "Back to Script Editor" Modal & State Transition` (*Status:* **Verified**)
*   `[x]` **MW-31 / MW-112:** `Stage Rehydration URL Parameter Cleanup` (*Status:* **Verified**)
*   `[x]` **MW-32 / MW-113:** `Fix Crown Synthesis Blank Text & Unify 5-Card Deck Index Tags` (*Status:* **Verified**)
*   `[x]` **MW-33 / MW-114:** `Studio Upgrade Top Header Indicator & Deployment Detection` (*Status:* **Verified**)
*   `[x]` **MW-37 / MW-115:** `Sanitize Next.js Production Error Digest Texts` (*Status:* **Verified**)
*   `[x]` **MW-38 / MW-116:** `Studio Upgrade Header Badge High-Contrast Visual Polish` (*Status:* **Verified**)
*   `[x]` **MW-39 / MW-117:** `Unseal Production Lock & Multi-Layer Prose Resolution on ENTER THE WEAVE` (*Status:* **Verified**)
*   `[x]` **MW-40 / MW-118:** `Re-weave Thread Retry Button Restoration & AI Fallback` (*Status:* **Verified**)
*   `[x]` **MW-41 / MW-119:** `5-Card Vision Deck Synchronization & Fresh Script Priority Shield` (*Status:* **Verified**)
*   `[x]` **MW-42 / MW-120:** `ProductionDeck:SyncLock Hijack Prevention` (*Status:* **Verified**)
*   `[x]` **MW-43 / MW-121:** `Scriptorium Text Edit Persistence & Stale scriptBlocks Masking` (*Status:* **Verified**)
*   `[x]` **MW-44 / MW-122:** `Strict Vocabulary & Factual Fidelity Prompt Shield in AI Weaver` (*Status:* **Verified**)
*   `[x]` **MW-45 / MW-123:** `Scriptorium Enter Recording Studio Navigation Direct Prop Binding` (*Status:* **Verified**)
*   `[x]` **MW-46 / MW-124:** `SelectionDeck Review Stage Advance Handshake Resolution` (*Status:* **Verified**)
*   `[x]` **MW-47 / MW-125:** `Act I Locked Blueprint Enter Recording Studio Stage Advance Routing` (*Status:* **Verified**)
*   `[x]` **MW-48 / MW-126:** `Stage 2 Recording Teleprompter Studio Advance Routing` (*Status:* **Verified**)
*   `[x]` **MW-49 / MW-127:** `Unconditional Stage 2 Recording Studio Advance Routing` (*Status:* **Verified**)
*   `[x]` **MW-50 / MW-128:** `Zero-Latency AI Director Formulating Cue Indicator` (*Status:* **Verified**)
*   `[x]` **MW-51 / MW-129:** `High-Contrast ScriptLightBox & Teleprompter Controls, UK English Audit` (*Status:* **Verified**)
*   `[x]` **MW-52 / MW-130:** `AI Director Floating Sidebar Auto-Height & Zero-Scroll Layout Bounds` (*Status:* **Verified**)
*   `[x]` **MW-54 / MW-132:** `DirectorsNotepad Safety Fallback Synthesis & 95% Progress Unstick` (*Status:* **Verified**)
*   `[x]` **MW-55 / MW-133:** `Director's Notepad Tooltips & Instant Click Activation` (*Status:* **Verified**)
*   `[x]` **MW-56 / MW-134:** `DirectorsNotepad AnalyzedAt Property Type Error Fix` (*Status:* **Verified**)
*   `[x]` **MW-57 / MW-135:** `Standardize Act Headers and Expand Director's Notepad Panel to 100% Height` (*Status:* **Verified**)
*   `[x]` **MW-58 / MW-136:** `Map All 5 Acts in Studio Top Header Bar` (*Status:* **Verified**)
*   `[x]` **MW-59 / MW-137:** `Add Rich Tooltips for Navigation Header Buttons` (*Status:* **Verified**)
*   `[x]` **MW-60 / MW-138:** `Add Tooltips for NEXT, LINT, and BACK Controls in Act III Capture` (*Status:* **Verified**)
*   `[x]` **MW-61 / MW-139:** `Act III Director's Notepad Soundtrack & Timeline Tooltips` (*Status:* **Verified**)
*   `[x]` **MW-62 / MW-140:** `Sanitize formatTime to prevent unrounded float timestamps on video timeline` (*Status:* **Verified**)
*   `[x]` **MW-63 / MW-141:** `Dual-Reel Fusion Manifest State Contract for Act V Premiere` (*Status:* **Verified**)
*   `[x]` **MW-64 / MW-142:** `Auto-Generated Structural Chapter Markers for Act V Theater` (*Status:* **Verified**)
*   `[x]` **MW-65 / MW-143:** `Master Narrative Package Bundling & Export Engine` (*Status:* **Verified**)
*   `[x]` **MW-66 / MW-144:** `Act V Dual-Reel Mode & Master Narrative Package Export` (*Status:* **Verified**)
*   `[x]` **MW-67 / MW-34:** `1-Prior-Version Instant Undo Button` (*Status:* **Verified**)
*   `[x]` **MW-68 / MW-145:** `Scriptorium Prose Preservation on Stage Advance` (*Status:* **Verified**)
*   `[x]` **MW-85:** `Stripe Checkout & Generational Vault Payments (Option B: One-Off Pass)` (*Status:* **Verified**)

### 🚀 Outstanding Sprint 4 & Phase 2 Roadmap Items (V2 Remaining)
*   `[ ]` **MW-86:** `Gift Voucher Engine & Act V Heirloom Unboxing Protocol` (*Status:* **Todo**)
    *   *Description:* Base32 Crockford gift voucher generation, 5"x7" vector PDF keepsake generator via pure JS, rate-limited public verification endpoint, decoupled /unboxing/[code] cinematic wax-seal experience, post-checkout async audio/video dedication hub, and automated giver notification loop.
*   `[ ]` **MW-217:** `Google Cast CAF SDK & AirPlay Suite` (*Status:* **Todo**)
*   `[ ]` **MW-218:** `Multi-Language Heritage Pack Selector` (*Status:* **Todo**)
*   `[ ]` **MW-9:** `[V6.6] Implement Git Hash Injection for Version Verification` (*Status:* **Todo**)
*   `[ ]` **MW-10:** `Refactor Storyteller View to be Ad-Blocker Proof (Fetch-First Strategy)` (*Status:* **Todo**)
*   `[ ]` **MW-19:** `[Phase 2] Autonomous Virtual Studio Crew (AI Guest Director & Real-Time Score Curator)` (*Status:* **Todo**)
*   `[ ]` **MW-34:** `[Phase 2] Story Spark Prompt Drawer & Visualizer` (*Status:* **Todo**)
*   `[ ]` **MW-35:** `[Phase 2] Teleprompter Pace Visualizer (Dynamic WPM Indicator)` (*Status:* **Todo**)
*   `[ ]` **MW-36:** `[Phase 2] Memory Cinema AI Cover Synthesis (Act III Polish)` (*Status:* **Todo**)

---

## 🛠️ Unified Ticket Rule

1. **Ticket Parity:** Every conceptual task, PR, or code revision must be linked directly to an active `MW-*` ticket ID.
2. **Backlog First:** Before any new work begins, a corresponding ticket must exist in this backlog, or be appended to it with a designated status.
3. **Director Sign-off Flow:** Issues progress through standard states:
   `Todo` ➡️ `In Progress` ➡️ `Done` ➡️ `Verified` ➡️ **`Accepted` (Director Sign-off)**.
