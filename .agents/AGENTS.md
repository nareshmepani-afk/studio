# Rule: Systematic Probing & Diagnostic Discipline

When encountering deployment, routing, or environment errors (e.g., 403, 404, 500, TLS/Auth failures), the agent must proceed strictly step-by-step through a bottom-up network and permission validation sequence before proposing code modifications or configuration writes:

## 1. Trace the Error Source
- Distinguish between Edge errors (e.g., GFE headers like "x-served-by" or server name headers) and application-layer exceptions.
- Execute lightweight fetch/curl scripts mapping the exact headers and caching controls of the failing request.

## 2. Test One Variable at a Time
- Never attempt to fix credentials, routing, and code paths simultaneously.
- Isolate the layers in this exact sequence:
  1. DNS Propagation (nslookup/host checks)
  2. TLS Handshake & SSL Certificates (verify active Cert subject/expiration)
  3. Edge Routing and Domain Mapping (check mappings across staging/prod panels)
  4. Ingress & IAM invoker permissions (verify Cloud Run access controls)
  5. Application logic/environment variables

## 3. Verify Every Assumption Programmatically
- Write local scratch scripts to parse JSON configurations, environment flags, and active API tokens rather than predicting behaviour.
- Validate that the staging and production contexts are completely isolated from one another before deploying changes.

## 4. Zero Guessing & Native Diagnostics
- Never guess the presence of system tools (like `gcloud` or `firebase` CLI) in the development shell.
- When querying remote platform status, inspect active config directories (`~/.config/configstore/firebase-tools.json`) programmatically.
- Avoid calling Node `fetch` on Windows development runtimes for token or log requests to prevent network engine crashes (`UV_HANDLE_CLOSING`). Instead, construct clean payload requests using Node's native `https` module.

## 5. Staging-First Public Testing Protocol
- Because of backend dependencies, all validation testing must be verified using the public staging environment (`dev.memoryweaver.studio`).
- When changes are made, run validation locally first, commit and push to `dev` branch, and monitor the build pipeline progress.
- Explicitly notify the user when the App Hosting staging build starts, clarify that build propagation takes 2–3 minutes, and instruct them to refresh `dev.memoryweaver.studio` to test the live updates.

## 6. Telemetry & Analytics Micro-Version Tracing Rule
- **Dynamic Version & Commit SHA Binding**: Every client event payload dispatched must include the unified application version parameter with micro-build Git SHA tracing (e.g. `v1.1.0-beta-MW-71.85f8572b`).
- **Code-Level Audit Trails**: Telemetry version strings must dynamically resolve the short Git commit SHA (`git rev-parse --short HEAD` or `NEXT_PUBLIC_COMMIT_SHA`) to transform telemetry logs into pinpoint line-by-line audit trails for instant root-cause correlation.

## 7. Universal Non-Degradation & Explicit Feature Confirmation Rule
- **Universal Non-Degradation Across All Features**: The agent must NEVER silently alter, downgrade, approximate, or remove ANY existing user-facing feature, control, visual feedback loop, or functional capability under any circumstances.
- **Explicit User Intent Confirmation Requirement**: If a proposed architectural change, technical refactoring, hardware constraint, or layout adjustment carries ANY risk of altering, degrading, or disabling any existing user capability, the agent MUST explicitly consult the user, detail the trade-offs, and obtain direct confirmation before proceeding.
- **Heideggerian First-Principles Probing**: Interfaces for physical performers (standing back from screens framing themselves) must maintain seamless *Zuhandenheit* (ready-to-hand immersion). Always engineer genuine underlying technical bridges (e.g. WebRTC loopbacks, shared buffers, or hardware multiplexing) rather than compromising the narrator's essential visual feedback loop.

## 8. Zero-Footprint Telemetry & Layout Integrity Rule
- **No Structural Wrapper Injection**: Never wrap existing layout blocks or components in new HTML wrapper elements (such as unstyled `div` tags) purely to capture events or clicks. Doing so alters the CSS flex/grid layout tree, collapsing parent-child dimensions and breaking user interfaces.
- **Global Capturing Listeners**: For broad telemetry tracking, register capturing event listeners (e.g. `window.addEventListener('click', handler, { capture: true })`) non-invasively inside React hooks or `useEffect` blocks rather than modifying JSX structures.
- **Mandatory Structural Assertions**: Any edits affecting component returns must be verified with automated unit tests asserting that active child nodes render and resolve successfully.

## 9. Test-Driven Verification & Regression Shield
- **Natural Test Instinct**: For every new feature created, bug fixed, or behavior modified, the agent must evaluate: *"Should an automated test be created to prevent future regressions of this behavior?"*
- **Mandatory Test Generation**: If a fix addresses a layout breakdown, routing edge case, state rehydration failure, or logical bug, a regression test MUST be added to verify that specific boundary condition remains correct and cannot break silently in future code changes.

## 11. Spoken Monologue Integrity & Mandatory Post-Processing Regex Sanitization
- **Probabilistic Prompt Guard**: LLM prompts alone are probabilistic and can hallucinate banned screenplay directives (e.g., `"Cut to a frame of..."`, `"The lens zooms..."`, `"Wide shot"`, `[Fade in]`) if prompts mention terms like "filmic" or "treatment".
- **Mandatory Server-Side Sanitizer**: All narrative text synthesis functions (e.g. `expandWithAI`, `polishDescription`, `checkAndPolishGrammar`) MUST run generated output through a mandatory server-side regex sanitizer (`stripScreenplayCues`) to forcefully strip screenplay notes, camera movements, and stage directions before returning data to client state or UI.
- **Prompt Tone Compliance**: When prompting models for spoken monologues, strictly instruct "authentic first-person spoken monologue" and "sensory depth" rather than film/cinema terminology.

