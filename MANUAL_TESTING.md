
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

## Active Sprint Test Session

**Sprint ID:** `registration-workflow-2024-05-24`

**Objective:** To diagnose and resolve the user registration workflow failure.

**Base URL:** `https://studio--memory-weaver-8rk9t.us-central1.hosted.app/`

### Test Case 1: User Registration End-to-End Test

*   **Objective:** To trace the user registration process from form submission to successful login and redirection.
*   **Pre-requisites:** The user must be on the `/register` page.
*   **`reg-tc1-ts1`**: Open the browser's developer console and keep it open to monitor the `TESTIMONY` logs.
*   **`reg-tc1-ts2`**: Fill out the registration form with a unique email and a strong password.
*   **`reg-tc1-ts3`**: Click the "Get Started for Free" button.
*   **`reg-tc1-ts4`**: Observe the console for the `TESTIMONY` logs. Verify that the user is redirected to the `/timeline` page and a success toast message is displayed.

### Test Case 2: Server-Side User Profile Creation

*   **Objective:** To verify that a user profile is created in Firestore when a new user is created in Firebase Authentication.
*   **Pre-requisites:** Access to the Firebase console.
*   **`reg-tc2-ts1`**: Navigate to the Firebase console and create a new user in the Authentication section.
*   **`reg-tc2-ts2`**: Navigate to the Firestore `users` collection.
*   **`reg-tc2-ts3`**: Verify that a new document exists in the `users` collection with the UID of the user created in the previous step.

---

## Test Session Archive

### Sprint ID: `ffmpeg-race-condition-validation-2024-05-24`

*   **Objective:** To determine if a race condition exists when loading and using FFmpeg concurrently.
*   **Test Case 1: Concurrent FFmpeg Initialization Test**
    *   `ffmpeg-race-tc1-ts1` - `ffmpeg-race-tc1-ts5`

### Sprint ID: `ux-refinement-2024-05-24`

*   **Objective:** To conduct a comprehensive walkthrough of the application to identify UI/UX refinements.
*   **Test Case 1: Comprehensive Application Walkthrough**
    *   `walkthrough-tc1-ts1` - `walkthrough-tc1-ts8`

### Sprint ID: `password-reset-2024-05-23`

*   **Objective:** To provide a definitive, witnessed validation of the end-to-end password reset functionality, confirming the fix for the Firebase Admin SDK initialization and the `RESEND_API_KEY` configuration.
*   **Test Case 0: Full Password Reset and Login**
    *   `witness-reset-tc0-ts1` - `witness-reset-tc0-ts6`

### Sprint ID: `core-functionality-2024-05-21`

*   **Objective:** To perform a comprehensive end-to-end test of the application's core features, establishing a baseline of stability.
*   **Test Case 1: User Authentication Lifecycle**
    *   `auth-tc1-ts1` - `auth-tc1-ts7`
*   **Test Case 2: "Flag for Reuse" Real-time Synchronization**
    *   `flag-tc1-ts1` - `flag-tc1-ts6`
*   **Test Case 3: QR Code URL Generation**
    *   `qr-tc1-ts1` - `qr-tc1-ts3`
*   **Test Case 4: Teleprompter Tooltip Verification**
    *   `tele-tc1-ts1` - `tele-tc1-ts2`

### Sprint ID: `git-integrity-2024-05-22`

*   **Objective:** To verify the integrity of the Git repository, ensuring that no sensitive files are present in the history and that the `.gitignore` file is functioning correctly.
*   **Test Case 0: Git History Verification**
    *   `git-tc0-ts1`
*   **Test Case 1: `.gitignore` Verification**
    *   `git-tc1-ts1` - `git-tc1-ts3`

### Archived Test Sessions

*   **Test Session:** `add-memory-2024-05-20-protocol-alpha`
*   **Test Session:** `project-integrity-2024-05-22-alpha`
*   **Test Session:** `auth-password-reset-2024-05-23-alpha`
*   **Test Session:** `password-reset-2024-05-23-final`
