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
