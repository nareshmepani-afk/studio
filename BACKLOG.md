# 🎙️ MemoryWeaver.Studio Development Backlog

## 👥 Role Definitions & Access Levels
- **Host**: Owner, manages quota, generates invites.
- **Storyteller**: Records via remote link, no account/pass required.
- **Guest**: Views shared archives, requires Guest Access Pass.
- **Interviewer**: Facilitates the recording session via prompts.

## Sprint 3: Polish & Recording
- [x] **STU-43**: Add `storageQuota` to `User` type.
- [x] **STU-45**: Await `cookies()` in `auth/session/route.ts`.
- [x] **STU-46**: Add null check for `adminAuth`.
- [x] **STU-27**: QR FAILURE: Support Host-to-Storyteller session handoff.
- [x] **STU-26**: Secure remote recording endpoint.