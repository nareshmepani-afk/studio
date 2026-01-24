# 🎙️ MemoryWeaver.Studio Development Backlog

## Sprint 1: Studio Foundation [🟡 IN PROGRESS]
- [x] **STU-01a**: Fix `useIsMobile` import path.
- [x] **STU-01b**: Restore `switchCamera` logic in `useCamera.ts`.
- [x] **STU-01c**: Fix TypeScript implicit any in `MetadataInspector.tsx`.
- [x] **STU-01d**: Define `TeleprompterControlsProps` interface in `Studio.tsx`.
- [x] **STU-01e**: Sync `useStudioMode.ts` return keys (`studioMode`, `toggleStudioMode`).
- [x] **STU-01f**: **Fix Hook-UI Mismatch**: Synced `useCameraManager.ts` with `Studio.tsx`.
- [x] **STU-01h**: Add `isRecording` to `useStudio` hook state.
- [x] **STU-01i**: **Fix Hook-UI Mismatch**: Aligned `useTeleprompter` returns.
- [ ] **STU-01j**: **Fix Prop Drilling**: Pass `stream` from `cameraManager` to `DirectorMonitor` in `Studio.tsx`. [🔴 CURRENT BLOCKER]
- [ ] **STU-02**: Define Studio Design System in `tailwind.config.ts` (Colors & Typography).
- [ ] **STU-03**: Finalize `useStudioMode.ts` logic (Solo vs. Interview session persistence).
- [🟡] **STU-04**: Implement `DirectorMonitor.tsx` (Video Feed + Tally Light logic). [IN PROGRESS]
- [ ] **STU-05**: Create `Teleprompter.tsx` (Responsive Serif text engine).
- [ ] **STU-06**: Build `ModeSwitcher.tsx` (Framer Motion UI).
- [ ] **STU-07**: Assemble `src/app/add-memory/page.tsx` using modular components.

## Sprint 2: Remote Direction & QA
- [ ] **STU-08**: QR Code Remote Control logic (Interviewer Mode).
- [ ] **STU-09**: Implement Vitest Smoke Tests for Journey switching.
- [ ] **STU-10**: End-to-end recording flow verification.