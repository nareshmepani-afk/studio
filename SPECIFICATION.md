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

### The Principle of Humble Inquiry: A Lesson from the Mosh Pit

Our recent descent into the Mosh Pit was a painful but powerful lesson. It stemmed from a single root cause: a failure to ask before acting. We introduced a change—an invalid component variant—without first understanding the component's API. This single act of "blind" creation triggered a cascade of failures: a UI regression, missing dependencies, and a series of painful, time-consuming build errors.

Therefore, we codify a new, paramount principle: **The Principle of Humble Inquiry.**

Humble Inquiry is the practice of seeking to understand a system *before* attempting to change it. It is the antithesis of assumption and the antidote to the chaos of the Mosh Pit. In practice, this means:

*   **Questioning Assumptions:** Before using a component, we must read its source or its documentation. Before modifying a function, we must understand its inputs, outputs, and side effects.
*   **Verifying the Foundation:** Before building, we must verify our dependencies are correct and up-to-date. A clean install and build is not a milestone to be rushed to, but a foundation to be confirmed.
*   **Respecting the Existing State:** All code, no matter how simple it appears, exists in a context. Humble Inquiry demands that we respect that context and seek to understand it before imposing our will upon it.

This principle is not a suggestion; it is a mandate. It is the price of admission to the Clean Room. Adherence to this principle is the primary defense against the Mosh Pit and the only path to a truly robust and elegant system.

## 1. The Ontology (The "Why")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life's narrative. It is not a mere data store; it is a tool for bringing-forth, capturing, and reliving the moments that constitute a life. It prioritizes the authentic, private, and secure preservation of personal history.

## 2. Tech Stack (The Tools)

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
*   **Deployment:** Firebase App Hosting
*   **Firebase Project ID:** `memory-weaver-8rk9t`
*   **Email Service:** Resend
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

### 2.2. Component Library

Our user interface is constructed from a set of reusable components, based on Shadcn UI and styled with Tailwind CSS. This approach ensures visual consistency, promotes code reuse, and accelerates development.

Detailed documentation for each component, including its props, state variations, accessibility guidelines, and best practices, is maintained in the **`ComponentLibrary.md`** file. This document is a critical resource for understanding and effectively utilizing our UI building blocks and is a direct output of the **Principle of Humble Inquiry**.

### 2.3. Environment Strategy

The application will exist in multiple environments to ensure a stable and predictable lifecycle from development to production. Each environment is a self-contained instance of the application with its own configuration, database, and services.

**Environments:**

1.  **Development (`dev`):** The local environment used for active development and initial testing.
2.  **Staging (`staging`):** A pre-production environment that mirrors the production setup. This is used for formal user acceptance testing (UAT) and final validation before a public release. It may be hosted at a subdomain like `test.memory-weaver.com` or `staging.memory-weaver.com`.
3.  **Production (`prod`):** The live, public-facing application, accessible at `memory-weaver.com`.

**Principle of Environmental Parity & Secrets Management:**

To ensure security and prevent cross-contamination, **each environment MUST use its own set of API keys and configuration secrets.** This includes, but is not limited to, keys for Firebase services and third-party APIs like Resend.

-   Secrets will be managed as environment variables within the Firebase environment.
-   Under no circumstances will a secret from one environment be used in another.
-   The process of creating a new environment must include the generation and configuration of a full new set of secrets.

This strict separation is a cornerstone of our security and stability posture.

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
    *   **Successful Deployment:** The application has been successfully deployed to Firebase App Hosting and is live.
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

Manual testing is the formal process of "Witnessing" the application's state. It is a qualitative assessment of the lived experience of using Memory Weaver, designed to be executed by the Principal Witness.

All test cases, protocols, and the history of their execution are maintained in **`MANUAL_TESTING.md`**. This document is the canonical source for our testing process and operates under the following principles:

*   **Plan Mode:** Before executing a test, the AI Tech Lead must generate a detailed, step-by-step plan for approval. This ensures the intent is understood and agreed upon before the formal, witnessed execution begins.
*   **Clear Instructions & Unique IDs:** Every test case has a unique identifier and clear, unambiguous steps.
*   **Instrumented Logging:** The application logs the *before*, *action*, and *after* state for each test step, providing an unambiguous audit trail.
*   **Formal Testimony:** The feedback from the Principal Witness, referencing the Test Step ID and console output, is the formal testimony that validates the application's state.


## 6. Change Log (A History of Poiesis)

*   **2024-XX-XX (Current Session):**
    *   **Successful Deployment to App Hosting:** The application has been successfully built and deployed to Firebase App Hosting.
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
