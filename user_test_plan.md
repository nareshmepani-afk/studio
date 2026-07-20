# Studio End-to-End User Verification & Alignment Test Plan
*A Step-by-Step Guide for Performer & AI Collaboration Testing on Staging (`dev.memoryweaver.studio`)*

---

## 🎯 Executive Summary & Objectives
This test plan provides a clear, un-ambiguous sequence of physical test passes across the Memory Weaver Studio. By combining **Deterministic DOM Hotspots (`data-hotspot-id`)**, **Visual HUD Badges (`Ctrl+Shift+H`)**, and **Telemetry Logging**, every click and interaction is traced end-to-end.

---

## 📋 Module 1: Pre-Flight Auth & Staging Isolation

| Step | Action | Hotspot ID | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | Navigate to `https://dev.memoryweaver.studio` | — | Redirects cleanly to Login / Dashboard without 403/500 errors. | `[ ]` |
| **1.2** | Log in with test account (`nareshmepani@hotmail.com`) | `HS_AUTH_LOGIN_BTN` | Successfully authenticates and redirects to `/studio`. | `[ ]` |
| **1.3** | Verify Application Version Tag | — | Browser console or network logs verify version `1.0.0-MW-69` / `1.1.0-beta-MW-71`. | `[ ]` |

---

## 📝 Module 2: Act I & II - Memory Form & Script Genesis

| Step | Action | Hotspot ID | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | Create or select a Memory Document | `HS_ACT1_CREATE_DOC` | Document loads in Act I with empty or initial prose. | `[ ]` |
| **2.2** | Select Sensory Anchors & Trigger Weave Synthesis | `HS_ACT2_SYNTHESIZE_BTN` | AI Director generates sensory weave draft. | `[ ]` |
| **2.3** | Commit Sensory Weave to Production Deck | `HS_ACT2_COMMIT_PROSE_BTN` | Selected take locks into Act II and enables progression to Act III. | `[ ]` |

---

## 🎬 Module 3: Act III - Main Studio & Teleprompter Controls

| Step | Action | Hotspot ID | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | Confirm Optics & Technical Alignment | `HS_STAGE_CONFIRM_ALIGNMENT` | Optics calibration locks and reveals Teleprompter performance card. | `[ ]` |
| **3.2** | Toggle Prompter Size (`sm` → `md` → `lg`) | `HS_PROMPTER_SIZE_BTN` | Prompter window resizes dynamically without layout collapse. | `[ ]` |
| **3.3** | Engage **`[ TABLE READ ]`** Mode | `HS_STAGE_REHEARSAL_TOGGLE_BTN` | Minimizes setup panels, expands prompter height (`h-[calc(100vh-240px)]`), and reveals **`[ VOCAL ]`** button. | `[ ]` |
| **3.4** | Click **`[ VOCAL ]`** Shadowing Button | `HS_PROMPTER_VOCAL_BTN` | GCP TTS / Web Speech synthesizes first 3 sentences aloud, then begins smooth shadowing scroll. | `[ ]` |
| **3.5** | Exit Table Read via **`[ END READ ]`** | `HS_STAGE_REHEARSAL_TOGGLE_BTN` | Restores original layout snapshot and stops audio playback. | `[ ]` |

---

## 🖥️ Module 4: Standalone Popout Teleprompter & Multi-Tab Sync

| Step | Action | Hotspot ID | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | Click **`[ POP OUT ]`** in Teleprompter Control Rail | `HS_PROMPTER_POPOUT_BTN` | Opens standalone bezel-less window at `/studio/teleprompter-popout?sessionId=...`. | `[ ]` |
| **4.2** | Click **`[ REHEARSAL ACTIVE // NO CAPTURE ]`** in Popout Status Bar | `HS_POPOUT_REHEARSAL_TOGGLE_BTN` | Toggles dry-run mode and displays amber **`[ REHEARSAL ACTIVE ]`** badge while muting recording triggers. | `[ ]` |
| **4.3** | Click **`[ VOCAL PARTNER ]`** in Popout Status Bar | `HS_POPOUT_VOCAL_BTN` | Plays vocal lead-in audio directly below the popout camera lens and broadcasts `VOCAL_AUDIO_TOGGLE` to main window. | `[ ]` |
| **4.4** | Test Scroll Speed Sync | `HS_POPOUT_SPEED_INC` / `HS_POPOUT_SPEED_DEC` | Speed adjustment in popout immediately reflects on main studio stage. | `[ ]` |

---

## 🔍 Module 5: Visual HUD Overlay & Telemetry Diagnostics

| Step | Action | Hotspot ID | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **5.1** | Press `Ctrl + Shift + H` (or append `?hotspots=true`) | — | Activates **Visual HUD Overlay**, displaying amber bounding boxes and Hotspot IDs over all interactive buttons. | `[ ]` |
| **5.2** | Perform a series of button clicks while HUD is active | — | Floating badges track smooth scrolling/resizing without blocking physical click trajectories (`pointer-events-none`). | `[ ]` |
| **5.3** | Check Firestore `system_logs` or Console Telemetry | — | Interaction payloads stream with `traceId`, matching `hotspotId`, and `version: "1.0.0-MW-69"`. | `[ ]` |