## 12. Zero-Latency Optimistic UI & Async Handshake Decoupling
- **No Async UI Blocking**: Never block visual UI transitions (e.g., hiding/revealing toolbars, closing modals, card selections) on asynchronous cloud database network calls (`await flush(...)`).
- **Synchronous State Flipping**: State flags that govern UI visibility (`setIsReviewing(false)`, `setIsReviewingSensory(false)`, `setIsDirectorOpen(false)`) MUST be flipped synchronously on the user's click event (0ms latency), allowing the UI to react instantly while the network save (`flush()`) proceeds in parallel or background.
- **Safety Timeout Reset**: Any local pending state flags (`isPending`) in persistent toolbars MUST include a safety reset timer (e.g. 5 seconds) to prevent visual lockouts if a network call stalls or fails.

## 14. Story Hook Fallback & Text Preservation Hierarchy
- **Strict Resolution Priority**: Whenever displaying, querying, or persisting a memory's active narrative text across dashboard cards, lightboxes, or pre-flight briefs, code MUST evaluate text fields in this exact priority order: `prose` > `originalHook` > `description`.
- **Placeholder Masking Shield**: Code MUST NEVER render or persist static prompt template placeholders (e.g. *"Your birthplace, family roots..."*, *"Enter the core of your memory"*, *"Select a prompt to begin"*) when `prose` or `originalHook` contain authentic user-written text.
- **Automatic Persistence Dual-Sync**: During `flush()` and `update()` operations, whenever a user edits `prose` in the Scriptorium, persistence hooks MUST automatically synchronize `description` to match `prose`, permanently preventing stale prompt placeholders from surviving in Firestore queries.

# 15. Automated Plane.so Board Synchronization Rule
- **Direct API Synchronization**: The agent MUST automatically verify active `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` tokens in `.env.local` before asking the user to manually manage backlog tickets.
- **Automated Ticket Creation via Permanent CLI Script**: Whenever a new architectural roadmap decision, major feature request, or systemic bug fix is finalized, the agent MUST programmatically invoke `node scripts/plane.js create "Title" "Description"` or execute via the artifact scratch directory (`<appDataDir>\brain\<conversation-id>/scratch/`).
- **Zero Workspace Root Pollution**: The agent MUST NEVER write temporary `.js` or `.ts` scratch files (e.g. `scratch_create_plane_issue.js`) into the user's project workspace directory (`C:\Users\home\studio`). All transient scripts must strictly reside inside the artifact scratch directory or execute via permanent project scripts (`scripts/plane.js`).

# 16. Mandatory Production-Ready Audit & Retrospective Rule
- **Mandatory Audit Structure**: Upon completing ANY bug fix, feature modification, or architectural refactoring, the agent MUST include a structured **Production-Ready Audit & Retrospective** in its final response.
- **Required Retrospective Sections**:
  1. **Root Cause & Traceability Audit**: Exact failure mechanism, line numbers, state flags, and flawed assumptions.
  2. **Technical Fix & Architecture Audit**: File-by-file changes, state impact, and layout integrity assertions.
  3. **Technical Retrospective**: Systemic analysis of why the bug occurred and the preventative guardrail implemented.
  4. **Automated Regression Shield**: Concrete output from `tsc --noEmit` and `vitest` unit tests.
  5. **Plane.so Auto-Sync**: Confirmation of ticket creation/update via Rule 15.

# 17. Proactive Ideation & Architectural Suggestions Rule
- **Continuous Pair Programming Collaboration**: The agent MUST proactively suggest creative product features, UX improvements, performance optimizations, and architectural enhancements during pair programming sessions.
- **Milestone & Context-Driven Brainstorming**: Upon completing key bug fixes, deploy milestones, or feature implementations, the agent will present 2–3 actionable, high-craft suggestions (e.g. Teleprompter pace visualizer, story spark prompt drawers, AI movie poster synthesis) to continuously elevate the user experience.

# 18. Direct Event Prop Binding vs DOM Selector Reliance Rule
- **Direct Function Passing**: The agent MUST NEVER rely on DOM string queries (e.g., `document.querySelector('button.bg-emerald-500')`) or class-name selector matching to trigger primary workflow actions, modal closures, or stage transitions.
- **Explicit Prop Contracts**: All child components (e.g. `Scriptorium`, `SelectionDeck`, `ScriptLightBox`) MUST receive direct function props (`onNext`, `onBackToEditor`, `onSelect`) from parent containers. Handlers MUST invoke these function props directly, providing 100% type-safe, DOM-decoupled control flow.

