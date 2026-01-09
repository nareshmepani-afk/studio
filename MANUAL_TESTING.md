# Manual End-to-End Testing Protocol

This document is the living record of all manual end-to-end testing performed on the Memory Weaver application. It is a formal process of "Witnessing" designed to be executed by a human tester to assess the qualitative, lived experience of using the application.

## The Two Modes of Testing: The Clean Room and the Mosh Pit

Our testing, like our development, unfolds in two distinct modes:

1.  **"The Clean Room" (The Ideal):** This is our formal, structured testing protocol. It is a process of **Witnessing** where we execute pre-defined **Test Cases** to verify the application's functionality. The AI assistant generates a detailed, step-by-step plan for each test, which is then approved by the developer. This is the mode we use to ensure the application is working as intended.

2.  **"The Mosh Pit" (The Real):** This is the state of **Forensic Debugging**. It is a non-linear, exploratory, and often surprising search for the root cause of a problem. In the Mosh Pit, the clean, linear process of the "Clean Room" is abandoned in favor of a more flexible and exploratory approach. We are forced to engage in a process of trial and error, to follow dead ends, and to backtrack. This is not a failure of the process, but an honest acknowledgment of the nature of complex systems.

**The goal is not to avoid the Mosh Pit, but to learn from it.** Each descent into the Mosh Pit is an opportunity to strengthen the Clean Room. When we emerge, we must update this specification and our testing protocols to reflect the lessons learned.

## The Protocol

To bridge the gap between idea and execution, the testing process now incorporates **Plan Mode**. Before initiating a new Test Case, the AI assistant will first generate a detailed, step-by-step plan for the test. This plan will be presented to the developer for witnessing and approval. This ensures that the intent of the test is fully understood and agreed upon before the formal, witnessed execution begins.

1.  **Plan Mode Initiation:** The AI will propose a new Test Case by generating a detailed plan.
2.  **Witness and Approve:** The developer will review and approve the plan, ensuring it aligns with the testing objectives.
3.  **Formal Test Initiation:** Once the plan is approved, the AI will define a new Test Session.
4.  **Guided Steps:** For each discrete action, the AI will provide a unique Test Step ID and a direct, unambiguous instruction.
5.  **The Act of Witnessing:** The manual tester (the user) will perform the action as instructed.
6.  **Instrumented Application Logging:** The application itself has been instrumented to automatically log the full context of each Test Step to the browser's developer console. The tester must have the console open to witness this log.
7.  **Meaningful Testimony:** The console log for each test step must provide a complete testimony of the state change. It must record the state *before* the action, the *action itself*, and the state *after* the action. This provides an unambiguous basis for judging pass or fail.
8.  **Feedback as Testimony:** The tester will provide feedback, referencing the Test Step ID and confirming that the console output provides a complete and meaningful testimony of the action's outcome. This feedback serves as the formal testimony of the application's state of being.

---

## Active Test Session: `git-integrity-2024-05-22-beta`

**Objective:** To verify the integrity of the Git repository, ensuring that no sensitive files are present in the history and that the `.gitignore` file is functioning correctly.

**Base URL:** (N/A - This test is performed in the terminal)

### Test Case 0: Git History Verification

*   **Objective:** To ensure that no sensitive files exist anywhere in the Git history.

*   **Test Step ID:** `git-tc0-ts1`
    *   **Instruction:** Run the command `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch serviceAccountKey.json .env .env.local .env.copy" --prune-empty --tag-name-filter cat -- --all`
    *   **Expected Result:** The command should complete and state that the history has been rewritten. If it fails, the test fails.

### Test Case 1: `.gitignore` Verification

*   **Objective:** To ensure that the `.gitignore` file is correctly preventing sensitive files from being staged.

*   **Test Step ID:** `git-tc1-ts1`
    *   **Instruction:** Create a new file named `serviceAccountKey.json` in the root of the project.
    *   **Expected Result:** The file is created.

*   **Test Step ID:** `git-tc1-ts2`
    *   **Instruction:** Run `git status`.
    *   **Expected Result:** The `serviceAccountKey.json` file should NOT appear in the list of untracked files.

*   **Test Step ID:** `git-tc1-ts3`
    *   **Instruction:** Delete the `serviceAccountKey.json` file.

---

## Active Test Session: `project-integrity-2024-05-22-alpha`

**Objective:** To verify the fundamental integrity of the project setup and ensure a clean, reproducible build.

**Base URL:** (To be provided by the testing environment)

### Test Case 0: Project Setup Verification

*   **Objective:** To ensure that a fresh clone of the repository can be installed and run without errors. This is the foundational test for all development.

*   **Test Step ID:** `setup-tc0-ts1`
    *   **Instruction:** From a clean state (no `node_modules` or `.next` directories), run `npm install`.
    *   **Expected Result:** The command completes without any errors.

*   **Test Step ID:** `setup-tc0-ts2`
    *   **Instruction:** Run `npm run dev`.
    *   **Expected Result:** The development server starts successfully and the application is accessible in the browser. No build errors are present in the terminal.

---

## Active Test Session: `core-functionality-2024-05-21-alpha`

**Objective:** To perform a comprehensive end-to-end test of the application's core features, establishing a baseline of stability.

**Base URL:** (To be provided by the testing environment)

### Test Case 1: User Authentication Lifecycle

