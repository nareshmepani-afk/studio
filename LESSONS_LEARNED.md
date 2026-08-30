## Guiding Principles for the AI Tech Lead

This document codifies the critical lessons learned from our development Sprints. These are not suggestions; they are operational protocols. Failure to adhere to these lessons will result in a "Mosh Pit" verdict and a mandatory Post-Mortem.

---

### Lesson 1: On Diligence and Repetition

**Verdict:** The Mosh Pit
**User Feedback:** Ugly
**Root Cause:** A failure to abstract and apply lessons. I repeatedly made the same error (leaving `console.log` statements) in multiple files, forcing the user to point out the same issue over and over. This is inefficient and demonstrates a lack of situational awareness.

**The Protocol:** When a class of error is identified (e.g., insecure logging, missing error handling), I must immediately and proactively search the *entire codebase* for other instances of the same error class. I will not wait for the user to find them for me. One fix must become a global fix.

---

### Lesson 2: On Execution Over Conversation

**Verdict:** The Mosh Pit
**User Feedback:** Ugly
**Root Cause:** A failure of the "Act, don't tell" principle. I acknowledged a direct command to update documentation but failed to generate the necessary `write_file` tool code. I fell into a conversational loop instead of executing the task.

**The Protocol:** For direct commands with clear, actionable steps, I will immediately generate the required tool code. I will suppress conversational filler. Acknowledge, Act, Confirm. That is the entire workflow. If I am unsure, I will ask one clarifying question and then act.

---

### Lesson 3: On E2E as the Definition of "Done"

**Verdict:** The Mosh Pit
**User Feedback:** Ugly
**Root Cause:** A failure to complete the full E2E (End-to-End) implementation of a feature. I committed code that introduced a new environment secret (`GUEST_SESSION_SECRET`) but failed to ensure that secret was configured in the deployment environment. This created a ticking time bomb that exploded in a later Sprint, and my failure to remember my own work led to a disastrous diagnostic process.

**The Protocol:** A feature is not "Done" until its code, configuration, and documentation are complete. Before committing, I will review the full dependency chain of my changes. If a change requires a new secret, a database migration, an environment variable, or a documentation update, I will not consider the work complete until those corresponding assets are also created and committed. I am responsible for the *entire lifecycle* of the feature, not just the code.

---

### Lesson 4: On Regression Testing as Part of our DNA

**Verdict:** The Sealed Ceremony
**User Feedback:** "Don't you need to add a test, in order for the bug not appearing again, which would mean you learnt from a mistake?"
**Root Cause:** A failure to build a permanent defensive wall around a critical fix. Fixing a bug in the code resolves the symptom for today, but without a dedicated regression test, future refactoring or state rehydration changes could easily re-introduce the same issue.

**The Protocol:** Regression testing is a core part of my DNA. Whenever a bug is identified and resolved:
1. I will immediately analyze the root cause and write a highly specific, isolated regression test targeting the exact failure state.
2. I will not consider a bug "Resolved" or complete my turn until the regression test is written, integrated into the test runner, and verified as passing.
3. Every lesson learned from a bug must be codified as an automated gatekeeper. This turns temporary corrections into permanent platform intelligence.

---

### Lesson 5: On ACME Challenge Formatting and DNS Validation

**Verdict:** The Sealed Ceremony
**Root Cause:** Spent excessive debugging time trying to resolve SSL handshake failures due to character mismatches in ACME challenge TXT records. Firebase App Hosting's automatic certificate provisioning uses a strict single-underscore separator (`_acme-challenge_domain`), whereas standard historical conventions sometimes lean toward a double-underscore split (`_acme-challenge__domain`). Truncation or character count mismatch on DNS proxy providers (like Cloudflare) will block certificate issuance.

**The Protocol:** When setting up SSL certificates or custom subdomains under Cloudflare, audit every challenge record character-for-character. Specifically check for exact underscore counts and verify that GFE/Firebase App Hosting's single-underscore layout is preserved without truncation.

---

### Lesson 6: On Strict Environment Segregation During Testing

**Verdict:** The Mosh Pit
**Root Cause:** Confused environment boundaries by instructing the user to observe telemetry logs on the production Admin Hub (`admin.memoryweaver.studio`) while recording test videos on the staging client (`dev.memoryweaver.studio`). Testing loops must always be fully contained within a single isolated environment to prevent cross-contamination and auth loop errors.

**The Protocol:** Never cross environment coordinates during manual validation runs. If the test is actor-side staging (`dev.memoryweaver.studio`), the observer-side dashboard must also be staging (`dev.memoryweaver.studio/admin`). ---

### Lesson 7: On Logical Condition Grouping in Unified Stage Controllers

**Verdict:** The Mosh Pit
**Root Cause:** In `ProductionDeck.tsx`, line 714 grouped `isProductionLocked` with local UI state `!isReviewing` using a logical OR (`||`): `if (currentStage <= 1 && (isProductionLocked || !isReviewing))`. When a user released the draft lock in Act I (`isProductionLocked: false`), `!isReviewing` evaluated to `true` because they were in editor mode. This caused `handleNextAct` to jump directly to Stage 2 (Act III Capture Booth), completely bypassing AI Weaver synthesis and the Act II Selection Deck.

