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
    2.  **Full End-to-End Test:** We must now verify the full *Poiesis* of a memory. This involves creating a new memory, editing it, and deleting it to ensure the entire lifecycle is seamless.
    3.  **UI/UX Refinement:** With the core logic sound, we can now turn our `Care` to the user's direct experience. We should review the `add-memory` and `edit-memory` forms to ensure they are intuitive and do not become `present-at-hand`.
    4.  **Authenticity of Emotion:** The `emotionTags` are currently simple strings. We should consider if a more structured or guided approach would better serve the user in the authentic expression of their feelings.

## 5. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   Healed the critical server crash by rewriting `src/middleware.ts` to be authentic and functional.
    *   Cleared the port and restarted the server, restoring the application to a live state.
    *   Resolved the critical bug in `getMemoryById` where it was querying for a literal string instead of the memory ID. The edit functionality is now restored.
    *   The Guardian of Being was instated. The `SPECIFICATION.md` was brought-forth to establish a ground of truth for the project.
    *   Refactore the `MemoryForm` component, creating a single, authentic component in `src/components/memory/MemoryForm.tsx` and removing duplicated code from `src/app/add-memory/loading.tsx` and `src/app/add-memory/page.tsx`. This resolved the "uncontrolled to controlled" warning.
    *   Re-implemented the `requestPasswordResetAction` after discovering it had been removed due to a server crash.

---
