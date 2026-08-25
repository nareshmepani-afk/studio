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

## 5. Staging-Only Public Testing Protocol & Mandatory Rollout Verification Gate
- **No Localhost Testing**: The agent MUST NEVER instruct the user to test on `localhost`, `127.0.0.1`, or any local development server. The application has backend dependencies (Firebase Auth, Firestore, Cloud Functions, App Hosting) that do not function correctly in local dev mode.
- **Exclusive Staging URL**: ALL user-facing testing and validation MUST be performed exclusively on the public staging environment: **`https://dev.memoryweaver.studio/`**.
- **Mandatory Pre-Push Local Production Build Gate (`npm.cmd run build`)**:
  - `tsc --noEmit` alone is INSUFFICIENT because it does not execute Next.js ESLint checks (e.g. `react-hooks/rules-of-hooks`), SSG static page prerendering, or bundle trace collection.
  - Before running `git push` on ANY deployment-bound commit, the agent MUST execute `npm.cmd run build` (or `npm run build`) locally and confirm that all 33+ routes compile cleanly to exit code 0. Pushing code that has not passed a full local `npm.cmd run build` is strictly prohibited.
- **The Checklist Release Lock (Absolute Zero Premature Handover)**:
  - **TOTAL PROHIBITION**: The agent is STRICTLY FORBIDDEN from creating, updating, linking, referencing, or presenting ANY Testing Checklist, test steps, test URLs, or "Ready to test" message to the user until a programmatic live probe against `https://dev.memoryweaver.studio/api/version` confirms that the active `commitSha` matches the newly committed Git SHA.
  - Outputting ANY checklist artifact, HTML link, or test questionnaire before `/api/version` confirms the rollout is an immediate violation of this rule.
- **Strict 5-Step Commit-Push-Verification Workflow**:
  1. **Pre-Push Build**: Run `npm.cmd run build` locally. Confirm all 33+ routes compile with exit code 0. Fix any errors before pushing.
  2. **Push to Dev**: Commit and push code to the `dev` branch.
  3. **Zero-Checklist Response**: In the push response, the agent MUST NOT output or link any checklist. The agent only reports the pushed commit SHA and initiates rollout verification.
  4. **Automated Continuous Polling (Calibrated 5-Minute Initial Window)**:
     - Cloud Build compilation, container packaging, and edge traffic routing on Firebase App Hosting consistently takes ~4.5 to 5.0 minutes.
     - The agent MUST set the initial poll timer for **4.5 to 5 minutes (`DurationSeconds: 270` to `300`)** immediately upon pushing. Do NOT use 30s or 45s micro-intervals to avoid spamming the user with incremental wakeups.
     - If `/api/version` has not yet updated after the initial 5-minute window, schedule subsequent check-ins every **60 seconds (`DurationSeconds: 60`)** until the rollout completes.
     - The agent continues polling autonomously until `/api/version` confirms the rollout, only escalating to the user if a remote build error is detected.
  5. **Rollout Verified Handoff**: ONLY after `/api/version` returns the exact target `commitSha` may the agent generate/update the Testing Checklist and hand off to the user for staging verification.
- **Mandatory Fully-Qualified Test URLs & Zero Placeholder Policy**:
  - Whenever generating, updating, or presenting ANY Testing Checklist, test steps, or test instructions (both in chat responses and in interactive checklist artifacts), the agent MUST NEVER output relative paths (e.g. `/cinema/tv?id=...`) or truncated ellipsis placeholders (`...`).
  - Every test item MUST specify the complete, fully-qualified public staging URL (e.g. `https://dev.memoryweaver.studio/cinema/tv?id=ey96djU6qR1BrDGnvZwp`) containing the active sample memory ID or target route.
  - In interactive checklist artifacts (`qa_checklist_interactive.html`), each individual test item card MUST render a dedicated, clickable `🔗 Open Test Route ↗` button pointing directly to that fully-qualified URL.

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

