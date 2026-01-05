# SPECIFICATION: The Living Memory of Memory Weaver

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
*   **End-to-End Testing:** Playwright (Automated), Formal Manual Protocol (Manual)

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
    *   **System Stability:** The server is stable and running correctly on the primary port.
    *   **Memory Lifecycle:** The full create, read, update, and delete (CRUD) lifecycle for memories is fully functional.
    *   **Unified Data Model & Real-time State Synchronization:** The "Flag for Reuse" feature is now fully functional and consistent across the application.
    *   **Memory Form:** The `MemoryForm` component is robust, handling both the creation of new memories and the editing of existing ones.
    *   **User Authentication:** User authentication (email/password) is stable.
    *   **Timeline View:** The `/timeline` page successfully displays memories from Firestore.
    *   **Legacy Chest:** The "Legacy Chest" feature (`isLegacy` flag) can be toggled from the timeline.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   **Password Reset:** The `requestPasswordResetAction` only logs the reset link to the console. It does not yet send an email to the user. The full password reset flow is therefore still broken.

*   **The Next Horizon (The Path Forward):**
    1.  **Establish Testing Protocols:** The immediate priority is to establish and document both manual and automated end-to-end testing protocols. This will create a robust framework for verifying the application's state.
    2.  **Implement Email Service:** The next priority is to implement a service to send the password reset email to the user, completing the password reset flow.
    3.  **UI/UX Refinement:** Once the core functionality is covered by tests, the next step is to refine the user experience.

## 4. Testing Protocols (The Witnessing)

To ensure the highest fidelity of testing and to create an unambiguous, formal record, we will employ two complementary methods of witnessing the application's state.

### 4.1 Manual End-to-End Testing Protocol

Manual testing is essential for understanding the lived experience of the user. It allows for a qualitative assessment of the application's feel and flow. All manual testing will adhere to the following principles:

*   **Living Document:** All manual test cases will be stored and maintained in a dedicated file: `MANUAL_TESTING.md`.
*   **Clear Instructions:** Each test case will consist of a series of discrete, unambiguous steps.
*   **Unique Identifiers:** Each test session, case, and step will have a unique ID to ensure precise communication and tracking.
*   **Instrumented Application Logging:** The application itself will be instrumented to log the execution and completion of each Test Step ID to the browser's console. This creates an incorruptible, self-generated audit trail.
*   **Meaningful Testimony:** The console log for each test step must provide a complete testimony of the state change. It must record the state *before* the action, the *action itself*, and the state *after* the action. This provides an unambiguous basis for judging pass or fail.
*   **Formal Testimony:** The tester's feedback, referencing the Test Step ID and the complete console output, serves as the formal testimony of the application's state.

### 4.2 Automated End-to-End Testing Protocol

Automated testing is essential for ensuring the consistent, repeatable verification of core functionality. It provides an incorruptible, machine-generated log of the application's state.

*   **Framework:** Playwright
*   **Test Definition:** A new Playwright test file (e.g., `e2e/feature.spec.ts`) will be created for each feature or user flow.
*   **Instrumented Application Logging:** The application will be instrumented to log Test Step IDs and state changes, which will be captured and asserted against in the Playwright test output.
*   **Programmatic Verification:** The outcome of each action will be programmatically verified using Playwright's assertion library (`expect`).
*   **Test Report Generation:** After the test run is complete, a detailed HTML report will be generated. This report will serve as the incorruptible, formal record of the application's state.

## 5. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   **Elevated Logging Standard:** The testing protocol has been upgraded to require a **Meaningful Testimony** in the console logs. Logs must now record the state before, during, and after an action to be considered a valid witness.
    *   **Upgraded Testing Protocol:** The manual testing protocol has been upgraded to mandate **Instrumented Application Logging**, where the application itself generates the test log. This replaces the flawed, error-prone manual logging process.
    *   **Corrected a Fundamental Design Flaw:** A persistent data inconsistency in the "Flag for Reuse" feature was finally resolved by unifying the data model and fixing a related UI bug.
    *   **Established Dual Testing Protocols:** Corrected a failure in process by formally documenting and embracing both Manual and Automated End-to-End Testing protocols as valid and necessary forms of "Witnessing".
    *   **Implemented Core Memory Form Features:** Added media trimming, QR code generation, and a teleprompter to the memory creation process.
    *   **Resolved numerous bugs** related to server stability, component state, and core functionality.

## 6. User Management (The Care of the Other)

### 6.1 Deleting a User

The process of deleting a user and their associated data involves two distinct steps: deleting their data from Firestore and deleting their authentication record.

**1. Deleting User Data from Firestore:**

*   **Command:** `firebase firestore:delete users/{UID} --recursive`

**2. Deleting a User's Authentication Record:**

*   **Method A: Programmatic Deletion (Server-Side Action)**
*   **Method B: Manual Deletion (Firebase Console)**
