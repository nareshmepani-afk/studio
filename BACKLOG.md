# 🎙️ MemoryWeaver.Studio Development Backlog

## 👥 Role Definitions & Access Levels
- **Host**: Owner, manages quota, generates invites.
- **Storyteller**: Records via remote link, no account/pass required.
- **Guest**: Views shared archives, requires Guest Access Pass.

## Sprint 3: Polish & Recording [🔴 BUILD FIXING]
- [x] **HOTFIX-01**: Export `adminStorage` from `src/lib/firebase-admin.ts`.
- [x] **HOTFIX-02**: Fix null check for `adminAuth` in session route.
- [x] **HOTFIX-03**: Fix null check for `adminStorage` in `upload/request/route.ts`.
- [ ] **STU-54**: QA: End-to-end test of Storyteller-to-Host storage flow.
- [ ] **STU-51**: UI: Add "Pass Active" countdown timer to Settings page.