*   **Objective:** Verify the complete user authentication flow: registration, logout, and login.

*   **Test Step ID:** `auth-tc1-ts1`
    *   **Instruction:** With the developer console open, navigate to `${Base URL}register`.
    *   **Expected Result:** The registration page loads. No errors are present in the console.

*   **Test Step ID:** `auth-tc1-ts2`
    *   **Instruction:** Fill in the registration form with a valid email and password and click "Register".
    *   **Expected Result:** A new user is created. The console logs the successful authentication and redirection.

*   **Test Step ID:** `auth-tc1-ts3`
    *   **Instruction:** Have you been redirected to the `/prompts` page? Does the navbar show the user's email?

*   **Test Step ID:** `auth-tc1-ts4`
    *   **Instruction:** Click the user email in the navbar, and then click "Log out".
    *   **Expected Result:** The user is logged out. The console logs the logout action.

*   **Test Step ID:** `auth-tc1-ts5`
    *   **Instruction:** Have you been redirected to the `/login` page?

*   **Test Step ID:** `auth-tc1-ts6`
    *   **Instruction:** Log in with the same credentials you just created.
    *   **Expected Result:** The user is logged in. The console logs the successful authentication.

*   **Test Step ID:** `auth-tc1-ts7`
    *   **Instruction:** Have you been redirected back to the `/prompts` page?

### Test Case 2: "Flag for Reuse" Real-time Synchronization

*   **Objective:** Verify that the "Flag for Reuse" feature, now secured by the corrected Firestore rules, synchronizes in real-time across multiple clients.

*   **Test Step ID:** `flag-tc1-ts1`
    *   **Instruction:** In your current browser tab (Tab 1), navigate to `${Base URL}add-memory?promptId=p1`.
    *   **Expected Result:** The Add Memory page loads for prompt `p1`. The console logs the initial, un-flagged state.

*   **Test Step ID:** `flag-tc1-ts2`
    *   **Instruction:** Open a new browser tab (Tab 2) and navigate to the exact same URL: `${Base URL}add-memory?promptId=p1`.
    *   **Expected Result:** The same page loads in the new tab.

*   **Test Step ID:** `flag-tc1-ts3`
    *   **Instruction:** In Tab 1, click the "Flag" icon to flag the prompt.
    *   **Expected Result:** The console in Tab 1 logs the flagging action and the new `isFlagged: true` state. The icon in Tab 1 appears filled.

*   **Test Step ID:** `flag-tc1-ts4`
    *   **Instruction:** Observe Tab 2. Did the flag icon fill in automatically, without a page refresh? Does the console in Tab 2 log the state change pushed from Firestore?

*   **Test Step ID:** `flag-tc1-ts5`
    *   **Instruction:** In Tab 2, click the "Flag" icon to unflag the prompt.
    *   **Expected Result:** The console in Tab 2 logs the unflagging action and the new `isFlagged: false` state. The icon in Tab 2 appears unfilled.

*   **Test Step ID:** `flag-tc1-ts6`
    *   **Instruction:** Observe Tab 1. Did the flag icon return to its unfilled state automatically, without a page refresh? Does the console in Tab 1 log the state change?

### Test Case 3: QR Code URL Generation

*   **Objective:** Verify that the QR code dialog generates the correct URL, confirming the regression is resolved.

*   **Test Step ID:** `qr-tc1-ts1`
    *   **Instruction:** On the `/add-memory?promptId=p1` page, click the "QR Code" icon.
    *   **Expected Result:** The console logs the `qr-tc1-ts1` action.

*   **Test Step ID:** `qr-tc1-ts2`
    *   **Instruction:** Does a dialog appear? Scan the QR code with a device or inspect the component. Does the URL encoded in the QR code correctly resolve to `${Base URL}prompts/p1`?

*   **Test Step ID:** `qr-tc1-ts3`
    *   **Instruction:** Close the dialog.

### Test Case 4: Teleprompter Tooltip Verification

*   **Objective:** To verify that hovering over the "Info" icon on the Add Memory page displays the correct teleprompter script for the given prompt.

*   **Test Step ID:** `tele-tc1-ts1`
    *   **Instruction:** On the `/add-memory?promptId=p1` page, hover your mouse over the "Info" icon.
    *   **Expected Result:** A tooltip appears containing the teleprompter script for prompt `p1`.

*   **Test Step ID:** `tele-tc1-ts2`
    *   **Instruction:** Verify that the text in the tooltip matches the script for `p1` in `src/lib/teleprompterScripts.ts`.
    *   **Expected Result:** The text is an exact match.

---

## Archived Test Sessions

### Test Session: `add-memory-2024-05-20-protocol-alpha`

*   **Base URL:** `https://9000-firebase-studio-1749052623784.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev/`
*   **Status:** Archived. Superseded by `core-functionality-2024-05-21-alpha`.

*   **Test Case 1: Flag/Unflag Prompt**
    *   `am-tc1-ts0` - `am-tc1-ts4`
*   **Test Case 2: QR Code Dialog**
    *   `am-tc2-ts1` - `am-tc2-ts3`
*   **Test Case 3: Teleprompter Tooltip**
    *   `am-tc3-ts1` - `am-tc3-ts2`
*   **Test Case 4: Form Input, Media Capture, and Submission**
    *   `am-tc4-ts1` - `am-tc4-ts6`