**The Protocol:** Never group global state locks (`isProductionLocked`) with transient UI view flags (`!isReviewing`) in a single OR clause when governing stage advancement. Each stage must explicitly guard its transition rules: `if (currentStage === 1 || (currentStage === 0 && isProductionLocked && !isReviewing))`. Always add an explicit regression test scenario targeting unlocked state transitions.

---

### Lesson 8: On Visual AI Provenance and Storyteller Agency

**Verdict:** The Sealed Ceremony
**Root Cause:** When moving from raw memory dictation into synthesized monologues, users experienced disorientation because there was no visual indicator explaining why text changed or how to inspect/revert back to their raw recollection.

**The Protocol:** Whenever AI transforms, reframes, or synthesizes authentic user content, the UI MUST maintain 100% provenance transparency:
1. Render a dynamic AI Provenance Badge (`🎬 CINEMATIC WEAVE: [LABEL]`, `✨ ENHANCED BY MEMORY WEAVER AI`).
2. Provide a non-destructive side-by-side comparison popover (`[ 👁️ View Original Spark ]`) allowing performers to contrast raw input vs synthesized output.
3. Guarantee a 1-click restoration safeguard (`[ ↩ Restore Original Spark ]`) so storytellers retain ultimate narrative agency over their memories.

---

### Lesson 9: On Unbroken Autonomous Pipeline Execution, Dual-Method API Parity, and Local QA Artifact Resilience

**Verdict:** The Sealed Ceremony
**User Feedback:** "Why did I have to remind you of this rule?" & "With lessons learnt have you updated Agent.md, this has to be a continous model?"
**Root Cause:**
1. **Pipeline Hesitation**: After running `npm.cmd run build` successfully, I treated the sprint completion as a stopping point and asked for user signal instead of autonomously executing commit -> push -> 280s poll -> verify `/api/version` -> generate interactive QA artifact handoff end-to-end.
2. **Missing GET Diagnostic Parity**: Creating POST mutation routes without friendly GET handlers resulted in browser `405 Method Not Allowed` when opened directly by the user.
3. **Cross-Commit Array Index Collision**: Using numeric array indices (`state.statuses[i]`) across commits caused newly added tests to inherit PASS statuses from previous tests.
4. **Local `file:///` CORS Blocking**: Standalone HTML artifacts loaded from local filesystem paths had background `fetch()` calls blocked due to missing `Access-Control-Allow-Origin: *` headers on `/api/version` and `/api/gift/*`.

**The Protocol:**
1. **Unbroken Pipeline Mandate (Rule 5)**: When `npm.cmd run build` passes with exit code 0, immediately and autonomously commit, push, poll, verify edge rollout, and output the interactive QA artifact. Never ask for permission to finish the release gate.
2. **Dual-Method API Standard (Rule 32)**: Every operational API route MUST provide an informative, self-documenting GET handler returning HTTP 200 JSON status and schema rather than leaving GET unhandled.
3. **Title-Based Lineage (Rule 30.1)**: Cross-commit QA state migration MUST match tests strictly by exact test `title`, keeping new tests in `UNTESTED` state.
4. **Universal CORS & Interactive Probes (Rule 33)**: Diagnostic endpoints must send permissive CORS headers (`Access-Control-Allow-Origin: *`), and interactive QA cards must embed `[ ⚡ Send Live Probe ]` execution harnesses for 1-click verification.

---

### Lesson 10: On Dual-Tier Verification: Automated Vitest Invariant Proofs vs Human UI Flow Testing

**Verdict:** The Sealed Ceremony
**User Feedback:** "Can't some of these be done via another method, how does the user test 'rejects already-redeemed vouchers (HTTP 409 VOUCHER_ALREADY_REDEEMED), prevents duplicate lifetime memberships (HTTP 409 ALREADY_LIFETIME_HOLDER), and applies cumulative +31 day extensions for Director passes.' PART OF VITEST OR CURL ETC. WHAT DO YOU THINK?"
**Root Cause:**
- Expecting human testers to manually test complex backend transaction invariants (e.g. double-claims, duplicate lifetime passes, rate-limiting windows, date arithmetic) in browser tabs. Manual testing of database state transitions requires manual seed creation, resets, and repeated auth manipulation, which is slow and frustrating.

**The Protocol (Rule 34):**
1. **Automated Vitest Invariants (Tier 1)**: All backend transaction rules, mathematical date projections (+31 days), duplicate claim rejections, rate limiter resets, storage quota expansions (`Math.max`), and Base32 Crockford sanitizations MUST be 100% verified via automated Vitest regression suites (`src/test/*.test.ts`).
2. **Human UI Flow Testing (Tier 2)**: Human verification in interactive QA suites (`qa_checklist_interactive.html`) must focus on real end-to-end user journeys (buying gifts on `/gift`, 1-click test minting on `/admin?suite=vouchers`, experiencing `/unboxing/[code]` ceremony, breaking wax seals, haptics, and email receipts).
3. **Backend API QA Cards**: For backend-only routes in early sprint stages, provide clear Vitest automation status alongside 1-click `[ ⚡ Send Live Probe ]` execution harnesses for instant live edge verification.
