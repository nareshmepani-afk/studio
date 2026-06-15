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

### Sprint 5: Role-Specific Production Suites (Epic: MW-11)
*   `[ ]` **MW-11:** `[EPIC] Implement Role-Specific Production Suites`
    *   *Status:* **Todo** (Refactored from `UX-EPIC-01`)
*   `[ ]` **MW-12:** `Develop "Command Center" UI for Host Role`
    *   *Status:* **Todo** (Refactored from `STU-60`)
*   `[ ]` **MW-13:** `Develop "The Deck" UI for Interviewer Role`
    *   *Status:* **Todo** (Refactored from `STU-61`)
*   `[ ]` **MW-14:** `Develop "The Stage" UI for Storyteller Role`
    *   *Status:* **Todo** (Refactored from `STU-62`)
*   `[ ]` **MW-15:** `Develop "The Gallery" UI for Guest Role`
    *   *Status:* **Todo** (Refactored from `STU-63`)
*   `[ ]` **MW-16:** `Implement Real-time State Synchronization Between All Studio UIs`
    *   *Status:* **Todo** (Refactored from `STU-64`)
*   `[ ]` **MW-20:** `Port Root Command Center UI into Role-Specific Subfolder`
    *   *Status:* **Todo**
    *   *Description:* Migrate the full dashboard codebase from components/studio/CommandCenter.tsx into components/studio/roles/CommandCenter.tsx.
*   `[ ]` **MW-21:** `Resolve WebRTC Live Monitor Feed Asymmetry`
    *   *Status:* **Todo**
    *   *Description:* Refactor CollaborativeStage.tsx line 183 to pass 'localStream' into the call.answer() function, enabling downstream video mirroring.
*   `[ ]` **MW-22:** `Wire SET_SCRIPT Event to Global Action Loop`
    *   *Status:* **Todo**
    *   *Description:* Update the sendSyncEvent helper inside CommandCenter.tsx to properly process and broadcast script textarea mutations to the shared Firestore state machine.

---

## 🛠️ Unified Ticket Rule

1. **Ticket Parity:** Every conceptual task, PR, or code revision must be linked directly to an active `MW-*` ticket ID.
2. **Backlog First:** Before any new work begins, a corresponding ticket must exist in this backlog, or be appended to it with a designated status.
3. ** डायरेक्टोरियल Sign-off Flow:** Issues progress through the standard states:
   `Todo` ➡️ `In Progress` ➡️ `Done` ➡️ `Verified` ➡️ **`Accepted` (Director Sign-off)**.
