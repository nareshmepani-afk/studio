# Manual End-to-End Testing Protocol

This document is the living record of all manual end-to-end testing performed on the Memory Weaver application. It is a formal process of "Witnessing" designed to be executed by a human tester to assess the qualitative, lived experience of using the application.

## The Process

1.  **Initiation:** The AI (Lead Architect) will define a new Test Session.
2.  **Test Case Definition:** The AI will define a clear Test Case with a specific objective.
3.  **Guided Steps:** For each discrete action, the AI will provide a unique Test Step ID and a direct, unambiguous instruction.
4.  **The Act of Witnessing:** The manual tester (the user) will perform the action as instructed.
5.  **Instrumented Application Logging:** The application itself has been instrumented to automatically log the full context of each Test Step to the browser's developer console. The tester must have the console open to witness this log.
6.  **Meaningful Testimony:** The console log for each test step must provide a complete testimony of the state change. It must record the state *before* the action, the *action itself*, and the state *after* the action. This provides an unambiguous basis for judging pass or fail.
7.  **Feedback as Testimony:** The tester will provide feedback, referencing the Test Step ID and confirming that the console output provides a complete and meaningful testimony of the action's outcome. This feedback serves as the formal testimony of the application's state of being.

---

## Test Session: `add-memory-2024-05-20-protocol-alpha`

### Test Case 1: Flag/Unflag Prompt

*   **Test Step ID:** `am-tc1-ts0`
    *   **Instruction:** With the developer console open, navigate to the URL: `https://9000-firebase-studio-1749052623784.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev/add-memory?promptId=p1`. 
    *   **Expected Result:** The console should log the initial state of the prompt flag for `p1`.

*   **Test Step ID:** `am-tc1-ts1`
    *   **Instruction:** Click the "Flag" icon in the top right corner of the "The Details" card.
    *   **Expected Result:** The console should log that the action is to *flag* the prompt, and then confirm that the prompt's `isFlagged` state is now `true`.

*   **Test Step ID:** `am-tc1-ts2`
    *   **Instruction:** Does the flag icon now appear filled with the primary color, and have you remained on the `/add-memory` page?

*   **Test Step ID:** `am-tc1-ts3`
    *   **Instruction:** Click the "Flag" icon again.
    *   **Expected Result:** The console should log that the action is to *unflag* the prompt, and then confirm that the prompt's `isFlagged` state is now `false`.

*   **Test Step ID:** `am-tc1-ts4`
    *   **Instruction:** Does the flag icon now appear in its original, unfilled state, and have you remained on the `/add-memory` page?

### Test Case 2: QR Code Dialog

*   **Test Step ID:** `am-tc2-ts1`
    *   **Instruction:** Click the "QR Code" icon located next to the "Flag" icon.

*   **Test Step ID:** `am-tc2-ts2`
    *   **Instruction:** Does a dialog titled "Scan for Prompt" appear, containing a visible QR code? Confirm that the console shows logs for `am-tc2-ts1`.

*   **Test Step ID:** `am-tc2-ts3`
    *   **Instruction:** Please close the dialog.

### Test Case 3: Teleprompter Tooltip

*   **Test Step ID:** `am-tc3-ts1`
    *   **Instruction:** Hover your mouse cursor over the "Info" icon (the letter 'i' in a circle).

*   **Test Step ID:** `am-tc3-ts2`
    *   **Instruction:** Does a tooltip appear displaying the teleprompter script for this prompt? Confirm that the console shows logs for `am-tc3-ts1`.

### Test Case 4: Form Input, Media Capture, and Submission

*   **Test Step ID:** `am-tc4-ts1`
    *   **Instruction:** Complete the form fields as follows:
        *   **Title:** "Test Memory One"
        *   **Date:** Select any date.
        *   **Category:** Select any category.
        *   **Location:** "Test Location"
        *   **Description:** "This is a test description."
        *   **Emotions:** Click on one or two emotion tags.

*   **Test Step ID:** `am-tc4-ts2`
    *   **Instruction:** Click the "Next" button.

*   **Test Step ID:** `am-tc4-ts3`
    *   **Instruction:** You should now be on the "Add Media" step. Please click the microphone icon to record a few seconds of audio.

*   **Test Step ID:** `am-tc4-ts4`
    *   **Instruction:** After stopping the recording, use the slider to trim the audio clip.

*   **Test Step ID:** `am-tc4-ts5`
    *   **Instruction:** Click the "Save Memory" button.

*   **Test Step ID:** `am-tc4-ts6`
    *   **Instruction:** Have you been redirected to the `/timeline` page, and do you see a new memory card with the title "Test Memory One"? Confirm that the console shows logs for the form submission.
