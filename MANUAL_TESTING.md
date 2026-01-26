# 🧪 Manual End-to-End Testing Protocol (Updated Jan 2026)

## The Protocol
*Refer to the top of this document for the philosophy of "The Clean Room" vs "The Mosh Pit".*

---

## Active Sprint Test Session

**Sprint ID:** `studio-remote-persistence-2026-01-25`

**Objective:** To verify real-time sync, video persistence, and the post-upload navigation flow.

**Base URL:** `https://studio--memory-weaver-8rk9t.us-central1.hosted.app/`

### Test Case 1: Remote Control Handoff & Synchronization
1. **`stu-rem-tc1-ts1`**: On Desktop, navigate to `/add-memory`. Click "Remote Control" to reveal the QR code.
2. **`stu-rem-tc1-ts2`**: Scan QR with mobile. **Expected:** Mobile opens `/remote` and shows "Connected".
3. **`stu-rem-tc1-ts3`**: Move "Font Size" slider to max on Mobile.
4. **`stu-rem-tc1-ts4`**: **Witnessing Step:** Observe Desktop. **Expected:** Font size increases instantly.
5. **`stu-rem-tc1-ts5`**: Toggle "Mirror Mode" on Mobile. **Expected:** Desktop text flips horizontally.

### Test Case 2: Recording, Tally Logic, and Persistence
1. **`stu-rec-tc2-ts1`**: On Mobile Remote, press "Start Session".
2. **`stu-rec-tc2-ts2`**: **Witnessing Step:** Observe Desktop Monitor. **Expected:** "ON AIR" light pulses red.
3. **`stu-rec-tc2-ts3`**: Record 10s of video. Press "Stop Session" on Mobile.
4. **`stu-rec-tc2-ts4`**: **Expected:** Desktop UI displays `<Progress />` bar for Firebase Upload.
5. **`stu-rec-tc2-ts5`**: **Witnessing Step:** Open browser console (F12) filter for `TESTIMONY`. Verify: `"Upload Complete: https://firebasestorage.googleapis.com/..."`

### Test Case 3: Post-Upload Navigation (The Redirect)
* **Objective:** Verify the app transitions from Studio to Review mode automatically.

1. **`stu-nav-tc3-ts1`**: Immediately following the completion of `stu-rec-tc2-ts4` (100% progress).
2. **`stu-nav-tc3-ts2`**: **Witnessing Step:** Observe the Desktop Browser URL.
3. **`stu-nav-tc3-ts3`**: **Expected Result:** URL changes from `/add-memory` to `/review/temp-id`.
4. **`stu-nav-tc3-ts4`**: **Expected Result:** The "Review Memory" page renders with the placeholder stats.

---

## Test Session Archive
* [Archived: prompt-memory-creation-2024-05-25]
* [Archived: timeline-debug-2024-05-24]