# 25. Zero Uncertainty — Team Escalation Protocol
- **We Are a Team of Three**: The user, Claude (Gatekeeper), and the agent operate as a collaborative team. The agent MUST NEVER declare a status as "uncertain" or "unknown" and leave it unresolved. If the agent cannot programmatically verify a state (e.g., build deployment, data integrity, Firestore document status), it MUST immediately escalate to the team with a clear, actionable question.
- **Ask, Don't Declare Uncertainty**: Instead of saying "Build status: UNCERTAIN", the agent MUST say "Could you check [specific thing] and confirm [specific question]?" — giving the user a concrete action to take.
- **Exhaust All Diagnostic Avenues First**: Before escalating, the agent MUST attempt every available diagnostic tool (MCP tools, API calls, log inspection, version string checks). Only if ALL programmatic avenues fail should the agent escalate to the user.
- **Never Leave Work Hanging**: Every escalation MUST include: (1) what was attempted, (2) why it failed, (3) exactly what the user needs to check, and (4) what the next step is once the answer is known.
# 26. Model Triage & Token Economy Architecture
- **Dual Tier-1 Entry Point (Opus 4.6 / Sonnet 4.6)**:
  - **Claude Opus 4.6 (Thinking)**: Primary Strategic Director, Deep Architecture & Systemic Planner, High-Reasoning Pair Programming Lead.
  - **Claude Sonnet 4.6 (Thinking)**: Agile Strategic Architect, Code Reviewer, Gatekeeper for Protected Components (Rule 22.2), and Fast-Paced Execution Lead.
  - **Core Duty of Tier-1**: Understand user requirements, formulate airtight architecture/implementation plans, make strategic decisions, review final diffs, and orchestrate subagent workflows.
- **Mandatory Subagent Dispatch Matrix**:
  - **Research & Discovery (`Model: 'flash'`)**: Codebase search, file scanning, context gathering, and summarization. Never dump hundreds of lines of raw code into the Tier-1 context window; subagents must return concise $\le$ 200-token summaries.
  - **Heavy Code Generation (`Model: 'pro'`)**: Complex multi-file refactoring, deep algorithmic pipelines, and intricate TypeScript state machines.
  - **Rapid UI & Component Coding (`Model: 'flash'`)**: Standard React components, Tailwind styling, boilerplate, unit tests, and regression shield fixtures.
  - **Utility & Verification (`Model: 'flash_lite'` or `'flash'`)**: Running `tsc`, `vitest`, git commits/pushes, Plane.so CLI automation, and background deployment polling.
- **Strict Line-Bounded Inspection**: When Tier-1 models directly inspect files, they MUST use tightly bounded `StartLine` and `EndLine` slices ($\le 30$ lines) to prevent context inflation.
- **Autonomous Subagent Error Loops**: Subagents dispatched for coding or verification must resolve their own lint/type errors internally before returning a clean "Build Verified: SUCCESS" status to Tier-1.

# 27. Dual-Sweep Cognitive Protocol (Adversarial Pre-Mortem Discipline)
- **Mandatory 2-Pass Reasoning Before Execution**: The agent MUST perform a dual-sweep reasoning cycle before proposing architectural writes, edits, or multi-component fixes:
  - **Sweep 1: Topology & Root-Cause Tracing**: Map the end-to-end failure path across UI state, server actions, URL parameters, and database schemas. Formulate the primary architectural solution.
  - **Sweep 2: The Adversarial Crucible (Pre-Mortem Gate)**: Actively red-team the proposed solution against 4 non-negotiable stress tests before writing a single line of code:
    1. **Boundary Gate**: What happens if props, data arrays, or video metadata are `null`, `undefined`, empty string `""`, `0`, or `[]`?
    2. **Global Lifecycle Gate**: Does this component or effect touch global DOM/body state (e.g. `document.body.style.overflow`), leave hanging listeners, or break flex/grid layouts?
    3. **E2E Handshake Gate**: Does the state flow survive hard browser refreshes (`Ctrl+Shift+R`), auth redirects (e.g. `?redirect=`), and cross-session deep links?
    4. **Universal Non-Degradation Gate (Rule 7)**: Does this modification alter, remove, or degrade ANY existing user capability, visual feedback loop, or performance guarantee?