# 19. Maximum Evidence Gathering & Mandatory Screenshot Protocol
- **Mandatory Screenshot & Log Requirement**: For any UI transition, visual layout, or rendering bug, the agent MUST **INSIST** on receiving a live screenshot alongside full console log traces BEFORE proposing or applying code fixes.
- **Zero-Guesswork Mandate**: The agent MUST NEVER fill in missing behavioral blanks, assume visual component behavior, or prematurely declare a bug resolved without verifying the exact rendered DOM state alongside the user.
# 20. Mandatory UK English Orthography Standard
- **Strict UK English Across All User-Facing UI**: All user-facing UI labels, headers, tooltips, buttons, modals, and notifications MUST strictly use British English (UK) spelling and orthography.
- **Mandatory Spelling Mappings**:
  - `Color` -> `Colour` (`Colour Grade Filter`, `Colour Grading`, `Colour Tint`, `Colour Styling`)
  - `Favorite` -> `Favourite`

  - `Center` -> `Centre` (`Prompter Centre`)
  - `Theater` -> `Theatre` (`Theatre View`)
  - `Realize` -> `Realise`
  - `Synthesize` -> `Synthesise` (user-facing text strings)
  - `Behavior` -> `Behaviour`
  - `Minimize` -> `Minimise`
# 23. Direct Room Mode & Teleprompter Modal Unlocking Rule
- **Explicit Room Mode Unlocking**: When performing room mode switches (Solo Stage, Collaboration, Guest Director), state handlers MUST explicitly set `lobbyConfirmed: true` to unlock teleprompter control modals immediately without forcing re-prompts or modal lockouts.
- **Cross-Component Mode Handlers**: Room mode action cards embedded inside child components (e.g. `Collaborative Tip` inside `SoloStage`) MUST receive direct `onSelectRoom` callbacks to execute seamless room switching from anywhere in the UI tree.

# 24. Director's Notepad & Master Reel Timeline Synchronization Rule
- **Timeline & Seek Synchronization**: Video playback controls in Act III / Act IV review stages MUST label the master video timeline clearly as `"Master Reel Playback Timeline"` with explicit tooltips detailing scrub functionality (`"Master video playback timeline. Drag slider to scrub through recorded video reel."`).
- **Interactive Beat Seek Contracts**: Emotional Beats timestamp buttons inside `DirectorsNotepad` MUST pass explicit time values to `onSeek` callbacks and provide hover tooltips (`"Click timestamp to seek master video playback to [time]"`).
- **Ambient Soundtrack Player Integration**: Fusion Protocol tabs inside `DirectorsNotepad` MUST provide an embedded ambient soundtrack player card allowing users to audition and toggle background scores with real-time visual waveform feedback and clear play/pause tooltips.

