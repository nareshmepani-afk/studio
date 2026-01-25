# 🎙️ MemoryWeaver.Studio Development Backlog

## Sprint 1: Studio Foundation [✅ COMPLETE]
- [x] **STU-01 - STU-07**: Core Layout, Wiring, and Responsive Assembly.
- [x] **STU-02**: Studio Design System (Deep Black/Recording Red).
- [x] **STU-05a/b**: Mirror Mode & Smooth Deceleration.

## Sprint 2: Remote Direction & QA [✅ COMPLETE]
- [x] **STU-08**: Remote Control via Firestore & /remote page.
- [x] **STU-08b**: Real-time Connection Status Indicator.
- [x] **STU-09**: Manual Walkthrough & Cross-device Validation.

## Sprint 3: Polish & Recording [🟡 IN PROGRESS]
- [x] **STU-10**: **Video Recording Persistence**:
    - [x] Created `useMediaRecorder` hook with `uploadBytesResumable`.
    - [x] Integrated hook into `Studio.tsx` with "Start Session" button.
    - [x] Implemented `<Progress />` bar for Firebase Storage uploads.
- [🟡] **STU-11**: **Post-Recording Journey**: Redirect to "Review Memory". [IN PROGRESS]
