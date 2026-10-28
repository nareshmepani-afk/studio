# Architectural Specification: Admin Operations & Telemetry Dashboard Console (`SPEC-MW-157`)

- **Document Title:** `MW-SPEC-Admin-Operations-Dashboard`
- **Ticket Reference:** `FEAT-MW-ADMIN-001` / `SPEC-MW-157` (Plane.so Ticket `#366`)
- **Canonical Google Doc:** [`1BsycXL3y2ivz1m16elc-QZ16J2caXJzyce4ChWYP9v8`](https://docs.google.com/document/d/1BsycXL3y2ivz1m16elc-QZ16J2caXJzyce4ChWYP9v8/edit)
- **Governance Anchors:** Rule 7 (Non-Degradation), Rule 14 (Zero-Blob Invariant), Rule 20 (UK English Orthography), Rule 30 (Interactive Verification), Rule 49.6 (Strict Relay Gate), Rule 51 (Explicit Provenance)
- **Status:** ARCHITECTURAL SPECIFICATION & PLANE.SO BACKLOG REGISTERED (`#366`)
- **Target Module:** Admin Portal / Operations Console (`/admin/dashboard`)

---

## 1. Executive Summary & Design Inspiration

This specification adapts the high-density operational telemetry layout from industrial hospitality dispatch consoles into an executive management dashboard for Memory Weaver.

While the consumer-facing Studio emphasises warmth, emotional safety, and unhurried heirloom creation (the 5-Act production suite and Filofax spine), the Admin Operations Console provides platform administrators with real-time visibility into user activity, media ingestion velocity, cloud storage economics, data integrity shields, and AI compute burn.

---

## 2. Global Layout & Structural Hierarchy

The dashboard is structured into four distinct visual tiers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [ BRANDING ]  |  [ TABS: Storytellers | Media & Storage | System Health | AI Pipeline ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ DATE FILTER ]  |  [ DONUT: Pipeline Health ]  |  [ GAUGE: Storage ]  |  [ SUMMARY ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 10 HORIZONTAL OPERATIONAL HEALTH KPI CARDS (Users, Sessions, Invariants, Retakes) ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ DETALLE: Live Telemetry Search, Colour-Coded Status Table & Diagnostic Quick Actions]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Tier A: Global Controls & Top Navigation
- **Sidebar / Header Navigation:**
  - Categorised tabs: `Storytellers & Accounts`, `Media & Storage Vault`, `Integrity Shields & Invariants`, `AI Scriptorium Compute`, and `Audit Logs`.
- **Temporal Filter Header:**
  - Toggle between `Single Date` ("Una fecha") and `Date Range` ("Rango").
  - Presets: `Today (Live Heartbeat)`, `Last 7 Days`, `Last 30 Days`, `Quarter-to-Date`.
  - Environment Badge: Indicator showing `Production Edge` vs. `Staging Edge` with live commit SHA.

### Tier B: Executive Gauges & Volume Totals (Top Row)
1. **Donut Progress Gauge — Media Pipeline & Invariant Health:**
   - **Visual:** Circular progress ring with multi-segment colour breakdown.
   - **Target Metric:** Overall Pipeline Integrity (Target: `>99.5%`).
   - **Segments:**
     - *Green (Optimal):* Direct HTTPS Google Cloud Storage completed sessions.
     - *Amber (Recovered):* Chunked upload retries successfully recovered.
     - *Red (Violations):* Hard upload drops or detected blob leaks (Alert threshold = `0`).
2. **Speedometer / Semi-Circle Dial — Storage Velocity & Quota:**
   - **Visual:** Graduated needle dial from `0%` to `100%` capacity.
   - **Target Metric:** Active Google Cloud Storage Allocation (e.g. `214 GB / 500 GB Tier`).
   - **Sub-label:** Current ingestion velocity (e.g. `+3.8 GB / day`, estimated `74 days` to quota alert).
3. **Executive Volume Ledger (Right Summary Box):**
   - Total Registered Storytellers & Active Collaborators.
   - Total Completed Scenes (Video Reels vs. Voice Memoirs vs. Text Drafts).
   - Cumulative High-Definition Footage Hours (Transcoded & Raw).
   - AI Scriptorium Generations & Average Token Latency.

### Tier C: Operational Health Grid (10 KPI Cards)

| Card # | Metric Name | Target / Focus | Description |
| :--- | :--- | :--- | :--- |
| **01** | Active Storytellers | DAU / MAU | Total users active in the selected temporal window. |
| **02** | Live Soundstage Sessions | Real-Time | Narrators currently active inside Act III Solo Booth. |
| **03** | Rule 14 Blob Invariant Alert | Target: `0` | Flashes critical red if any `blob:` URL is detected in Firestore. |
| **04** | Master Takes Confirmed | Status: `completed` | Takes approved by narrators. |
| **05** | Draft Takes in Progress | Status: `draft` | Takes currently recorded but pending review. |
| **06** | Upload & Network Retries | Edge Resiliency | Number of chunked upload chunks retried due to connection drops. |
| **07** | Rehearsal Retakes Logged | UX Friction | Frequency of narrators triggering `[ 🔄 Retake Performance ]` (script difficulty). |
| **08** | Off-Peak Transcode Queue | Infrastructure | Video/Audio jobs awaiting cloud transcoding or waveform generation. |
| **09** | Narrator Blockers | Device Access | Accounts flagged with microphone/camera permission failures. |
| **10** | Vault Entitlement State | Subscriptions | Active subscribers vs. Lifetime Folio holders vs. Lapsed Read-Only vaults. |

### Tier D: Detailed Live Telemetry Table ("Detalle")
A searchable, filterable real-time activity ledger tracking every system transaction:
- **Search & Filters:** Instant debounce search (`<150ms`) across User Name, Email, UID, Scene ID, and Session ID.
- **Quick Filters:** `[ All Events ] [ 4K Video ] [ Spoken Audio ] [ AI Generations ] [ Errors Only ]`.

| Status | Timestamp | Storyteller | Scene / Target | Transaction Type | Asset Size & Duration | GCS Storage Destination | Actions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 | 2026-10-24 14:32:01 | Eleanor Vance (`EV-9021`) | `part-1-scene-1` | `WEBRTC_VIDEO_RECORDED` | 42.5 MB • 2m 14s | `gs://mw-vault/ev9021/p1s1.mp4` | Inspect |
| 🟢 | 2026-10-24 14:30:15 | Arthur Pendelton (`AP-4410`) | `part-2-scene-3` | `AUDIO_VOICE_MEMOIR` | 8.1 MB • 5m 40s | `gs://mw-vault/ap4410/p2s3.wav` | Inspect |
| 🟢 | 2026-10-24 14:28:44 | Sophia Loren (`SL-1102`) | `part-1-scene-2` | `PROSE_SCRIPT_SAVED` | 12 KB • N/A | Firestore Document | Inspect |
| 🟣 | 2026-10-24 14:12:09 | Marcus Aurelius (`MA-0001`) | `part-3-scene-1` | `AI_WEAVE_PROMPT` | 0.4 KB • N/A | Scriptorium Log | Inspect |

---

## 3. Extended Administrative & Enterprise Capabilities

### A. Read-Only Diagnostic Impersonation ("Support Session")
- Customer support mode allowing admins to inspect a storyteller's soundstage and scriptorium in a read-only state without editing text or accessing camera feeds.
- **Strict Audit Trail:** Every impersonation session is logged with admin ID, timestamp, and duration.

### B. One-Click GDPR Generational Vault Export
- Self-service admin export utility that compiles a user's entire archive into a cryptographically verified `ZIP` bundle:
  - Raw 4K MP4 video files with original timestamps.
  - High-fidelity WAV/MP3 voice memoirs.
  - Complete JSON and formatted PDF heirloom manuscript of all 31 scenes.
- Ensures full compliance with data portability regulations.

### C. Automated Data Integrity & Shadow Document Sweeper
- A background maintenance tool that inspects Firestore for orphaned documents, split-brain scene IDs, or broken take arrays, displaying a 1-click remediation action.

### D. Staging Environment Seed & Reset Tools
- In staging edge only (`dev.memoryweaver.studio`): 1-click buttons to seed benchmark accounts (Scene 1 Video, Scene 2 Voice, Scene 3 Draft, Part II Scene 2 Clean Slate).

---

## 4. Backend Telemetry Endpoints & Acceptance Criteria

### 4.1 Backend Endpoints
1. `/api/admin/telemetry/overview`: Aggregates DAU/MAU, storage bytes, and pipeline error rates.
2. `/api/admin/telemetry/live-feed`: Streaming or polling log of recent studio takes and AI compute events.
3. Invariant Alert Query: Real-time check flagging any uncommitted `blob:` URLs or orphaned records.

### 4.2 Acceptance Criteria
- [ ] Admin route `/admin/dashboard` is protected by role-based auth (admin claims only).
- [ ] Gauge cluster renders correctly with responsive SVG gauges.
- [ ] KPI cards update dynamically based on the selected date window.
- [ ] Search bar filters the telemetry table within 150ms without full-page reloads.
- [ ] `0` `blob:` URLs are ever rendered in the storage inspector.
- [ ] Vitest test suite covers telemetry calculation logic with 100% pass rate.
