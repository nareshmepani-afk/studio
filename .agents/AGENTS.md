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

## 10. Plane.so Backlog Prioritization & User Step-by-Step Instructions Rule
- **Backlog Prioritization**: Before initiating any work or touching the codebase, verify that a corresponding issue exists in the Plane.so workspace project board.
- **Mandatory Step-by-Step User Instructions**: Every ticket created or updated on Plane.so MUST include clear, numbered human performer step-by-step testing instructions in its description (including exact actions, Hotspot IDs like `HS_PROMPTER_VOCAL_BTN`, expected results, and DOM element identifiers) to enable zero-ambiguity user sign-off.
- **Automated Ticket Creation**: If a task has been verbally requested by the user but does not exist, the agent must programmatically create a corresponding issue ticket on the Plane.so board using the local automation bridge (`scripts/plane.js`) prior to code modification.

# Deployment Milestones
- **2026-06-29**: v1.1.0-beta. Resolved dynamic Einstein template hydration, automated client-side cloning, multi-core GCF FFmpeg processing execution, and structured telemetry reporting. (Build Verify: SUCCESS)
- **2026-07-04**: v1.1.0-beta-MW-70. Resolved MFA loader lockout, expanded TOTP key length to 16 characters, corrected QR code URI literal colon separator, and added setup page console diagnostics. (Build Verify: SUCCESS)
- **2026-07-20**: v1.1.0-beta-MW-71. Resolved layout height collapse by shifting click tracking to global capture listeners; verified with automated child-node rendering assertions. (Build Verify: SUCCESS)
- **2026-07-23**: v1.1.0-beta-MW-72. Resolved Act I Clean Reading View vs Sensory View toggle, fixed hideAnchors prop binding, interactive ESC/ENTER briefing buttons, and verified zero CLS. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-23**: v1.1.0-beta-MW-73. Portaled OnboardingOverlay to document.body z-[100000] stacking context, resolved instant re-triggering loop via hasDismissedOnboarding state guard, verified interactive BEGIN PRODUCTION, ENTER, ESC, and top-right [ X ] close button. (Build Verify: SUCCESS, User Sign-Off: VERIFIED)
- **2026-07-24**: v1.1.0-beta-MW-74. Resolved full Scriptorium prose preservation during AI synthesis ceremony by prioritizing flushed/stored prose over short prompt description in generateDraftOptions payload and useMemoryPersistence flush returns. (Build Verify: SUCCESS)
- **2026-07-24**: v1.1.0-beta-MW-76. Automated Production Lock (isProductionLocked: true) upon DRAFT COMPLETED trigger to seal user's edited Scriptorium prose into Firestore against text regressions. (Build Verify: SUCCESS)
- **2026-07-25**: v1.1.0-beta-MW-77. Updated lock badge and tooltip labels from DIRECTOR'S LOCK ACTIVE to DRAFT LOCK ACTIVE and RELEASE DRAFT LOCK for intuitive UX clarity. (Build Verify: SUCCESS)