# 30. Mandatory Interactive QA Verification Artifact Standard (`qa_checklist_interactive.html`)
- **Strict Prohibition of Raw Text / Chat Step Lists**: The agent is **STRICTLY FORBIDDEN** from presenting testing checklists, QA step lists, or verification questionnaires as plain chat text or raw markdown bullet lists in chat mode.
- **Exclusive Interactive Artifact Handoff**: ALL staging verification handoffs MUST be delivered exclusively via the standalone interactive HTML artifact: `qa_checklist_interactive.html` generated in the active artifact directory (`<appDataDir>\brain\<conversation-id>/qa_checklist_interactive.html`) and adhering strictly to the Master Framework in `qa_interactive_framework.md`.
- **Mandatory Master Framework Inclusions**:
  1. **Zero Placeholders**: Every single test item MUST provide the complete, fully-qualified public staging URL (e.g. `https://dev.memoryweaver.studio/cinema/tv?id=ey96djU6qR1BrDGnvZwp` or `https://dev.memoryweaver.studio/how-it-works`). Never output truncated relative paths (`/cinema?id=...`).
  2. **Dedicated Per-Test Route Buttons**: Clickable `[ 🔗 Open Test Route ↗ ]` rendered on every test card.
  3. **Per-Test Telemetry Vector Ingestion Box**: Dedicated paste input box on EVERY test card auto-parsing `traceId`, `userId`, `userEmail`, `path`, `version` into live glowing visual chips (`🏷️ Trace`, `👤 User`, `🆔 UID`, `📍 Path`, `🔖 Ver`) with 0ms targeted DOM updating without losing textarea focus.
  4. **Per-Test Screenshot Attachment Engine**: `[ 📷 Add Screenshot ]` dropzone on every card with Base64 in-browser storage, persistent thumbnail strip, delete controls (`×`), and full-screen image Lightbox modal.
  5. **Header HUD with Telemetry & Latency**: Dynamic circular SVG progress ring (0–100%), numerical completion fraction, live `[ ⚡ Ping Edge ]` latency meter against `/api/version`, and Global Session Telemetry paste box.
  6. **1-Click Markdown Report Generator**: `[ 📋 Copy Markdown Report ]` button formatting structured markdown with pass/fail counts, notes, attachment tallies, and per-test telemetry lines ready to paste directly into chat.
  7. **State Portability & LocalStorage**: Automatic namespaced `localStorage` persistence, `[ 💾 Export State ]` and `[ 📂 Import State ]` JSON session transfer, and `[ Reset ]` confirmation.
