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
    *   **Unified Data Model & Real-time State Synchronization:** The "Flag for Reuse" feature is now fully functional and consistent across the application. The root cause of the previous bug—a fractured data model where the feature was reading from and writing to two different database locations—has been eliminated. The data model has been unified, with the `flaggedPrompts` array in the main `users` document now serving as the single source of truth. A real-time Firestore `onSnapshot` listener ensures that the UI on all pages (`/prompts`, `/add-memory`) reactively and correctly displays the flag's status.
    *   **Memory Form:** The `MemoryForm` component is robust, handling both the creation of new memories and the editing of existing ones. A UI bug where the flag button was incorrectly triggering form submission has been resolved.
        *   **Media Trimming:** Users can trim the start and end times of video and audio clips.
        *   **QR Code Generation:** A QR code can be generated for each prompt, allowing for a remote interview experience.
        *   **Teleprompter:** A teleprompter script is displayed for each prompt, providing guidance to the user.
    *   **User Authentication:** User authentication (email/password) is stable.
    *   **Timeline View:** The `/timeline` page successfully displays memories from Firestore.
    *   **Legacy Chest:** The "Legacy Chest" feature (`isLegacy` flag) can be toggled from the timeline.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   **Password Reset:** The `requestPasswordResetAction` only logs the reset link to the console. It does not yet send an email to the user. The full password reset flow is therefore still broken.

*   **The Next Horizon (The Path Forward):**
    1.  **Implement Email Service:** The immediate priority is to implement a service to send the password reset email to the user, completing the password reset flow.
    2.  **UI/UX Refinement:** Now that the core functionality is in place, the next step is to refine the user experience. This includes a thorough review of the `add-memory` and `edit-memory` forms to ensure they are intuitive and user-friendly.
    3.  **End-to-End Testing:** A full manual end-to-end test of the memory creation, editing, and deletion process should be conducted to ensure a seamless and bug-free user experience.

### 4.1 Manual End-to-End Testing Protocol (The Witnessing)

To ensure the highest fidelity of testing and to create an unambiguous, formal record, all manual end-to-end tests will adhere to the following protocol. This process is designed to eliminate uncertainty and to allow for the precise identification of any part of the application that becomes `present-at-hand` (i.e., fails or becomes obtrusive).

**The Process:**

1.  **Initiation:** The AI (Lead Architect) will initiate a test session by declaring a unique **Test Session ID**.
2.  **Test Case Definition:** The AI will define a clear **Test Case** with a specific objective.
3.  **Guided Steps:** For each discrete action, the AI will provide a unique **Test Step ID** and a direct, unambiguous instruction.
4.  **The Act of Witnessing:** The manual tester (the user) will perform the action as instructed.
5.  **Feedback as Testimony:** The tester will provide feedback, referencing the **Test Step ID**. This feedback serves as the formal testimony of the application's state of being.
6.  **The Log of Witnessing:** The AI will formally log this testimony, creating a permanent and precise audit trail of the test session.

## 5. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   Healed the critical server crash by rewriting `src/middleware.ts` to be authentic and functional.
    *   Cleared the port and restarted the server, restoring the application to a live state.
    *   Resolved the critical bug in `getMemoryById` where it was querying for a literal string instead of the memory ID. The edit functionality is now restored.
    *   The Guardian of Being was instated. The `SPECIFICATION.md` was brought-forth to establish a ground of truth for the project.
    *   Refactored the `MemoryForm` component, creating a single, authentic component in `src/components/memory/MemoryForm.tsx` and removing duplicated code.
    *   Re-implemented the `requestPasswordResetAction`.
    *   Clarified the two reliable methods for deleting a user from Firebase Authentication.
    *   **Corrected a Fundamental Design Flaw:** A persistent data inconsistency in the "Flag for Reuse" feature was finally resolved. The root cause was identified as a fractured data model, where two separate database locations were being used as the source of truth. The data model was unified to a single source (`users` document), and a UI bug preventing the feature from working correctly was fixed. The previous, incorrect diagnosis of a "race condition" has been acknowledged as a failure of analysis.
    *   **Implemented Core Memory Form Features:**
        *   Added the ability to trim video and audio clips.
        *   Implemented a QR code generation feature for remote interviews.
        *   Added a teleprompter to guide users during recording.
    *   **Resolved all build-time and run-time errors in the `MemoryForm` component.**

## 6. User Management (The Care of the Other)

### 6.1 Deleting a User

The process of deleting a user and their associated data involves two distinct steps: deleting their data from Firestore and deleting their authentication record.

**1. Deleting User Data from Firestore:**

This is the primary method for removing a user's presence from the application. It deletes all their memories, media, and any other data stored in the Firestore database. This is achieved using the Firebase CLI.

*   **Command:** `firebase firestore:delete users/{UID} --recursive`
*   **Description:** This command recursively deletes a document and all its subcollections.
*   **Usage:** Replace `{UID}` with the user's unique ID. The `--recursive` flag is crucial to ensure all associated data is removed.

**2. Deleting a User's Authentication Record:**

This step removes the user's login credentials from the Firebase Authentication system. There are two confirmed methods to achieve this:

*   **Method A: Programmatic Deletion (Server-Side Action)**
    *   **Implementation:** The application contains a server-side action located at `src/actions/deleteUserAction.ts` specifically for this purpose. This action uses the Firebase Admin SDK to delete a user by their UID.
    *   **Prerequisite:** For this action to succeed, the service account used by the application's backend (defined in the `SERVICE_ACCOUNT_JSON` environment variable) must be granted the **"Firebase Authentication Admin"** IAM role in the associated Google Cloud project. Failure to grant this permission will result in an "insufficient permission" error.

*   **Method B: Manual Deletion (Firebase Console)**
    *   **Process:** A user can be deleted directly from the Firebase Console.
    *   **Steps:**
        1. Navigate to the project's Firebase Console.
        2. Go to the "Authentication" section.
        3. In the "Users" tab, find the user to be deleted.
        4. Click the user's menu and select "Delete account".
    *   **Use Case:** This is the most direct and reliable method, especially for one-off deletions or when the service account permissions have not been configured.
