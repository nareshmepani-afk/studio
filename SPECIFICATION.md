# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: Interleaved Thinking

This specification is not a static artifact to be written and then forgotten. It is a **living document**, a direct participant in the *Poiesis* of Memory Weaver. Its existence and the act of maintaining it are intertwined with the development of the application itself.

**Interleaved Thinking** is our core development philosophy. It dictates that:

1.  **Creation and Reflection are One:** The act of writing code and the act of updating this specification are not two separate tasks. They are a single, interleaved process. When a feature is built, changed, or fixed, this document is updated in the same motion.
2.  **The Specification is Testimony:** This document serves as the primary testimony to the application's intended state, its history, and its future horizon. An out-of-date specification is a false witness.
3.  **Continuous Course Correction:** By keeping the specification in constant dialogue with the code, we ensure that both evolve in a coherent and intentional manner. It is our primary tool for preventing the divergence of a project's reality from its original vision.
4.  **Plan Mode as a Bridge:** To prevent the divergence between intent and action, a new workflow layer, **Plan Mode**, is introduced. Before undertaking any complex or critical multi-step action (such as implementing a new feature, performing a significant refactor, or executing a manual test case), the AI assistant must first generate a detailed, step-by-step plan. This plan serves as a proposal to be witnessed and approved by the developer. It bridges the gap between the initial idea and the final code, ensuring clarity, alignment, and a shared understanding of the intended action before execution begins.

Adherence to this principle is mandatory. It is the only way to ensure the authentic and truthful evolution of Memory Weaver.

## 1. The Ontology (The "Why")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life's narrative. It is not a mere data store; it is a tool for bringing-forth, capturing, and reliving the moments that constitute a life. Through features like AI-powered cues, multimedia recording, and an interactive timeline, it aims to become a seamless extension of the user's own memory—a "ready-to-hand" partner in the act of remembrance. It prioritizes the authentic, private, and secure preservation of personal history.

## 2. Tech Stack (The Tools)

The world of this application is built upon a foundation of modern, reactive tools chosen for their ability to create a fluid user experience.

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
*   **Firebase Project ID:** `memory-weaver-8rk9t`
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks (useState, useContext, useCallback), **Firestore Real-time Listeners (`onSnapshot`)**
*   **AI Integration:** Custom flows interacting with a backend AI model.
*   **UI Components:** Shadcn UI, Lucide React
*   **End-to-End Testing:** Formal Manual Protocol

### 2.1. Dependency Management and Project Setup

To prevent the recurrence of build failures due to missing dependencies, the following protocol is instituted:

1.  **Single Source of Truth:** The `package.json` file is the definitive and exhaustive list of all project dependencies.
2.  **Clean Installation:** Any developer or build system must be able to achieve a successful build (`npm run build`) and launch the development server (`npm run dev`) after a fresh clone of the repository followed by a single `npm install` command.
3.  **Dependency-First Development:** When adding new functionality that requires a new dependency, the developer *must first* install and save the dependency (e.g., `npm install new-package`) and verify its inclusion in `package.json` and `package-lock.json` *before* committing the code that imports or uses it.
4.  **Verification as a Mandate:** The 'Project Setup Verification' test case (see `MANUAL_TESTING.md`) is now the first and most critical test to be run to ensure the integrity of the project's foundation.

## 3. Data Structure (The Being)

The core entities that inhabit this world are defined as follows. Their structure reveals their purpose.

```typescript
// Located in: @/types

interface Memory {
  id: string; // Unique identifier
  userId: string; // The creator
  title: string; // A brief, authentic name for the memory
  date: string; // The day the memory occurred
  location?: string; // Where it happened
  description?: string; // The story of the memory
  category?: string; // How the user classifies it (e.g., travel, family)
  emotionTags: string[]; // Feelings associated with the memory
  mediaAttachments: MediaAttachment[]; // The sights and sounds
  isLegacy: boolean; // Is this a cherished memory for the "Legacy Chest"?
  promptId?: string; // The ID of the prompt that inspired the memory
  createdAt: string; // When the record was created
  updatedAt: string; // When the record was last touched
}

interface MediaAttachment {
  id: string;
  url: string; // The location in Firebase Storage
  type: 'audio' | 'video';
  filename: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  isTrimmed?: boolean;
}

interface Prompt {
    id: string;
    text: {
        en: string;
        gu: string;
    };
    subPrompts?: Prompt[];
}

// Inferred from server actions and UI components
interface UserProfile {
    uid: string;
    email: string;
    userProfileNotes?: string; // Notes for the AI to tailor suggestions
    flaggedPrompts?: string[];
}
```

## 4. Current Horizon (The State of Being)

*   **Ready-to-Hand (What is Working):**
    *   **System Stability:** The application is stable. All known critical UI, logic, and security errors have been resolved.
    *   **Backend Security:** The Firestore security rules have been corrected and deployed, ensuring users can only access their own data. This has resolved the critical `Missing or insufficient permissions` error.
    *   **Component Reusability:** The QR code dialog feature is fully functional and correctly uses the reusable `QrCodeDialog` component with the correct URL generation logic.
    *   **Memory Lifecycle:** The full create, read, update, and delete (CRUD) lifecycle for memories is fully functional.
    *   **Unified Data Model & Real-time State Synchronization:** The "Flag for Reuse" feature is now fully functional, with real-time updates correctly reflected in the UI, thanks to the corrected security rules.
    *   **Memory Form:** The `MemoryForm` component is robust, handling new memory creation, editing, media trimming, and QR code generation.
    *   **User Authentication:** User authentication (email/password) is stable.
    *   **Timeline View:** The `/timeline` page successfully displays memories from Firestore.
    *   **Legacy Chest:** The "Legacy Chest" feature (`isLegacy` flag) can be toggled from the timeline.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   **Password Reset:** The `requestPasswordResetAction` only logs the reset link to the console. It does not yet send an email to the user. The full password reset flow is therefore still broken.