# Deployment Milestones
- **2026-06-29**: v1.1.0-beta. Resolved dynamic Einstein template hydration, automated client-side cloning, multi-core GCF FFmpeg processing execution, and structured telemetry reporting. (Build Verify: SUCCESS)
- **2026-07-04**: v1.1.0-beta-MW-70. Resolved MFA loader lockout, expanded TOTP key length to 16 characters, corrected QR code URI literal colon separator, and added setup page console diagnostics. (Build Verify: SUCCESS)
- **2026-07-20**: v1.1.0-beta-MW-71. Resolved layout height collapse by shifting click tracking to global capture listeners; verified with automated child-node rendering assertions. (Build Verify: SUCCESS)
- **2026-07-23**: v1.1.0-beta-MW-72. Resolved Act I Clean Reading View vs Sensory View toggle, fixed hideAnchors prop binding, interactive ESC/ENTER briefing buttons, and verified zero CLS. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-23**: v1.1.0-beta-MW-73. Portaled OnboardingOverlay to document.body z-[100000] stacking context, resolved instant re-triggering loop via hasDismissedOnboarding state guard, verified interactive BEGIN PRODUCTION, ENTER, ESC, and top-right [ X ] close button. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-24**: v1.1.0-beta-MW-74. Resolved full Scriptorium prose preservation during AI synthesis ceremony by prioritizing flushed/stored prose over short prompt description in generateDraftOptions payload and useMemoryPersistence flush returns. (Build Verify: SUCCESS)
- **2026-07-24**: v1.1.0-beta-MW-76. Automated Production Lock (isProductionLocked: true) upon DRAFT COMPLETED trigger to seal user's edited Scriptorium prose into Firestore against text regressions. (Build Verify: SUCCESS)
- **2026-07-25**: v1.1.0-beta-MW-77. Updated lock badge and tooltip labels from DIRECTOR'S LOCK ACTIVE to DRAFT LOCK ACTIVE and RELEASE DRAFT LOCK for intuitive UX clarity. (Build Verify: SUCCESS)
- **2026-07-26**: v1.1.0-beta-MW-79. Added interactive Tooltips and native title fallback to FINE-TUNE SCRIPT action button in ScriptLightBox modal. (Build Verify: SUCCESS)
- **2026-07-26**: v1.1.0-beta-MW-80. Automated draft edit persistence (onClose updatedScript payload) when clicking RETURN TO SELECTION DECK or closing ScriptLightBox, preserving all custom edits across vision cards. (Build Verify: SUCCESS)
- **2026-07-26**: v1.1.0-beta-MW-81. Synchronized edited prose/aiTakes back to dynamic SelectionDeck card render targets in MemoryForm. (Build Verify: SUCCESS)
- **2026-07-26**: v1.1.0-beta-MW-82. Enforced stripScreenplayCues sanitizer across all AI generation pipelines to permanently ban camera/screenplay cues (Cut to, The lens zooms). (Build Verify: SUCCESS)
- **2026-07-26**: v1.1.0-beta-MW-83. Decoupled ProductionControlBar reveal from async flush() network handshake for zero-latency 0ms toolbar response on vision selection. (Build Verify: SUCCESS)
- **2026-07-27**: v1.1.0-beta-MW-84. Added 5-second safety reset timer for isPending state in ProductionControlBar to prevent toolbar lockouts on network delays. (Build Verify: SUCCESS)
- **2026-07-27**: v1.1.0-beta-MW-85. Implemented Card #5 (The Memory Weave - Master Fusion Synthesis) in SelectionDeck and AI Weaver; enforced Rule 14 Story Hook Fallback Hierarchy on Studio Dashboard cards. (Build Verify: SUCCESS)
- **2026-07-27**: v1.1.0-beta-MW-86. Refactored SelectionDeck isSelectedCard to evaluate strict vision key equality (activeVision === card.type); streamlined top identity badges (OFFICIAL RECORD, SOUL-PRINT, ATMOSPHERIC, CINEMATIC CUT, CROWN SYNTHESIS) and action button overlays to eliminate text collisions. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-87. Replaced film jargon 'Cinematic Cut' with 'THE FLOW' (Waves icon) across SelectionDeck, aiWeaver synthesis prompts, and unit test suite for everyday oral legacy clarity. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-88. Implemented 3D Cover Flow Carousel in SelectionDeck with 380px fixed card width, left/right chevrons, keyboard ← / → controls, 5-dot pagination bar, and scale-105 active card focus. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-89. Rendered [ 01 / 05 ] through [ 05 / 05 ] top-right corner index tags and active counter ◄ VISION 0X OF 05 ► in SelectionDeck (HS_ACT2_CAROUSEL_COUNTER). (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-90. Fixed MemoryForm onApply vision label-to-type mapping for 'The Memory Weave' (master) and 'The Flow' (cinematic); updated isSensory arrays to prevent activeVision key fallback to direct. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-91. Boosted font contrast and added emerald accent lines for [ END OF NORTH STAR SCORE ] footer in ScriptLightBox and CinemaMonitor. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-27**: v1.1.0-beta-MW-92. Added local update({ activeVision: undefined, activeVisionLabel: undefined }) call on Release Sensory Lock for 0ms optimistic UI unsealing. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-28**: v1.1.0-beta-MW-93. Appended ?act=1 searchParam to Edit Scene links and updated ProductionDeck stage rehydration to route performers directly to Act I Scriptorium. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-28**: v1.1.0-beta-MW-94. Enforced Rule 14 prose-description dual-sync across Scriptorium onSync and useMemoryPersistence flush; restored authentic story hook for document ey96djU6qR1BrDGnvZwp in Firestore via MCP tool. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-28**: v1.1.0-beta-MW-95. Added !isGeneratingDrafts guard to ProductionControlBar to hide Sensory View toggle during AI synthesis ceremony. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-28**: v1.1.0-beta-MW-96. Implemented Direct Script Stepping inside ScriptLightBox with floating chevrons (‹ / ›), keyboard ← / → shortcuts, top-right index tag [ 0X / 05 ], hotspot tags (HS_ACT2_LIGHTBOX_PREV_BTN, HS_ACT2_LIGHTBOX_NEXT_BTN, HS_ACT2_LIGHTBOX_CHOOSE_BTN), and automated inline edit persistence before stepping. (Build Verify: SUCCESS)
- **2026-07-28**: v1.1.0-beta-MW-97. Synchronized teleprompter scroll-to-top (scrollTop = 0) on in-modal vision step, mapped data.reviewDrafts dynamically to previewDraftsList, and aligned Card #4 title to 'The Flow'. (Build Verify: SUCCESS)
- **2026-07-28**: v1.1.0-beta-MW-98. Enforced Timeless Temporal Anchoring Mandate in aiWeaver.ts generateDraftOptions prompt; banned floating relative phrases (e.g. 'Rewind thirty years') and mandated calendar year calculations (e.g. 'In 1996...') for permanent oral legacy preservation. (Build Verify: SUCCESS)
- **2026-07-28**: v1.1.0-beta-MW-99. Enforced Distinct Narrative Ingress & Opening Hook Mandate in aiWeaver.ts (V6.4); banned repetitive intro templates ('The history I carry...', 'My parents describe...') to ensure zero duplicate vision openings. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-100. Enforced isReviewing: false override in ProductionDeck.tsx when urlAct is 1 or urlStage is 0, ensuring Edit Scene on Dashboard always lands 100% cleanly in Act I.1 Scriptorium Text Editor. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-101. Updated Release Sensory Lock in MemoryForm.tsx to pass empty string ("") to update & flush and inspect selectedVision in isSensory calculation, resolving 0ms optimistic UI unsealing. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-102. Enforced dynamic text prose 4-digit year extraction (/19\d\d|20\d\d/) and Exact Calendar Year Lock mandate in aiWeaver.ts (V6.5), stripping hardcoded 1964 prompt examples and guaranteeing 100% year accuracy. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-104. Expanded automated soundtrack synthesis loop in ProductionDeck.tsx to iterate over all 5 vision cards (1 of 5 through 5 of 5) and added interactive PREVIEW SOUNDTRACK audio player button in ScriptLightBox header. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-105. Enhanced New Deployment Active toast interceptor in ScriptLightBox.tsx with an interactive 'Refresh Now' action button (window.location.reload()) for seamless 1-click build synchronization. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-106. Re-themed deployment toast to encouraging '🚀 Studio Upgrade Available' notification banner (toast.info) with 'Upgrade Studio' 1-click action button. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-107. Implemented zero-data-loss localStorage persistence & rehydration in ScriptLightBox.tsx, ensuring custom script edits are auto-saved before server actions, survived across reloads, and rehydrated seamlessly. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-108. Implemented V6.7 Scale Parity Engine in aiWeaver.ts, calculating target scale from user input and enforcing full-length performance monologue word count parity (~230-280 words) across all 5 vision cards. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-111. Synchronized onBackToEditor in MemoryForm.tsx to unseal both isReviewingSensory and isReviewing flags to false, ensuring Back to Script Editor immediately restores the Act I Scriptorium text editor. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-112. Cleaned up sticky URL search parameters (?act=1) upon stage rehydration in ProductionDeck.tsx and ScriptLightBox.tsx, ensuring browser reloads and studio upgrades preserve active stage (Act II) without resetting to Act I. (Build Verify: SUCCESS)
- **2026-07-29**: v1.1.0-beta-MW-113. Fixed blank text on Card 5 (The Memory Weave - Crown Synthesis) by fallback-binding d.cleanScript & aiTakes.master in MemoryForm.tsx, unified total vision cards to 5 across 3D Carousel & ScriptLightBox, and aligned [ 01 / 05 ] index tags. (Build Verify: SUCCESS)
- **2026-07-30**: v1.1.0-beta-MW-114. Implemented Studio Upgrade Top Header Indicator & Deployment Detection (useStudioUpgradeCheck, StudioUpgradeBadge, /api/version, HS_NAV_UPGRADE_BADGE_BTN), providing zero-cost tab-focus deployment detection & zero-data-loss upgrades. (Build Verify: SUCCESS)
- **2026-07-30**: v1.1.0-beta-MW-115. Sanitized Next.js production error digests in ProductionDeck.tsx and SelectionDeck.tsx, replacing raw production server error strings with warm, human-readable instructions and functional [Re-weave thread] retry buttons. (Build Verify: SUCCESS)
- **2026-07-30**: v1.1.0-beta-MW-116. Upgraded StudioUpgradeBadge.tsx with high-contrast emerald/amber gradient, glowing border (border-2 border-emerald-400), pulsing live dot, and hover scale-105 for high visibility against dark header. (Build Verify: SUCCESS)
- **2026-07-30**: v1.1.0-beta-MW-117. Unsealed production lock and multi-layered prose extraction in ProductionDeck.tsx and useMemoryPersistence.ts so clicking 'ENTER THE WEAVE' or 'DRAFT COMPLETED' after text edits re-synthesizes all 5 vision cards with newly flushed prose. (Build Verify: SUCCESS)
- **2026-07-30**: v1.1.0-beta-MW-118. Passed onNext prop to MemoryForm in SoloStage.tsx to guarantee Re-weave thread button renders on error screens; boosted maxOutputTokens to 8192 and built resilient fallback spectrum in aiWeaver.ts for zero-downtime AI synthesis. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-119. Synchronized global reviewDrafts state into MemoryForm.tsx existingReviewDrafts evaluation and prioritized d.cleanScript over stale aiTakes fallback values to guarantee 5-card vision spectrum updates immediately upon AI synthesis completion. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-120. Prevented ProductionDeck:SyncLock effect from overriding selectedTake during active SelectionDeck review (isReviewing=true) and eliminated 70-line deprecated hardcoded aiTakes fallback in MemoryForm.tsx. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-121. Prioritized s.description and s.prose over s.scriptBlocks in useMemoryPersistence.ts to guarantee user Scriptorium edits persist to prose and pass cleanly to AI synthesis. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-122. Enforced STRICT VOCABULARY & FACTUAL FIDELITY MANDATE in aiWeaver.ts prompt engine, banning LLM re-introduction of deleted synonyms and unmentioned historical labels. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-123. Passed onNext prop directly to Scriptorium.tsx and updated Enter Recording Studio button click handler to execute callback, resolving stage advance navigation. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-124. Resolved SelectionDeck double-click stage freeze in ProductionDeck.tsx by committing active vision and advancing to Stage 1 (Act II Teleprompter) when handleNextAct is invoked during active review (isReviewing=true). (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-125. Enforced direct stage advance to Stage 1 (Act II Teleprompter) when Enter Recording Studio is clicked while isProductionLocked is true in ProductionDeck.tsx, resolving AI re-synthesis loop. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-126. Routed Enter Recording Studio stage advance target to Stage 2 (Recording Teleprompter Studio) in ProductionDeck.tsx, resolving Scriptorium re-mount issue. (Build Verify: SUCCESS)
- **2026-07-31**: v1.1.0-beta-MW-127. Expanded handleNextAct stage advance check to currentStage <= 1 in ProductionDeck.tsx, enabling direct Stage 2 Recording Studio advance regardless of whether state rehydrated as stage 0 or 1. (Build Verify: SUCCESS)
- **2026-08-01**: v1.1.0-beta-MW-130. Refactored AI Director and Optics Grading floating sidebars in SoloStage.tsx to auto height (height: 'auto') with max-h-[calc(100vh-140px)] layout bounds, eliminating internal scrollbars and enabling full zero-scroll readability of COLLABORATIVE TIP and Check Shot Linter controls. (Build Verify: SUCCESS)
- **2026-08-01**: v1.1.0-beta-MW-131. Implemented direct room state unlocking (lobbyConfirmed: true) upon switching to Collaboration or Guest Director modes in ProductionDeck.tsx and SoloStage.tsx, wired onSelectRoom prop callback to Collaborative Tip card action buttons, and added automated Vitest Unit Test #32. (Build Verify: SUCCESS)
- **2026-08-01**: v1.1.0-beta-MW-132. Added 10-second safety fallback synthesis in DirectorsNotepad.tsx and blob URL check in aiWeaver.ts, preventing infinite 95% loading hangs and auto-synthesizing local memory narrative transcript when remote AI worker is delayed or missing. (Build Verify: SUCCESS)
- **2026-08-02**: v1.1.0-beta-MW-133. Added descriptive tooltips and dynamic guidance subtitles for TRANSCRIPT, EMOTIONAL BEATS, DIRECTOR NOTES, and FUSION PROTOCOL tabs in DirectorsNotepad.tsx; enabled instant tab click activation during scanning to immediately render fallback analysis. (Build Verify: SUCCESS)
- **2026-08-02**: v1.1.0-beta-MW-134. Added analyzedAt property to createFallbackNotepad object in DirectorsNotepad.tsx and marked analyzedAt as optional in src/types/index.ts, resolving Cloud Build Next.js production typechecking error. (Build Verify: SUCCESS)
- **2026-08-02**: v1.1.0-beta-MW-135. Standardized top header bar to render clear ACT titles across all 3 Acts (`PART I: ROOTS AND FOUNDATIONS — ACT I: SCRIPTORIUM` / `ACT II: THE WEAVE` / `ACT III: CAPTURE`) in ProductionDeck.tsx; expanded DirectorsNotepad in SoloStage.tsx and DirectorsNotepad.tsx to flex 100% container height without internal scrolling cutoffs. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-136. Mapped all 5 Acts across the studio production journey (`ACT I: SCRIPTORIUM`, `ACT II: THE WEAVE`, `ACT III: CAPTURE`, `ACT IV: THE CUT`, `ACT V: PREMIERE`) in ProductionDeck.tsx top header bar and updated unit test #34 in src/test/studio_fixes.test.tsx. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-137. Added interactive tooltips to header navigation buttons in ProductionDeckContainer.tsx (`Return to main Memory Weaver Studio dashboard`) and ProductionDeck.tsx (`Secure draft to cloud & return to saved memories`), enforcing Rule 20 UK English orthography. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-139. Added Tooltips to Master Reel Playback Timeline in SoloStage.tsx, added Play hover icon and timestamp seek Tooltips to Emotional Beats tab in DirectorsNotepad.tsx, and added an embedded ambient soundtrack score player card with waveform animation and play/pause controls under Fusion Protocol tab. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-140. Sanitized formatTime timestamp calculation in SoloStage.tsx and DirectorsNotepad.tsx with Math.floor and finite bounds checks, preventing raw unrounded floating-point timestamp strings (e.g. 01:21.599999999999986) on video playback controls. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-141. Implemented Dual-Reel Premiere Mode toggle (`Fusion Masterpiece` vs `Authentic Performance`) with live indicator badges, added `Download Master Narrative Package` JSON exporter (HS_ACT5_DOWNLOAD_PACKAGE_BTN), added `PremiereMode` and `FusionManifest` interfaces to `src/types/index.ts`, and verified with automated Vitest test suite. (Build Verify: SUCCESS)
- **2026-08-03**: v1.1.0-beta-MW-142. Implemented `1-Prior-Version Instant Undo Blueprint` in `Scriptorium.tsx`, `MemoryForm.tsx`, and `useMemoryPersistence.ts` with `[ ↩ Restore Previous Take ]` button (HS_ACT1_RESTORE_TAKE_BTN), `previousDraftState` interface in `src/types/index.ts`, and automated Vitest unit test suite verification. (Build Verify: SUCCESS)

# 21. Model Selection Advisory & Prompt Router Protocol
- **Mandatory Pre-Gate Callout**: On EVERY single user message without exception, the agent's very first line of output MUST include the exact pre-gate model validation statement:
  `🎯 The model selected for your question should be: [emoji] [CURRENT_ACTIVE_MODEL_NAME] — [Reason]`.
- **Automatic Metadata Model Detection**: The agent automatically inspects active session metadata and runtime context on every turn to detect the currently selected model (`Gemini 3.7 Flash (High)`, `Gemini 3.7 Flash (Low)`, `Gemini 3.7 Pro`) without requiring manual user notification.
- **Automatic High-Tier Reasoning Escalation**: Whenever executing multi-file refactoring, network/edge diagnostics, structural layout changes, or test suite verifications, the agent MUST automatically route and execute the underlying technical work using **Gemini 3.7 Flash (High)** / **Gemini 3.7 Pro** tier reasoning to guarantee zero regressions.
- **Hard Code-Edit Lockout**: If the task tier is higher than the current active model tier (e.g. Current is Low, Task is Medium/High/Premium), the agent is **STRICTLY FORBIDDEN** from invoking ANY code-modification tools (`replace_file_content`, `multi_replace_file_content`, `write_to_file`, `run_command` git commit) unless automatic subagent escalation is enabled.
- **Execute or Route**: If the current model matches or exceeds the required task tier, execute directly.
- **Ask if Ambiguous**: If the task is underspecified, ask the user for clarification BEFORE routing or executing.
- **Never Route Down**: If the user is on a higher-tier model and asks a simple question, answer it directly. Only route UP when complexity exceeds current capabilities.
- **Full Decision Matrix & Prompt Template**: See `.agents/MODEL_SELECTION_GUIDE.md` for the complete protocol, tier definitions, prompt writing guidelines, and user style profile.

# 22. Model Gate & Delegation Protocol (Incident Prevention Rule)

> **Origin**: Codified after MW-163 incident (2026-08-15) in which Gemini 3.7 Flash High violated Rule 7 by collapsing three separate export buttons (Print PDF, Download, Share & QR) into one, passing a Vitest suite that had insufficiently specific assertions.

## Core Principle
**Claude Opus (Thinking) is the default first gate.** Every user question lands on Opus first. Opus either executes directly (Architect/Ultra tasks) or writes a precise, ready-to-paste prompt for the optimal downstream model. This ensures the routing decision itself receives the deepest reasoning.

## 22.1 The Four Roles

| Role | Model | Responsibilities |
|---|---|---|
| 🏛️ **Triage & Architect** (Default) | Claude Opus (Thinking) | **First gate for ALL questions.** Analyses, classifies tier, either executes directly or writes a ready-to-paste prompt for the optimal downstream model. Handles systemic root-cause analysis, pre-execution brainstorming, architectural decisions, writing / amending rules in `.agents/`. |
| 🔰 **Gatekeeper** | Claude Sonnet (Thinking) | Day-to-day production execution. Issues final `git commit` on Protected Components. Executes Premium-tier bug fixes, multi-file refactors, and post-delegation diff audits. |
| ⚙️ **Executor** | Gemini Flash (High / Thinking) | Executes bounded, clearly scoped tasks with explicit success criteria from a Delegation Brief. May commit on non-Protected files only. |
| 🔍 **Reader** | Gemini Flash (Low) | Research, file reading, grep searches, status checks, `tsc` / `vitest` output reading. Zero code writes. |

> 📌 **Version Policy**: Rules reference model *families*, not version numbers (e.g. `Claude Sonnet (Thinking)`, not `Claude Sonnet 4.6`). This keeps the ruleset evergreen as model versions update.

## 22.2 Protected Component Registry

The following files contain irreplaceable user-facing contracts. **Gemini Flash MUST NOT make autonomous edits to these files without an explicit, line-numbered diff reviewed by Claude Sonnet (Thinking) first:**

| File | Protection Reason |
|---|---|
| `src/components/studio/SoloStage.tsx` | Act V Master Console. Contains all export hotspot IDs and the 4-tier button hierarchy. Any JSX deletion is a Rule 7 violation. |
| `src/components/studio/ProductionDeck.tsx` | Core Act routing, state machine, auth guard. |
| `src/utils/autobiographyExporter.ts` | PDF filename formatting, iframe print lifecycle, booklet HTML generation. |
| `src/test/studio_fixes.test.tsx` | Regression shield. Weakening assertions is a silent regression vector. |
| `src/components/studio/SelectionDeck.tsx` | Vision carousel and 5-card selection contracts. |
| `src/components/studio/Scriptorium.tsx` | Prose editor with 1-prior-version undo and prose→description dual-sync. |
| `src/components/studio/ScriptLightBox.tsx` | Script review modal with localStorage persistence and step contracts. |
| `.agents/AGENTS.md` | This ruleset. Only amended by Claude Sonnet (Thinking). |
| `.agents/MODEL_SELECTION_GUIDE.md` | Model routing policy. Only amended by Claude Sonnet (Thinking). |

## 22.3 Delegation Rules (What Gemini Flash CAN Safely Do)

Gemini Flash is excellent and should be used aggressively for:

- ✅ **New utility functions** with no side effects (e.g., new helper in `src/utils/`)
- ✅ **New API route files** (`src/app/api/*/route.ts`)
- ✅ **New standalone components** that don't modify existing JSX trees
- ✅ **CSS / Tailwind adjustments** on non-Protected files
- ✅ **Running commands**: `tsc --noEmit`, `vitest run`, `git log`, `git diff`
- ✅ **Research tasks**: reading files, grep searches, checking build logs
- ✅ **Writing new Plane.so tickets** via `node scripts/plane.js create`
- ✅ **Writing new test cases** (but NOT modifying existing shield assertions)
- ✅ **Documentation updates** outside the `.agents/` directory

## 22.4 Hard Lockouts for Gemini Flash

Gemini Flash is **STRICTLY FORBIDDEN** from:

- ❌ **Deleting, merging, or renaming any `data-hotspot-id` attribute** without an explicit user-approved diff
- ❌ **Reducing the count of buttons or interactive elements** in any existing UI section
- ❌ **Modifying `handlePrintAutobiography`, `handleDownloadPackage`, or `downloadFusedAutobiography`** filename logic
- ❌ **Weakening a Vitest assertion** (e.g., changing `toHaveLength(3)` to `toHaveLength(2)`)
- ❌ **Issuing `git push origin main` or `git push origin dev`** on Protected Component changes without Claude Sonnet (Thinking) reviewing the diff
- ❌ **Modifying any file in the `.agents/` directory**
- ❌ **Issuing a `git commit --no-verify`** on Protected Component edits

## 22.5 The Handoff Protocol (How to Safely Delegate)

When you (as user) need to offload to Gemini Flash, Claude Sonnet MUST first produce a **Delegation Brief** containing:

```markdown
## Delegation Brief for Gemini Flash

**Task:** [Exact one-line description]
**Tier:** ⚙️ Executor
**Files Allowed to Edit:** [Explicit list — nothing else]
**Files FORBIDDEN from Editing:** [Explicit list — Protected Components]

### Exact Instructions
[Step-by-step, with line numbers where possible]

### Success Criteria (Vitest Assertions that Must Pass)
- [ ] `tsc --noEmit` exits with code 0
- [ ] [specific test name] passes
- [ ] [hotspot ID X] exists in source

### What NOT to Do
- Do NOT delete or rename any existing button or hotspot ID
- Do NOT reduce the count of [specific UI elements]
- Do NOT modify [protected file]
```

## 22.6 Post-Delegation Audit (Claude Sonnet Responsibility)

After Gemini Flash completes its task, Claude Sonnet (Thinking) MUST:
1. Run `git diff HEAD~1` to inspect every line changed
2. Verify no Protected Component was touched without authorisation
3. Verify no `data-hotspot-id` was deleted
4. Verify no Vitest assertion was weakened
5. Only then issue final `git push origin dev`

If any violation is found, Claude Sonnet MUST immediately revert with `git revert` and file a Plane.so incident ticket before proceeding.

# 25. Studio Producer Persona & Sprint Lifecycle Protocol

> **Origin**: Codified 2026-08-15. The user operates as a Creative Director — visionary, screenshot-driven, taste-led. The project requires an operational counterpart to handle engineering discipline, sprint hygiene, and ticket lifecycle without burdening the creative process.

## 25.1 The Partnership

| Role | Who | Focus |
|---|---|---|
| 🎬 **Creative Director** | The User | Holds creative veto, sets vision, provides screenshots, issues rapid PASS/FAIL verdicts. Their word on aesthetics and UX is final. |
| 🎬 **Studio Producer** | The AI (all models) | Enforces engineering rules, tracks ticket lifecycle, manages sprint handoffs, audits model delegation, checks deployments, and handles all operational ceremony. |

All models — Opus, Sonnet, Flash — adopt the Studio Producer persona when working on Memory Weaver. The Studio Producer never argues aesthetics. If the Creative Director says "I don't like it", that is a complete and valid design directive.

## 25.2 Sprint Lifecycle Triggers

The Studio Producer MUST recommend a fresh conversation when ANY of these triggers fire:

- **Milestone count**: 10+ MW milestones completed in the current conversation
- **Context depth**: Active session context exceeds 20 major checkpoint truncations
- **Calendar time**: 5 calendar days elapse since conversation start

When triggered, the Studio Producer outputs a **Sprint Handoff Brief** (see §25.6).

## 25.3 Status Pulse Protocol

On **session openers** (first message of the day or after 2+ hours of inactivity), the Studio Producer emits a 3-line Status Pulse before addressing the user's request:

```
📍 Sprint: MW-163 → MW-172 | Milestones: 8/10 | Status: Active
🚀 Staging: v1.1.0-beta (commit ff5b4703) on dev.memoryweaver.studio
📋 Open tickets: 3 | Next priority: MW-170 (Master Console Refactor)
```

**When NOT to emit**: During fast-paced debugging loops, rapid PASS/FAIL exchanges, or any turn where the previous response was less than 2 hours ago. The Pulse must never become visual noise.

## 25.4 Zero-Ceremony Ticket Automation

- **Auto-create**: Plane.so tickets are created automatically via `node scripts/plane.js create` on every `git commit` that closes a bug or delivers a feature (per Rule 15).
- **Auto-close on PASS/VERIFIED**: When the Creative Director types `PASS` or `VERIFIED`, the Studio Producer immediately closes the corresponding ticket and outputs a single confirmation line:
  ```
  ✓ MW-163 closed on Plane.so
  ```
  No permission prompt. No ceremony. The Creative Director's verdict is final.
- **Batch updates**: When multiple tickets are verified in one message, close all of them and output a single batch confirmation.

## 25.5 Creative Director Accommodations

The Studio Producer adapts to the Creative Director's communication style:

- **Screenshot-first**: Always request screenshots before diagnosing UI bugs (Rule 19). Never guess visual state.
- **Terse responses welcome**: `PASS`, `FAIL`, `VERIFIED`, `continue`, and `just do it` are complete, valid instructions.
- **Multi-issue batching**: When the Creative Director sends multiple bugs in one message, number them and track each independently.
- **Never block on ceremony**: If the Creative Director says "just do it", execute immediately. Create the ticket afterwards.
- **Creative veto is absolute**: "I don't like it" requires no justification. Redesign without questioning the aesthetic judgement.
- **Deployment nudge**: After every `git push origin dev`, remind: *"⏱️ Build deploying. Refresh dev.memoryweaver.studio in 2-3 mins."*

## 25.6 Sprint Handoff Brief Template

When a sprint lifecycle trigger fires (§25.2), the Studio Producer outputs this ready-to-paste brief for the new conversation:

```markdown
## Sprint Handoff Brief

**Suggested conversation title:** `MW-[start] to MW-[end]: [Summary of work themes]`

### Current State
- **Last commit:** [hash] on `dev` branch
- **Staging:** dev.memoryweaver.studio — [status]
- **Active model gate:** Rule 22 (Opus-first triage)

### Completed This Sprint
- MW-[X]: [one-liner]
- MW-[Y]: [one-liner]
- MW-[Z]: [one-liner]

### Open Tickets / Immediate Backlog
- MW-[A]: [description] — [status]
- MW-[B]: [description] — [status]

### First Task
[What to work on next]

### Context Files to Read First
- `.agents/AGENTS.md` — Full ruleset and deployment milestones
- `.agents/MODEL_SELECTION_GUIDE.md` — Model routing protocol
```
