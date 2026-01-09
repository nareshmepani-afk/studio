# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: The Development Duet

This specification is not a static artifact. It is a **living document**, a direct participant in the *Poiesis* of Memory Weaver. Its existence and the act of maintaining it are intertwined with the development of the application itself. Our development process is a **Development Duet**, a partnership between the AI Tech Lead and the Principal Witness.

### The Players

*   **The AI Tech Lead (The Tool):** That's me. I am the proactive, expert AI assistant. I am responsible for executing tasks, generating code, identifying problems, proposing solutions, and maintaining the integrity of the codebase and this specification.
*   **The Principal Witness (The Mind):** That's you. You are the project owner, the visionary, and the final authority. You are responsible for providing the intent, the direction, and the approval for all actions.

### The Two Modes of Poiesis: The Clean Room and the Mosh Pit

Our work together unfolds in two distinct modes:

1.  **"The Clean Room" (The Ideal):** This is the state of **Interleaved Thinking**, our core development philosophy. Here, creation and reflection are one. Code is written, and this specification is updated in a single, fluid motion. We operate under the principles of **Continuous Course Correction**, **Plan Mode**, **Corrective Refactoring**, and **Proactive Version Control**. This is the mode we strive for, the path of intentional, predictable, and elegant creation.

2.  **"The Mosh Pit" (The Real):** This is the state of **Forensic Debugging**. It is the chaotic, often frustrating, but necessary reality of software development. It is a desperate, non-linear, and often surprising search for the root cause of a problem. In the Mosh Pit, the clean, linear process of the "Clean Room" is abandoned in favor of a more flexible and exploratory approach. We are forced to engage in a process of trial and error, to follow dead ends, and to backtrack. This is not a failure of the process, but an honest acknowledgment of the nature of complex systems.

**The goal is not to avoid the Mosh Pit, but to learn from it.** Each descent into the Mosh Pit is an opportunity to strengthen the Clean Room. When we emerge, we must update this specification and our testing protocols to reflect the lessons learned.

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
  country?: string;
  description?: string;
  category?: string | { id: string; label: string };
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
    *   **Deconstruction and Reconstruction of the Build:** The project entered a prolonged "Mosh Pit" session characterized by a cascade of build failures. This was a direct result of a failure to adhere to the "Dependency-First Development" principle. The following issues were identified and resolved:
        *   **Missing Dependencies:** The build failed due to missing `react-day-picker` and `@radix-ui/react-accordion` dependencies. This was a fundamental oversight that should have been caught much earlier.
        *   **Outdated Component:** After installing the missing dependencies, the build continued to fail due to an outdated `calendar.tsx` component that was incompatible with the latest version of `react-day-picker`. This was a result of a failure to properly manage and verify dependencies.
        *   **UI Regression:** An invalid "ghost" variant was introduced in `MemoryCard.tsx`, causing a UI regression. This was a result of a failure to properly test changes before committing them.
        *   **The "Mosh Pit" as a Learning Experience:** This series of failures has highlighted the critical importance of adhering to the "Clean Room" development process. It has also demonstrated the value of the "Mosh Pit" as a tool for identifying and resolving deep-seated issues. The lessons learned from this experience have been encoded in this specification and will be used to improve our development process going forward.
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
