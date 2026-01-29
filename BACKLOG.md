# 🎙️ MemoryWeaver.Studio Development Backlog

## Sprint 3: Polish & Recording [🟡 IN PROGRESS]
- [x] **STU-10/11/12**: Recording & Review Logic.
- [x] **STU-21**: **CRITICAL BUILD FIX**: Next.js 15 Async Params fix (In Progress).
- [x] **STU-26**: **AUTH BYPASS**: Update `middleware.ts` to allow public access to `/remote/*` routes so QR scans don't hit the Sign-In wall.
- [ ] **STU-22**: **Studio Exit Controls**: Add "Back/Cancel" to `/add-memory`.
- [x] **STU-23**: **QR Direct-to-Remote**: Ensure scanning the Remote QR lands on the Slider UI, not the Prompt Preview.
- [ ] **STU-24**: **Remote Control UI**: Create the user interface for the remote control, including sliders for scroll speed and font size, and toggles for mirroring and scrolling.


## Sprint 4: User Journey & Roleplay [⏳ PLANNED]
- [ ] **STU-18**: **Hybrid Auth/Guest Flow**: Implement `signInAnonymously()` for mobile guests so they can write to Firestore without a full account.
- [ ] **STU-25**: **Remote UX Testing**: Test the "Scan-to-Slider" flow with both logged-in and logged-out mobile devices.
- [ ] **STU-15**: **Role Selection Splash**: Pick "Self/Solo" or "Interview" mode.
- [ ] **STU-20**: **Session Persistence**: Ensure Prompt ID carries through the navigation.