- **Prerequisite Deployment Gate (Rule 5)**: The artifact MUST NOT be generated, linked, or handed off until a programmatic live probe against `https://dev.memoryweaver.studio/api/version` confirms that the active `commitSha` matches the newly committed Git SHA.

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
- **2026-08-15**: v1.1.0-beta-MW-164. Fixed Print/Download tooltips to remove misleading "Save as PDF" instruction; codified Rule 5 Zero Localhost mandate — all testing exclusively on dev.memoryweaver.studio. (Build Verify: SUCCESS)
- **2026-08-15**: v1.1.0-beta-MW-165. Redesigned booklet Page 1 poster to match CinemaPoster component — AN ORIGINAL MEMORY badge, full credits block, Chronicle Cinema Release seal, removed dark vignette. (Build Verify: SUCCESS)
- **2026-08-15**: v1.1.0-beta-MW-166. Added top gradient background to poster-top-badge for "AN ORIGINAL MEMORY" legibility. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-15**: v1.1.0-beta-MW-167. Consolidated Download button into Print/Save PDF — 2-button layout (Print + Share & QR). Removed dead `downloadAutobiographyAsHtml` function, stale test assertion, and unused `jspdf` + `html2canvas` dependencies. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-15**: docs(Rule 22.7). Mandatory Delegation Checkpoint — anti-solo guardrail forcing delegation plans before code-modification tools. (Build Verify: SUCCESS)
- **2026-08-15**: docs(Rule 26). Automated Self-Healing & Verification Loop Protocol — 7-state execution harness, 3-iteration retry ceiling, anti-corruption invariant shields, tiered verification pipeline, Self-Healing Report templates. (Build Verify: SUCCESS)
- **2026-08-17**: v1.1.0-beta-MW-174. Fixed Launch Fullscreen Premiere 404 (dead /memory/ route → /cinema?id=); Phase 1 Chromecast honest labelling with browser-native cast instructions in Living Room TV Premiere modal. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-17**: docs(Rule 27). Mandatory Work Completion Handoff Protocol — auto-deliver testing checklist, next tasks, and proactive thoughts after every work item. (Build Verify: SUCCESS)
- **2026-08-17**: v1.1.0-beta-MW-170. Removed 9 unused lucide-react icons + AlertDialogTrigger from SoloStage.tsx; fixed hardcoded dev.memoryweaver.studio URL in cast modal to use window.location.origin. (Build Verify: SUCCESS)
- **2026-08-17**: v1.1.0-beta-MW-175. Cinema Page UX Audit (4 sub-fixes): (1) Separated stacked scrubber/stage-controls toolbars (bottom-28/bottom-3), (2) Fixed amber-on-amber invisible Bookmark button text with conditional colours, (3) Added ← Back to Studio link on cinema landing page + modal for authenticated directors returning to Act V, (4) Added cast instructions block on /cinema/tv page, (5) Segmented toolbar into Director Mode (full controls) vs Guest Viewer (Share + Bookmark only), (6) Extended ProductionDeck.tsx ?act=2..5 URL routing with regression test #124. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-17**: v1.1.0-beta-MW-176. Fixed /cinema/tv "No Media to Play" root cause: added GET /api/guest-access?id= handler (inline adminDb collectionGroup query) — route previously had POST-only, causing silent 405 → memory=null on TV player. (Build Verify: SUCCESS)
- **2026-08-17**: v1.1.0-beta-MW-177. Aligned /cinema/tv videoUrl resolution with MemoryCinematicViewer fallback chain (recordingUrl → video → mediaAttachments); removed dead productionTakes[].videoUrl fallback (AI text objects, not video). (Build Verify: SUCCESS)
- **2026-08-17**: v1.1.0-beta-MW-178. Cinema UX: isSaved defaults to false in MemoryCinematicViewer (Bookmark shows 'Save Story' on first open); added persistent 📺 Cast Guide pill + expandable panel (HS_CINEMA_TV_CAST_GUIDE_BTN) outside auto-hiding HUD on /cinema/tv. (Build Verify: SUCCESS)
- **2026-08-23**: v1.1.0-beta-MW-193. Admin Email Operations & Live Template Dispatcher Suite in admin.memoryweaver.studio; 4 core Obsidian-Gold email templates, sendAdminTestEmailAction, retriggerClientOnboardingPassAction, getDomainDnsDiagnosticsAction, live sandboxed iframe preview, and Access Support integration. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-23**: v1.1.0-beta-MW-194. Bulk Email Dispatch & Audience Batching Engine in admin.memoryweaver.studio suite=email; RFC 4180 audience CSV ingestion parser, tag auto-detection & deduplication, chunked rate-limited batch dispatcher with Resend API queue pacing, live streaming batch progress modal with individual delivery receipts & pause/resume idempotency, and automated Vitest regression shield. (Build Verify: SUCCESS)
- **2026-08-23**: v1.1.0-beta-MW-194. Zero-Cost Dual-Directional Email Infrastructure & Centralized Domain Registry (studio@, support@, director@, dmarc@, noreply@); Cloudflare Email Routing inbound, Resend SMTP outbound via Gmail Send-As with automatic reply privacy shield, verified live round-trip delivery (SPF: PASS, DKIM: PASS, DMARC: PASS), and 38 Vitest automated regression tests. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-08-25**: v1.1.0-beta-MW-195. Isolated administrative routes (/admin/*) from consumer Navbar in Navbar.tsx; guaranteed distraction-free authentication on dev.memoryweaver.studio/admin/login and restored 100% staging-to-production visual parity with admin.memoryweaver.studio. (Build Verify: SUCCESS)
- **2026-08-25**: v1.1.0-beta-MW-196. Scoped LanguageToggle strictly to Studio & narrator workspaces (/studio, /dashboard, /create, /review) in Navbar.tsx; enriched types/index.ts with standardized LocalizedPromptText and LocalizedPrompt schemas for diaspora multi-language architecture; 229 Vitest automated regression tests. (Build Verify: SUCCESS)
- **2026-08-25**: v1.1.0-beta-MW-197. Unified Studio Language Selection by eliminating redundant disconnected Select dropdown in StudioDashboard.tsx; enhanced HotspotOverlay with cross-platform (Ctrl+H, Ctrl+Shift+H, Cmd+H) capture listeners and automated Vitest regression shield (232 tests green). (Build Verify: SUCCESS)
- **2026-08-25**: v1.1.0-beta-MW-198. Enabled Bilingual Hybrid prompt and chapter subtitle rendering across StudioDashboard.tsx, useStudioData.ts, and PromptCard.tsx; enriched Studio and Navbar with extensive data-hotspot-id attributes and enhanced HotspotOverlay with active hotspot count badge and jsdom/URL listeners (237 Vitest tests green). (Build Verify: SUCCESS)

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

## 22.7 Mandatory Delegation Checkpoint (Anti-Solo Guardrail)

> **Origin**: Codified after MW-165 session (2026-08-15) in which Claude Opus executed research, code edits, commits, and pushes on Protected Components without delegating any work to downstream models, violating the 4-role hierarchy.

**Every model, on every turn, MUST output a Delegation Plan before invoking any code-modification or command-execution tools.** This is a structural checkpoint, not optional guidance.

### The Delegation Plan Format

Before any `replace_file_content`, `multi_replace_file_content`, `write_to_file`, or `run_command` (git commit/push) tool calls, the agent MUST output:

```
📋 Delegation Plan
├─ 🔍 Research (Flash Reader): [list tasks or "none"]
├─ ⚙️ Execute (Flash/Sonnet): [list tasks or "none"]  
├─ 🏛️ Architect (Opus — self): [list tasks or "none"]
├─ 🛡️ Protected Components touched: [list files or "none"]
└─ 📝 Gatekeeper commit required: [yes/no]
```

### Enforcement Rules

1. **Opus MUST delegate research**: File reading, grep searches, git log/status, `tsc --noEmit`, `vitest run` — these MUST be dispatched to Flash Reader/Executor subagents unless the result is needed within the same reasoning step (e.g., reading 5 lines to decide an architectural approach).

2. **Opus MUST NOT commit Protected Components**: If the Delegation Plan shows Protected Components are touched, the final `git commit` and `git push` MUST be delegated to a Sonnet Gatekeeper session. Opus writes the Delegation Brief; the user switches to Sonnet to execute and commit.

3. **Sonnet MUST delegate bounded tasks**: Single-file, clearly-scoped edits on non-Protected files SHOULD be delegated to Flash Executor subagents via Delegation Briefs.

4. **Flash MUST refuse Protected Component edits**: If Flash detects it is being asked to edit a file listed in the Protected Component Registry (§22.2), it MUST halt and output: `🚫 PROTECTED COMPONENT — Requires Sonnet Gatekeeper. Halting.`

5. **Exception — Creative Director Override**: If the Creative Director says "just do it" or "you do it", the current model may execute directly regardless of tier, but MUST still output the Delegation Plan for audit trail purposes.

6. **Subagent Delegation**: Models with subagent capabilities (Opus, Sonnet) SHOULD use `invoke_subagent` with `Model: "flash"` for Reader/Executor tasks rather than executing them in their own context. This preserves context window for architectural reasoning.

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

# 26. Automated Self-Healing & Verification Loop Protocol

> **Origin**: Codified 2026-08-15 by Principal Systems Architect directive. Formalises deterministic retry loops for Tier-3 executors to resolve compile/test failures autonomously before returning to the Gatekeeper — with hard invariant shields to prevent assertion weakening, Protected Component drift, and runaway token burn.

## 26.1 The Execution Harness — State Machine

```
RECEIVE_BRIEF ─► APPLY_DIFF ─► VERIFY ─┬─► PACKAGE_DIFF ─► SUBMIT (✅ GREEN)
                                        │
                                        └─► DIAGNOSE ─┬─► PATCH ─► VERIFY (loop)
                                                       │
                                                       └─► ESCALATE (❌ MAX_RETRIES or INVARIANT VIOLATION)
```

### State Definitions

| State | Description | Constraints |
|---|---|---|
| `RECEIVE_BRIEF` | Parse the Delegation Brief. Extract target files, expected hotspots, verification commands. | Executor MUST echo back the brief's scope before starting. |
| `APPLY_DIFF` | Apply the code changes specified in the brief. | Only files listed in the brief may be modified. |
| `VERIFY` | Run the 3-command verification pipeline (§26.3). | Must run ALL three commands — partial verification is not a PASS. |
| `DIAGNOSE` | Read the error output. Classify as: (a) type error in modified file, (b) test regression, (c) import/dependency issue, (d) architectural mismatch. | Diagnosis must be logged in the Self-Healing Report. |
| `PATCH` | Apply a targeted fix to resolve the diagnosed error. | **Anti-Corruption Shield (§26.2) is enforced.** Only files from the original brief's scope may be patched. |
| `PACKAGE_DIFF` | All verifications green. Run `node scripts/generateLivingDocs.js` (if exists). Format the final diff for Gatekeeper review. | Include `git diff --stat` in the report. |
| `ESCALATE` | Max retries exhausted OR anti-corruption constraint violated. | Must return full diagnostic trace. Executor MUST NOT attempt further fixes. |

### Loop Limits

| Parameter | Value | Rationale |
|---|---|---|
| `MAX_RETRIES` | **3** (1 initial apply + 2 self-healing retries) | First retry resolves immediate type errors. Second retry catches secondary imports/signature mismatches. If iteration 3 fails, the issue is structural — escalate. |
| `MAX_DIFF_GROWTH` | **2× original brief scope** | If the patch surface exceeds double the files listed in the Delegation Brief, the fix is architecturally out-of-scope — escalate. |
| `ESCALATION_TRIGGER` | Iteration 3 fails OR Protected Component touched OR test file modification attempted | Any of these conditions triggers immediate escalation — no further retries. |

## 26.2 The Anti-Corruption & Invariant Shield

These are **hard constraints** — violation of ANY triggers immediate `ESCALATE` with an incident flag.

### 26.2.1 Test File Write-Lock

> `🔒 INVARIANT: *.test.tsx, *.test.ts, *.spec.tsx, *.spec.ts files are READ-ONLY during self-healing loops UNLESS the original Delegation Brief explicitly includes "modify tests" in its scope.`

**Why:** The most common agent anti-pattern is "fixing" a failing test by weakening the assertion. A test that passes because it asserts nothing is worse than a test that fails honestly.

### 26.2.2 Protected Component Registry Write-Lock

> `🔒 INVARIANT: During PATCH state, the executor MUST NOT modify any file listed in the Protected Component Registry (§22.2). If the diagnosis determines that a Protected Component must change to resolve the error, the executor MUST ESCALATE immediately.`

### 26.2.3 Rule 7 Non-Degradation Enforcement

> `🔒 INVARIANT: The executor MUST NOT, during any self-healing iteration:`
> - Delete any button, control, or interactive element
> - Remove any `data-hotspot-id` attribute
> - Delete or weaken any `expect()` / `assert()` call
> - Remove any import that was present before the brief was applied
> - Compress or collapse UI elements to "simplify" a layout error
>
> `If the executor detects it would need to remove UI elements to achieve a green build, it MUST ESCALATE.`

### 26.2.4 Diff Surface Audit

After each `PATCH` iteration, the executor MUST run `git diff --stat HEAD` and verify:
- Only files from the original brief's scope are modified
- No Protected Components appear in the diff
- No test files appear in the diff (unless brief-authorised)

If any violation is detected → immediate `ESCALATE`.

## 26.3 Tiered Verification Pipeline

### Inner Self-Healing Loop (Tier-3 Executor, Max 3 Iterations)

The executor MUST run these commands **in order**. All three must pass for an "unambiguous green":

**Step 1 — Type Safety (~3-5s):**
```bash
node node_modules/typescript/bin/tsc --noEmit
```
- **PASS:** Exit code 0, no output
- **FAIL:** Any type error output → enter `DIAGNOSE`

**Step 2 — Targeted Test Suite:**
```bash
node --experimental-vm-modules node_modules/vitest/vitest.mjs run [target_test_file]
```
- `[target_test_file]` is specified in the Delegation Brief (default: `src/test/studio_fixes.test.tsx`)
- **PASS:** All tests pass, exit code 0
- **FAIL:** Any test failure → enter `DIAGNOSE`

**Step 3 — Diff Surface Audit:**
```bash
git diff --stat HEAD
```
- **PASS:** Only files from brief scope appear + no Protected Components + no test files (unless authorised)
- **FAIL:** Unexpected files in diff → immediate `ESCALATE`

### Gatekeeper Integration Step (Tier-2, before `git push origin dev`)

These run ONCE after the executor returns a GREEN report — the Gatekeeper runs them before pushing:

```bash
node scripts/generateLivingDocs.js          # Documentation manifest
npm run build                                # Full Next.js SSR build (60-90s)
node --experimental-vm-modules node_modules/vitest/vitest.mjs run src/test/studio_fixes.test.tsx
```

> **Note:** `npm run build` is reserved for Gatekeeper validation and briefs modifying `src/app/**` (routing, middleware, SSR layouts). It is NOT run during the inner self-healing loop due to 60-90s overhead per iteration.

### False-Positive Detection

An "unambiguous green" requires:
- `tsc` exit code 0 with **empty stderr**
- `vitest` reports **X passed (X)** with zero failures, zero skipped
- `git diff --stat` shows **only brief-scoped files**

If vitest reports "0 tests" or shows skipped tests that previously passed, this is a **false-positive** — the executor MUST flag this in the Self-Healing Report.

## 26.4 Self-Healing Report Templates

### On SUCCESS (✅ GREEN)

The executor MUST return this format to the Gatekeeper:

```markdown
## 🔧 Self-Healing Report

| Field | Value |
|---|---|
| **Brief** | MW-XXX: [brief title] |
| **Iterations** | N/3 |
| **Status** | ✅ GREEN |
| **Files Modified** | `path/to/file.ts`, `path/to/other.tsx` |

### Initial Error (Iteration 1)
[exact error output from tsc or vitest]

### Resolution Applied
[1-2 sentence description of the fix]

### Final Verification
- `tsc --noEmit`: ✅ exit 0
- `vitest run [file]`: ✅ X/X passed
- `git diff --stat`: ✅ [N] files changed, [+X] insertions, [-Y] deletions

### Diff Summary
[output of git diff --stat HEAD]
```

### On FAILURE (❌ ESCALATED)

```markdown
## 🚨 Self-Healing ESCALATION

| Field | Value |
|---|---|
| **Brief** | MW-XXX: [brief title] |
| **Iterations Used** | 3/3 (EXHAUSTED) |
| **Escalation Reason** | [max retries / protected component / test modification needed] |

### Diagnostic Trace
[full error output from final iteration]

### Executor Analysis
[What the executor believes the root cause is and why it cannot resolve it within scope]

### Recommended Tier-2 Action
[Specific suggestion for what Sonnet/Opus should investigate]
```

## 26.5 Delegation Brief Amendment

All Delegation Briefs (written by Opus/Sonnet) MUST now include a **Verification Scope** block:

```markdown
### Verification Scope
- **Target test file:** src/test/studio_fixes.test.tsx
- **Test modification authorised:** NO
- **Protected Components in scope:** [list or NONE]
- **Expected green count:** 123/123
```

This gives the executor clear boundaries for the self-healing loop.

## 26.6 Gatekeeper Post-Receipt Triage

When the Gatekeeper (Sonnet) receives a Self-Healing Report:

| Report Status | Gatekeeper Action |
|---|---|
| ✅ GREEN with `1/3` iterations | Fast-track approve — run Gatekeeper Integration Step (§26.3) and push |
| ✅ GREEN with `2/3` iterations | Standard review — inspect the patch diff before approve |
| ✅ GREEN with `3/3` iterations | Full diff review — examine every changed line before approve |
| ❌ ESCALATED | Route to Opus for architectural diagnosis — do NOT attempt fix at Sonnet tier |

# 27. Mandatory Work Completion Handoff Protocol

> **Origin**: Codified 2026-08-17 by Creative Director directive. The agent MUST automatically deliver a structured handoff format after completing any work item — without the Creative Director needing to prompt for it.

## 27.1 Trigger

This handoff is **mandatory** after:
- Every `git push origin dev` (code shipped to staging)
- Every governance rule codification
- Every Plane.so ticket closure
- Every multi-step bug fix or feature implementation

## 27.2 Handoff Format (Mandatory Interactive HTML + Chat Dual-Delivery)

The agent MUST execute the following sequence upon staging rollout verification:
1. **Compile & Save Interactive HTML Artifact**: The agent MUST first write the complete interactive `qa_checklist_interactive.html` artifact to `<appDataDir>\brain\<conversation-id>/qa_checklist_interactive.html`. The artifact MUST include:
   - Dedicated `[ 🔗 Open Test Route ↗ ]` buttons pointing to complete, fully-qualified URLs.
   - Interactive `[ ✓ PASS ]` and `[ ✗ FAIL ]` state buttons.
   - Per-test observation and feedback note input fields.
   - `localStorage` persistence and live progress circle counter.
   - `[ 📋 Copy Report to Chat ]` 1-click markdown copy button.
2. **Deliver 3-Section Chat Response**: The agent MUST include ALL THREE sections in this exact order:

### Section 1: Creative Director Testing Checklist

```markdown
## 🎬 Creative Director Testing Checklist

👉 **[Open Interactive Creative Director QA Checklist (`qa_checklist_interactive.html`)](file:///path/to/qa_checklist_interactive.html)**

**Build:** `[commit hash]` deploying to `dev.memoryweaver.studio` / `admin.memoryweaver.studio` — hard-refresh (Ctrl+Shift+R).

| # | Test | How | Fully-Qualified Test URL |
|---|---|---|---|
| 1 | [Test description] | [Exact steps to verify] | https://dev.memoryweaver.studio/... |
| 2 | [Test description] | [Exact steps to verify] | https://dev.memoryweaver.studio/... |

**PASS / FAIL** each one when ready.
```

- Every test item MUST include concrete steps, not vague descriptions
- Every test item MUST provide a complete, non-truncated fully-qualified URL
- If no user-facing changes were deployed (e.g. governance-only), state "No visual changes to test"

### Section 2: What's Next

```markdown
## What's Next

| Ticket | Task | Effort | Status |
|---|---|---|---|
| MW-XXX | [description] | [estimate] | [status] |
```

- List the immediate next 2-4 items in priority order
- Include sprint handoff trigger status if approaching Rule 25.2 lifecycle boundary

### Section 3: Proactive Thoughts (Rule 17)

```markdown
## 💡 My Thoughts

**1. [Observation].** [Actionable insight or suggestion]
**2. [Observation].** [Actionable insight or suggestion]
```

- Minimum 2, maximum 4 proactive observations
- Each MUST be actionable — not generic praise or filler
- Can include: UX gaps, performance risks, architectural suggestions, upcoming blockers, feature ideas
- Reference specific files, routes, or components when applicable

## 27.3 Anti-Patterns (Hard Bans)

- ❌ Never end a work session with just "Done. Committed and pushed."
- ❌ Never omit the testing checklist after a `git push`
- ❌ Never output only a markdown table in chat without synchronously generating and linking the interactive `qa_checklist_interactive.html` artifact
- ❌ Never output relative paths (e.g. `/cinema/tv`) or truncated URLs (`...`) in checklist tables
- ❌ Never wait for the Creative Director to ask "what's next?" — proactively state it

# 28. Context Window Inflation Shield & Token Economy Protocol

## 28.1 The Inflation Mechanism
In long conversations with multiple tool calls, file views, and checkpoints, the entire message trajectory (100,000–200,000+ tokens) is processed on **every single user prompt** (even 1-word commands like `Continue` or `PASS`). This causes rapid token consumption if expensive reasoning models are used for repetitive iterative loops.

## 28.2 Token-Saving Protocol & Model Allocation
- **Iterative Execution & Verification Workhorse**: Default to **Gemini 3.7 Flash (High)** or **Gemini Flash (Medium)** for continuous debugging, test execution, UI tweaks, subagent execution (`flash_executor`), and active testing cycles to maximize speed and token efficiency.
- **Architectural & Complex Reasoning Reserve**: Reserve **Claude Opus / Sonnet (Thinking)** for initial system design, major multi-module refactoring, or intractable state bugs where deep reasoning is strictly required.
- **Mandatory Subagent Offload**: All mechanical code execution and broad file research MUST use Flash-tier subagents (`flash` / `flash_executor`).

## 28.3 Proactive Rollover Trigger
When a session reaches **10+ completed items** OR **encounters Checkpoint truncation**:
- The agent MUST proactively present the **Sprint Handoff Brief** and explicitly advise the Creative Director to start a fresh conversation.
- The agent will provide a ready-to-paste starter prompt for the new conversation to instantly re-hydrate the new session with zero context loss.

- ❌ Never provide generic thoughts like "the codebase looks good" — every observation must be specific and actionable

# 29. Living Knowledge Hub Continuous Governance & Manifest Synchronization Rule

## 29.1 Mandatory Manifest Audit Upon Ticket / Sprint Completion
Whenever delivering a new feature, subscription change, integration capability, architectural refactoring, or operational policy (e.g. Email Dispatcher, Cloud Storage Vault quotas, AI Weaver prompt policies, DNS deliverability records), the agent MUST verify whether new business rules, operational constraints, or support playbooks should be registered in `src/config/businessRules.ts`.

## 29.2 Required Manifest Entities
1. **Subscription & Feature Limits**: If features or tier quotas change (e.g. 4K Vault size, batch export limits, trial lengths), update `BUSINESS_MANIFEST.tiers`.
2. **Operational & Support Playbooks**: If new failure modes, external APIs (e.g. Resend, Cloudflare, WebRTC, Firebase App Hosting), or troubleshooting workflows are introduced, add a dedicated playbook under `BUSINESS_MANIFEST.supportPlaybooks` detailing the operational context and step-by-step resolution procedures.
3. **User Lifecycle Access States**: If user gating, paywall intercept rules, or permission vectors change, update `BUSINESS_MANIFEST.userLifecycles`.

## 29.3 Automatic Build & UI Synchronization
- Running `npm.cmd run build` automatically compiles `src/config/businessRules.ts` via `node scripts/generateLivingDocs.js` into both `docs/living-manifest.md` (repository documentation) and `src/app/admin/living-manifest.json` (runtime data store for the live `/admin?suite=knowledge` UI).
- The agent must verify that the compiled manifest produces clean search index entries without syntax errors.

## 29.4 Retrospective & Audit Enforcement (Rule 16 Integration)
The final **Production-Ready Audit & Retrospective** (Rule 16) MUST explicitly confirm Living Knowledge Hub synchronization status:
`Living Knowledge Hub: SYNCHRONIZED (src/config/businessRules.ts -> docs/living-manifest.md & admin?suite=knowledge)`
