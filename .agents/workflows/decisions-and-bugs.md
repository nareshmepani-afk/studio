---
description: Intake founder decision form submissions and live/chat bug reports from staging, auto-create Plane.so tickets for OPEN/DEFERRED items, auto-close Plane.so tickets for VERIFIED sign-offs, and manage Walkthrough Batch Mode.
---

# Founder Decisions & Bug Triage Sync Workflow

Run this workflow whenever Naresh has submitted selections in `/admin?suite=decisions`, signed off on fixes in `/admin?suite=bugs`, or reported issues via `BugReportModal` / chat:

### Step 1: Read and Sync Founder Cutover Decisions
Inspect all decision cards in `founder_decisions` on staging, and automatically create Plane.so issues for any cards marked `DEFERRED_TO_PLANE` without an existing link:
```powershell
npm.cmd run qa:decisions -- --sync-plane
```

### Step 2: Read, Sync & Auto-Close Live Bug Reports (Option B Fast Sign-Off)
Inspect all bug reports in `bug_reports` on staging, create Plane.so tickets for any `OPEN` reports without an existing ticket, and **automatically mark linked Plane.so tickets Done** for any report Naresh signed off as `VERIFIED`:
```powershell
npm.cmd run qa:bugs -- --sync-plane
```

### Step 3: Log or Mark Chat-Requested Fixes in `/admin?suite=bugs`
- **Log a new chat-reported bug (Immediate or Walkthrough Batch Mode)**:
```powershell
npm.cmd run qa:bugs -- --create --sync-plane --path="/studio/production/[id]" --trace="mw_telemetry_..." --desc="Summary of issue"
```
- **Mark a fix live after `/api/version` confirms rollout**:
```powershell
npm.cmd run qa:bugs -- --mark-fixed --report-id="bug_..." --sha="<7-char-sha>" --plane="MW-xxx" --notes="Fix summary"
```

### Step 4: Summary & Status Handshake
Report DECIDED / PENDING / DEFERRED counts, newly minted or auto-closed Plane ticket keys (`MW-XXX`), and direct `/admin?suite=bugs` sign-off status.

---

### 3-Zone Environment Model & 3-Person Ownership Split
- **Zone 1 (Local Workspace)**: Unpushed local edits on `dev` — invisible to both websites until pushed.
- **Zone 2 (Live Staging — `https://dev.memoryweaver.studio` / `memory-weaver-dev`)**: Test site, QA deck, Founder Inbox (`?suite=releases`), and Founder Sign-Off Queue (`?suite=bugs`).
- **Zone 3 (Live Production — `https://memoryweaver.studio` / `memory-weaver-8rk9t`)**: Customer-facing site and Production Customer Bug Inbox (`?suite=bugs`).
- **Ownership**: Naresh approves/holds/defers in Founder Inbox and verifies public URLs (**zero git/CLI mechanics**); Gemini reviews scope/risk; **Antigravity owns 100% of git merges, `hotfix/*` worktrees, and automatic post-hotfix `origin/master -> dev` back-merges + verification** (monitored via the 4-line 3-Zone Radar in `npm.cmd run qa:controls`).

### Dual-Track Sync Hard Rules (`dev` / Staging ↔ `master` / Production)
1. **Strict Branch Roles**: `dev` = feature/batch staging (`memory-weaver-dev`); `master` = production only (`memory-weaver-8rk9t`).
2. **P0/P1 Hotfix vs. P2/P3 Dev-First**: A fix applied to production (`master`) and not yet on `dev` is **ONLY** allowed via an isolated `hotfix/<MW-xxx>` branch off `origin/master` for **P0/P1** blockers (never `git stash` on dirty `dev`). Use `git worktree add ../studio-hotfix -b hotfix/<MW-xxx> origin/master`, bootstrap with `npm.cmd ci --prefer-offline` (plus `.env.local` if needed — no unsafe Windows junctions before `git worktree remove`), pass local `npm.cmd run build` + `prod:preflight` + full Vitest, restore incidental `tsconfig.tsbuildinfo` / `src/lib/qa/qaHtmlContent.ts` churn unless `qa_checklist_interactive.html` changed, and merge to `master`. **P2/P3** UX/polish items always go through `dev` first, verify on `dev.memoryweaver.studio`, then promote via `git merge --ff-only dev`.
3. **Automatic & Mandatory `master -> dev` Back-Merge (Owned by Antigravity)**: Production fixes on `master` do **NOT** automatically apply to `dev`. Immediately after any `hotfix/*` verifies live on `https://memoryweaver.studio/api/version` (and before pushing new `dev` changes), Antigravity automatically ensures `dev` has a clean working tree (committing local WIP first), runs `git checkout dev && git merge origin/master`, verifies with **targeted Vitest + local `npm.cmd run build`** (restoring incidental `tsconfig.tsbuildinfo` / `qaHtmlContent.ts` churn), pushes `origin/dev`, and verifies `dev.memoryweaver.studio/api/version` + `npm.cmd run qa:controls` show `0` prod-only commits (aware that both `master` and `dev` trigger ~5-min App Hosting builds).
4. **Infra-Before-Push, Secret Rollout & Reverse Parity**: Deploy `firestore` rules/indexes, `storage` rules + CORS (via `@google-cloud/storage`), and `functions` **before** pushing `master`; trigger `apphosting:rollouts:create` (plus `grantaccess` for new secrets) after any Secret Manager secret update; sync infra fixes back to `memory-weaver-dev`; restore MCP `active_project` to `memory-weaver-dev`; keep working tree clean.
5. **Environment Tagging & `qa:bugs` Scope**: Tag Plane tickets `[ENV: PROD]`, `[ENV: STAGING]`, or `[ENV: BOTH]`. Remember `npm.cmd run qa:bugs` is hard-locked to staging (`memory-weaver-dev`) as the Founder Sign-Off Queue, whereas `https://memoryweaver.studio/admin?suite=bugs` is the Production Intake Inbox.
