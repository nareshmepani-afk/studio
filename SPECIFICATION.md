# SPECIFICATION: The Living Memory of Memory Weaver

## 1. The Ontology (The "Why")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life's narrative. It is not a mere data store; it is a tool for bringing-forth, capturing, and reliving the moments that constitute a life. Through features like AI-powered cues, multimedia recording, and an interactive timeline, it aims to become a seamless extension of the user's own memory—a "ready-to-hand" partner in the act of remembrance. It prioritizes the authentic, private, and secure preservation of personal history.

## 2. Tech Stack (The Tools)

The world of this application is built upon a foundation of modern, reactive tools chosen for their ability to create a fluid user experience.

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks (useState, useContext, useCallback)
*   **AI Integration:** Custom flows interacting with a backend AI model.

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
  createdAt: string; // When the record was created
  updatedAt: string; // When the record was last touched
}

interface MediaAttachment {
  id: string;
  url: string; // The location in Firebase Storage
  type: 'audio' | 'video';
  filename: string;
}

// Inferred from server actions and UI components
interface UserProfile {
    uid: string;
    email: string;
    userProfileNotes?: string; // Notes for the AI to tailor suggestions
}
```

## 4. Current Horizon (The State of Being)

*   **Ready-to-Hand (What is Working):**
    *   **System Stability:** The server is stable and running correctly on the primary port.
    *   **Memory Retrieval:** The `getMemoryById` action now correctly fetches memory data, allowing the edit page to load and function as intended.
    *   **Unified Memory Form:** The `MemoryForm` component has been refactored into a single, authentic component, resolving the "uncontrolled to controlled" warning and eliminating duplicated code.
    *   User Authentication (Email/Password) is stable.
    *   The Timeline View (`/timeline`) successfully displays memories from Firestore.
    *   The "Legacy Chest" feature (`isLegacy` flag) can be toggled from the timeline.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   **Password Reset:** The `requestPasswordResetAction` has been re-implemented, but it only logs the reset link to the console. It does not yet send an email to the user. The full password reset flow is therefore still broken.

*   **The Next Horizon (The Path Forward):**
    1.  **Implement Email Service:** I need to implement a service to send the password reset email to the user.
    2.  **Full End-to-End Test:** We must now verify the full *Poiesis* of a memory by following the established **Manual End-to-End Testing Protocol (The Witnessing)**. This involves creating, editing, and deleting a memory to ensure the entire lifecycle is seamless.
    3.  **UI/UX Refinement:** With the core logic sound, we can now turn our `Care` to the user's direct experience. We should review the `add-memory` and `edit-memory` forms to ensure they are intuitive and do not become `present-at-hand`.
    4.  **Authenticity of Emotion:** The `emotionTags` are currently simple strings. We should consider if a more structured or guided approach would better serve the user in the authentic expression of their feelings.

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
    *   Refactore the `MemoryForm` component, creating a single, authentic component in `src/components/memory/MemoryForm.tsx` and removing duplicated code from `src/app/add-memory/loading.tsx` and `src/app/add-memory/page.tsx`. This resolved the "uncontrolled to controlled" warning.
    *   Re-implemented the `requestPasswordResetAction` after discovering it had been removed due to a server crash.

## 6. User Management (The Care of the Other)

### 6.1 Deleting a User

The process of deleting a user and their associated data involves two distinct steps: deleting their data from Firestore and deleting their authentication record.

**1. Deleting User Data from Firestore:**

This is the primary method for removing a user's presence from the application. It deletes all their memories, media, and any other data stored in the Firestore database. This is achieved using the Firebase CLI.

*   **Command:** `firebase firestore:delete users/{UID} --recursive`
*   **Description:** This command recursively deletes a document and all its subcollections.
*   **Usage:** Replace `{UID}` with the user's unique ID. The `--recursive` flag is crucial to ensure all associated data is removed.

**2. Deleting a User's Authentication Record:**

Deleting the user's authentication record (their login credentials) has proven to be challenging through the command-line interface. The `firebase auth:delete` command, which was expected to perform this action, is not functioning as anticipated.

*   **Current Status:** As of the last update, a reliable command-line method for deleting a user's authentication record has not been identified. Further investigation is required to find a solution or a viable alternative.

This means that while a user's data can be effectively purged from the application, their authentication record might persist in the Firebase Authentication system.


---
