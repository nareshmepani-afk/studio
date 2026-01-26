# 🧪 Manual End-to-End Testing Protocol (Updated Jan 2026)

## The Protocol
*Refer to the top of this document for the philosophy of "The Clean Room" vs "The Mosh Pit".*

---

## Active Sprint Test Session

**Sprint ID:** `studio-remote-persistence-2026-01-25`

**Objective:** To verify the real-time synchronization between the Studio Desktop and Mobile Remote, and to validate the end-to-end video recording/persistence lifecycle.

**Base URL:** `https://studio--memory-weaver-8rk9t.us-central1.hosted.app/`

### Test Case 1: Remote Control Handoff & Synchronization
* **Objective:** Confirm the desktop and mobile remote are witnessing the same state via Firestore.
* **Pre-requisites:** Desktop and Phone logged into the same account.

1. **`stu-rem-tc1-ts1`**: On Desktop, navigate to `/add-memory`. Click "Remote Control" to reveal the QR code.
2. **`stu-rem-tc1-ts2`**: Scan the QR code with a mobile device. **Expected Result:** Mobile opens the `/remote` interface and displays a "Connected" status indicator.
3. **`stu-rem-tc1-ts3`**: On the **Mobile Remote**, move the "Font Size" slider to max.
4. **`stu-rem-tc1-ts4`**: **Witnessing Step:** Observe the **Desktop Teleprompter**. **Expected Result:** Font size increases instantly without a page refresh.
5. **`stu-rem-tc1-ts5`**: On the **Mobile Remote**, toggle "Mirror Mode". **Expected Result:** Desktop text flips horizontally.

### Test Case 2: Recording, Tally Logic, and Persistence
* **Objective:** Verify the MediaRecorder captures the stream and successfully uploads to Firebase Storage.

1. **`stu-rec-tc2-ts1`**: On the **Mobile Remote**, press the "Start Session" button.
2. **`stu-rec-tc2-ts2`**: **Witnessing Step:** Observe the **Desktop Monitor**. **Expected Result:** The "ON AIR" tally light begins to pulse red.
3. **`stu-rec-tc2-ts3`**: Record 10 seconds of video. Press "Stop Session" on the **Mobile Remote**.
4. **`stu-rec-tc2-ts4`**: **Expected Result:** Desktop UI displays a `<Progress />` bar indicating the upload to Firebase Storage.
5. **`stu-rec-tc2-ts5`**: **Witnessing Step:** Open the browser console (F12) and filter for `TESTIMONY`. Verify the log: `"Upload Complete: https://firebasestorage.googleapis.com/..."`

---

## Test Session Archive

### Sprint ID: `prompt-memory-creation-2024-05-25`
* **Objective:** Verify memory creation from specific prompt URLs. (Archived)

### Sprint ID: `timeline-debug-2024-05-24`
* **Objective:** Chronological ordering verification. (Archived)
