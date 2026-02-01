# 🎙️ MemoryWeaver.Studio Development Backlog

## 👥 Role Definitions & Access Levels
- **Host**: Owner, manages quota, generates invites.
- **Storyteller**: Records via remote link, no account/pass required.
- **Guest**: Views shared archives, requires Guest Access Pass.
- **Interviewer**: Facilitates the recording session via prompts.

## Sprint 3: Polish & Recording [🔵 DEPLOYING]
- [x] **STU-43**: Add `storageQuota` to `User` type.
- [x] **STU-45**: Await `cookies()` in `auth/session/route.ts`.
- [x] **STU-46**: Add null check for `adminAuth`.
- [x] **STU-27**: QR FAILURE: Support Host-to-Storyteller session handoff.
- [x] **STU-26**: Secure remote recording endpoint (Edge compatible).
- [x] **STU-52**: LOGIC: Implement Direct-to-Storage upload for Storytellers (Pre-signed URLs).
- [x] **STU-53**: UI: Implement "Thank You" screen for Storytellers.
- [🟡] **STU-54**: QA: End-to-end test of Storyteller-to-Host storage flow.
- [ ] **STU-51**: UI: Add "Pass Active" countdown timer to Settings page (Guest View).