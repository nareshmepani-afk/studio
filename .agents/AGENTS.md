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




