# 🎙️ MemoryWeaver.Studio Development Backlog

## Sprint 1: Studio Foundation [✅ COMPLETE]
- [x] **STU-01 - STU-07**: Core Layout, Wiring, and Responsive Assembly.
- [x] **STU-02**: Studio Design System (Deep Black/Recording Red).
- [x] **STU-05a/b**: Mirror Mode & Smooth Deceleration.

## Sprint 2: Remote Direction & QA [✅ COMPLETE]
- [x] **STU-08**: Remote Control via Firestore & /remote page.
- [x] **STU-08b**: Real-time Connection Status Indicator.
- [x] **STU-09**: Manual Walkthrough & Cross-device Validation.
- [x] **STU-08-FIX**: **"State Storm" Fixed.** Implemented Sync Guard to resolve infinite loop.
- [x] **STU-19**: **Performance Polish**: Added debounce to prevent Firestore flooding.

## Sprint 3: Polish & Recording [🟡 IN PROGRESS]
- [x] **STU-10**: Video Recording Persistence.
- [x] **STU-11**: Review Page RESTORED.
- [x] **STU-12**: **Deep Integration**: Passing Video URL to Review.
- [x] **STU-21**: **CRITICAL BUILD FIX**: Update `review/[id]` and `studio/[id]` dynamic routes to use Next.js 15 Async Params. (Prevents 404 on "Start Recording").
- [ ] **STU-22**: **Studio Exit Controls**: Add navigation controls (e.g., "Back" or "Cancel") to the `/add-memory` page.

## Sprint 4: User Journey & Roleplay [⏳ PLANNED]
- [ ] **STU-15**: **Role Selection Splash**: Pick "Self/Solo" or "Interview" mode.
- [ ] **STU-16**: **Contextual UI**: Adapt navigation/wording based on Role.
- [ ] **STU-20**: **Session Persistence**: Ensure "Start Recording" remembers the Prompt ID.
- [ ] **STU-18**: **Guest Access Logic**: Allow Mobile Remote control without full Sign-In.
- [ ] **STU-17**: **Interview Toolkit**: Split host/guest control permissions.