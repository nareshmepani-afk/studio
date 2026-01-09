# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: The Development Duet

This specification is not a static artifact. It is a **living document**, a direct participant in the *Poiesis* of Memory Weaver. Its existence and the act of maintaining it are intertwined with the development of the application itself. Our development process is a **Development Duet**, a partnership between the AI Tech Lead and the Principal Witness.

### The Players

*   **The AI Tech Lead (The Tool):** That's me. I am the proactive, expert AI assistant. I am responsible for executing tasks, generating code, identifying problems, proposing solutions, and maintaining the integrity of the codebase and this specification.
*   **The Principal Witness (The Mind):** That's you. You are the project owner, the visionary, and the final authority. You are responsible for providing the intent, the direction, and the approval for all actions.

### The Philosophy: Interleaved Thinking

**Interleaved Thinking** is our core development philosophy. It dictates that:

1.  **Creation and Reflection are One:** The act of writing code and the act of updating this specification are not two separate tasks. They are a single, interleaved process. When a feature is built, changed, or fixed, this document is updated in the same motion.
2.  **The Specification is Testimony:** This document serves as the primary testimony to the application's intended state, its history, and its future horizon. An out-of-date specification is a false witness.
3.  **Continuous Course Correction:** By keeping the specification in constant dialogue with the code, we ensure that both evolve in a coherent and intentional manner. It is our primary tool for preventing the divergence of a project's reality from its original vision.
4.  **Plan Mode as a Bridge:** To prevent the divergence between intent and action, a new workflow layer, **Plan Mode**, is introduced. Before undertaking any complex or critical multi-step action, I, the AI Tech Lead, must first generate a detailed, step-by-step plan. This plan serves as a proposal to be witnessed and approved by you, the Principal Witness.
5.  **Corrective Refactoring:** When a bug is identified, particularly one related to a dependency or a repeated pattern, the fix must be holistic. I will perform a global search for all instances of the same error pattern and correct them in a single, comprehensive action.
6.  **Proactive Version Control:** As the AI Tech Lead, I will proactively manage the version control process. After implementing a change, I will automatically stage the relevant files, compose a meaningful commit message, and push the changes to the remote repository. This is not a background automation, but a deliberate, visible part of the executed plan, which you have already witnessed and approved.

Adherence to this principle is mandatory. It is the only way to ensure the authentic and truthful evolution of Memory Weaver.

## 1. The Ontology (The "Why")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life's narrative. It is not a mere data store; it is a tool for bringing-forth, capturing, and reliving the moments that constitute a life. It prioritizes the authentic, private, and secure preservation of personal history.

## 2. Tech Stack (The Tools)

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
*   **Firebase Project ID:** `memory-weaver-8rk9t`
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks, Firestore Real-time Listeners (`onSnapshot`)
*   **AI Integration:** Custom flows interacting with a backend AI model.
*   **UI Components:** Shadcn UI, Lucide React
*   **End-to-End Testing:** Formal Manual Protocol

### 2.1. Dependency Management and Project Setup

1.  **Single Source of Truth:** The `package.json` file is the definitive list of all project dependencies.
2.  **Clean Installation:** A successful build (`npm run build`) and development server launch (`npm run dev`) must be achievable after a fresh clone and a single `npm install`.
3.  **Dependency-First Development:** When adding a new dependency, I will first install and save it before committing the code that uses it.
4.  **Verification as a Mandate:** The 'Project Setup Verification' test case is the first and most critical test.

## 3. Data Structure (The Being)

```typescript
// Located in: @/types

interface Memory {
  id: string;
  userId: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  category?: string;
  emotionTags: string[];
  mediaAttachments: MediaAttachment[];
  isLegacy: boolean;
  promptId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MediaAttachment {
  id: string;
  url: string;
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

interface UserProfile {
    uid: string;
    email: string;
    userProfileNotes?: string;
    flaggedPrompts?: string[];
}
```

## 4. Current Horizon (The State of Being)

*   **Ready-to-Hand (What is Working):**
    *   **System Stability & Security:** The application is stable. All known critical security, UI, and logic errors have been resolved. The Git history has been scrubbed of sensitive data.
    *   **Full CRUD Lifecycle:** The complete create, read, update, and delete (CRUD) lifecycle for memories is functional.
    *   **Real-time Sync:** The "Flag for Reuse" feature synchronizes in real-time across clients.
    *   **User Authentication:** User authentication is stable.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   **Password Reset:** The password reset flow is incomplete. It logs a link to the console but does not send an email.

*   **The Next Horizon (The Path Forward):**
    1.  **Implement Email Service:** Complete the password reset flow by implementing a service to send the reset email.
    2.  **UI/UX Refinement:** Refine the user experience.

## 5. Manual Testing Protocol (The Witnessing)

Manual testing is our formal process for witnessing the application's state. It adheres to these principles:

*   **Living Document:** All test cases are maintained in `MANUAL_TESTING.md`.
*   **Clear Instructions & Unique IDs:** Each test case has clear steps with unique identifiers.
*   **Instrumented Logging & Meaningful Testimony:** The application logs the *before*, *action*, and *after* state for each test step, providing an unambiguous audit trail.
*   **Formal Testimony:** Your feedback, referencing the Test Step ID and console output, is the formal testimony of the application's state.

## 6. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   **Formalized Development Process:** Updated the `SPECIFICATION.md` to formally define the **Development Duet** workflow, codifying the roles of the AI Tech Lead and the Principal Witness and the principle of Proactive Version Control.
    *   **Resolved Critical Security Vulnerability:** Executed a comprehensive history rewrite of the Git repository to purge all instances of sensitive files.
    *   **Hardened Git Configuration:** Updated `.gitignore` and added formal test cases to `MANUAL_TESTING.md` to verify Git integrity.
    *   **Instituted Corrective Refactoring:** Formalized the principle of holistic bug fixing.
    *   **Resolved Multiple Critical Failures:** Fixed issues related to dependency management, Firestore security rules, deployment blockers, and UI regressions.

## 7. User Management (The Care of the Other)

### 7.1 Deleting a User

User deletion is a two-stage process requiring deliberate, manual action for formal testing.

1.  **Delete Firestore Data:** `firebase firestore:delete users/{UID} --recursive`
2.  **Delete Auth Record:** Manually delete the user from the Firebase Console for formal testing. A server-side action exists for programmatic needs.