*   **The Next Horizon (The Path Forward):**
    1.  **Establish Manual Testing Protocol:** The immediate priority is to establish and document a formal manual end-to-end testing protocol. This will create a robust framework for verifying the application's state.
    2.  **Implement Email Service:** The next priority is to implement a service to send the password reset email to the user, completing the password reset flow.
    3.  **UI/UX Refinement:** Once the core functionality is covered by tests, the next step is to refine the user experience.

## 5. Manual Testing Protocol (The Witnessing)

To ensure the highest fidelity of testing and to create an unambiguous, formal record, we will employ a manual method of witnessing the application's state.

Manual testing is essential for understanding the lived experience of the user. It allows for a qualitative assessment of the application's feel and flow. All manual testing will adhere to the following principles:

*   **Living Document:** All manual test cases will be stored and maintained in a dedicated file: `MANUAL_TESTING.md`.
*   **Clear Instructions:** Each test case will consist of a series of discrete, unambiguous steps.
*   **Unique Identifiers:** Each test session, case, and step will have a unique ID to ensure precise communication and tracking.
*   **Instrumented Application Logging:** The application itself will be instrumented to log the execution and completion of each Test Step ID to the browser's console. This creates an incorruptible, self-generated audit trail.
*   **Meaningful Testimony:** The console log for each test step must provide a complete testimony of the state change. It must record the state *before* the action, the *action itself*, and the state *after* the action. This provides an unambiguous basis for judging pass or fail.
*   **Formal Testimony:** The tester's feedback, referencing the Test Step ID and the complete console output, serves as the formal testimony of the application's state.

## 6. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   **Instituted Dependency Protocol:** Added a formal protocol for dependency management to `SPECIFICATION.md` and a corresponding verification test case to `MANUAL_TESTING.md` to prevent future build failures.
    *   **Clarified Testing Protocol:** Removed all references to automated testing, in accordance with the project's directive to rely on a manual-only testing protocol.
    *   **Resolved Critical Security Flaw:** Corrected and deployed Firestore security rules to resolve a `Missing or insufficient permissions` error. The new rules properly secure user data, allowing users to read and write only their own documents. This fixed the real-time sync functionality for the "Flag for Reuse" feature.
    *   **Fixed Deployment Blocker:** Created the `firestore.indexes.json` file, which was missing from the project and preventing Firestore rules from being deployed.
    *   **Corrected URL Regression:** Fixed a bug in the QR code generation logic that was creating an incorrect URL, a regression introduced in a previous fix.
    *   **Corrected a Gross Process Failure:** Refactored a flawed, bespoke QR code dialog in the `add-memory` page to use the correct, reusable `QrCodeDialog` component. This corrected a blatant violation of the DRY principle and the "Interleaved Thinking" philosophy, and fixed the associated UI bugs and accessibility warnings. The repeated failures to address this simple issue serve as a permanent reminder of the dangers of sloppy, unreflective coding.
    *   **Corrected a Fundamental Process Flaw:** Instituted the "Interleaved Thinking" principle to ensure the specification is a living document, updated in lockstep with the code.
    *   **Resolved Root Cause of UI Error:** After numerous failures, correctly identified and fixed the `ReferenceError: DialogTrigger is not defined` in `src/app/add-memory/page.tsx`.
    *   **Elevated Logging Standard:** The testing protocol has been upgraded to require a **Meaningful Testimony** in the console logs.
    *   **Upgraded Testing Protocol:** The manual testing protocol has been upgraded to mandate **Instrumented Application Logging**.
    *   **Corrected a Fundamental Design Flaw:** Resolved a persistent data inconsistency in the "Flag for Reuse" feature.

## 7. User Management (The Care of the Other)

### 7.1 Deleting a User

The process of deleting a user and their associated data is a critical operation that requires careful, verifiable steps. It involves two distinct stages: deleting their data from Firestore and deleting their authentication record.

**1. Deleting User Data from Firestore:**

*   **Command:** `firebase firestore:delete users/{UID} --recursive`
*   **Note:** This command should be executed with care, as it permanently removes all data associated with the user in the Firestore database.

**2. Deleting a User's Authentication Record:**

*   **Primary Method (For Formal Testing): Manual Deletion**
    *   **Action:** The user's authentication record must be deleted manually from the Firebase Console.
    *   **URL:** [https://console.firebase.google.com/project/memory-weaver-8rk9t/authentication/users](https://console.firebase.google.com/project/memory-weaver-8rk9t/authentication/users)
    *   **Justification:** Manual deletion provides a clear, auditable trail for the purpose of formal witnessing. It eliminates the risk of script errors and ensures the action is performed with deliberate intent.

*   **Secondary Method (For Programmatic Needs): Server-Side Action**
    *   A server-side action (`deleteUserAction.ts`) exists for programmatic user deletion. This should be used for automated processes, not for formal manual testing.
