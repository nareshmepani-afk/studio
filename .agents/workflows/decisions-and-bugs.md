---
description: Intake founder decision form submissions and live user bug reports from staging, displaying their status and automatically synchronising deferred items or open bugs to Plane.so tickets.
---

# Founder Decisions & Bug Triage Sync Workflow

Run this workflow whenever Naresh has submitted selections in `/admin?suite=decisions` or reported live issues via `BugReportModal` (`Ctrl + /` or "Report Issue" button):

### Step 1: Read and Sync Founder Cutover Decisions
Inspect all decision cards in `founder_decisions` on staging, and automatically create Plane.so issues for any cards marked `DEFERRED_TO_PLANE` without an existing link:
```powershell
npm.cmd run qa:decisions -- --sync-plane
```

### Step 2: Read and Sync Live Bug Reports
Inspect all bug reports in `bug_reports` on staging, and automatically create Plane.so issues for any `OPEN` reports without an existing ticket:
```powershell
npm.cmd run qa:bugs -- --sync-plane
```

### Step 3: Summary & Status Handshake
Report the count of DECIDED, PENDING, and DEFERRED decisions along with any newly minted Plane ticket keys (`MW-XXX`), confirming the active backlog state with the founder.
