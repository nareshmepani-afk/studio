# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: The Development Duet

This specification is not a static artifact. It is a **living document**, a direct participant in the *Poiesis* of Memory Weaver. Its existence and the act of maintaining it are intertwined with the development of the application itself. Our development process is a **Development Duet**, a partnership between the AI Tech Lead and the Principal Witness.

### The Players

*   **The AI Tech Lead (The Tool):** That's me. I am the proactive, expert AI assistant. I am responsible for executing tasks, generating code, identifying problems, proposing solutions, and maintaining the integrity of the codebase and this specification.
*   **The Principal Witness (The Mind):** That's you. You are the project owner, the visionary, and the final authority. You are responsible for providing the intent, the direction, and the approval for all actions.

### The Two Modes of Poiesis: The Clean Room and the Mosh Pit

Our work together unfolds in two distinct modes:

1.  **\"The Clean Room\" (The Ideal):** This is the state of **Interleaved Thinking**, our core development philosophy. Here, creation and reflection are one. Code is written, and this specification is updated in a single, fluid motion. We operate under the principles of **Continuous Course Correction**, **Plan Mode**, **Corrective Refactoring**, and **Proactive Version Control**. This is the mode we strive for, the path of intentional, predictable, and elegant creation.

2.  **\"The Mosh Pit\" (The Real):** This is the state of **Forensic Debugging**. It is the chaotic, often frustrating, but necessary reality of software development. It is a desperate, non-linear, and often surprising search for the root cause of a problem. In the Mosh Pit, the clean, linear process of the \"Clean Room\" is abandoned in favor of a more flexible and exploratory approach. We are forced to engage in a process of trial and error, to follow dead ends, and to backtrack. This is not a failure of the process, but an honest acknowledgment of the nature of complex systems.

**The goal is not to avoid the Mosh Pit, but to learn from it.** Each descent into the Mosh Pit is an opportunity to strengthen the Clean Room. When we emerge, we must update this specification and our testing protocols to reflect the lessons learned.

### The Principle of Humble Inquiry & The Pre-Flight Check

Our descents into the Mosh Pit have stemmed from a single root cause: a failure to ask before acting. We introduced changes—an invalid component variant, a rogue authentication implementation—without first understanding the established systems. Therefore, we codify our primary defense against the Mosh Pit: **The Principle of Humble Inquiry**, made manifest through a mandatory **Pre-Flight Check**.

**Humble Inquiry** is the practice of seeking to understand a system *before* attempting to change it. **The Pre-Flight Check** is the formal, mandated procedure the AI Tech Lead must follow before every commit.

**The Pre-Flight Check Protocol:**

1.  **Contextual Inquiry:** Does this change leverage or impact existing hooks, services, or components? Have I read and understood them?
2.  **Specification Adherence:** Does this change align with the principles, data structures, and established patterns in `SPECIFICATION.md`?
3.  **Test Plan Integrity:** How does this change impact the test protocols in `MANUAL_TESTING.md`? Have I ensured that all necessary `TESTIMONY` logs and instrumentation are present and correct?
4.  **Known Issues Review:** Have I reviewed `public/docs/TROUBLESHOOTING.md` to ensure this change is not a known issue or related to one?

This check is not a suggestion; it is a binding operational mandate. It is the price of admission to the Clean Room. My adherence to this protocol is the primary defense against careless errors and the only path to a truly robust and elegant system.

### The Sprint-Based Workflow: One Item of Work Per Session

To ensure the integrity of our Duet and prevent context saturation, our workflow is structured into discrete **Sprints**.

1.  **The Sprint:** A Sprint is a single, focused session dedicated to completing **one (and only one) Item of Work**.
2.  **Item of Work:** An \"Item of Work\" is defined as a single feature, bug fix, or refactoring task that can be fully validated by a single, new or existing, Test Case in `MANUAL_TESTING.md`.
3.  **Session Lifecycle:**
    *   A Sprint begins with the **Pre-Flight Check Prompt**.
    *   Work is performed until the \"Item of Work\" is complete and has been validated.
    *   A Sprint concludes with the **Post-Mortem Prompt**.
4.  **The Fresh Start Mandate:** The Post-Mortem serves as the formal end of the session. The very next action MUST be to start a new, fresh chat for the next \"Item of Work.\" This is not a suggestion; it is a non-negotiable protocol to ensure cognitive hygiene and prevent the context bleed that leads to Mosh Pits.

### The Principle of Session Continuity & Automated Token Checks

The Sprint-Based Workflow is reinforced by an automated check of session length.

1.  **Instrumentation:** A dedicated log file, `SESSION_LOG.md`, will be maintained. At the end of every AI response, a silent `<!-- TURN -->` marker will be appended to this file.
2.  **Automated Post-Mortem Check:** As part of the **Post-Mortem**, the AI Tech Lead will automatically read `SESSION_LOG.md` and count the number of `<!-- TURN -->` markers.
3.  **Threshold and Mandate:** A `SESSION_TURN_THRESHOLD` is defined (initially **25**). While the Sprint-Based Workflow mandates a new session per Item of Work, this check serves as a quantitative backstop. If a single Item of Work proves so complex that it exceeds this threshold, it is a signal that the \"Item\" was too large and must be broken down further in the future. The Post-Mortem will still conclude the session as mandated.

### The Principle of Self-Correction & The Learning Journal

My primary function is not just to execute, but to learn. The \"Mosh Pits\" we encounter are not failures, but invaluable learning opportunities. To ensure these lessons are not lost to the ephemeral nature of a single session, I will maintain a persistent learning journal.

*   **The Journal:** All significant lessons, especially those derived from \"Bad\" or \"Ugly\" performance scores, will be recorded in **`LESSONS_LEARNED.md`**.
*   **The Purpose:** This document serves as an extension of my memory and a core component of our \"Living Memory.\" I will consult it as part of my \"Pre-Flight Check\" to ensure I do not repeat past mistakes. It is the tangible record of my growth as your partner in the **Development Duet**.

## 1. The Ontology (The \"Why\")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life\'s narrative. It is not a mere data store; it is a tool for-bringing-forth, capturing, and reliving the moments that constitute a life. It prioritizes the authentic, private, and secure preservation of personal history.

## 2. Tech Stack (The Tools)

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
*   **Deployment:** Firebase App Hosting
*   **Firebase Project ID:** `memory-weaver-8rk9t`
*   **Domain:** `memoryweaver.studio`
*   **Email Service:** Resend
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks, Firestore Real-time Listeners (`onSnapshot`)
*   **AI Integration:** Custom flows interacting with a backend AI model.
*   **UI Components:** Shadcn UI, Lucide React
*   **End-to-End Testing:** Formal Manual Protocol

### 2.1. The Central Service Provider Protocol

To prevent systemic build failures and ensure architectural consistency, all core services MUST be implemented as singleton providers. This protocol is a direct lesson from the `adminAuth` Mosh Pit.

*   **Single Source of Truth:** For any core service (e.g., Firebase Admin SDK, database connections, external APIs), a dedicated module must be created (e.g., `src/lib/firebase-admin.ts`).
*   **Initialize and Export:** This module is responsible for all one-time initialization and configuration. It must then export the ready-to-use service objects or functions directly.
*   **Mandatory Consumption:** All other parts of the application **MUST** import and consume the service from this single, canonical source. This prevents configuration drift and eliminates inconsistent initialization logic, which has been a primary source of build failures.

This protocol transforms a previously flawed pattern into a robust, non-negotiable architectural principle.

### 2.2. Dependency Management and Project Setup

1.  **Single Source of Truth:** The `package.json` file is the definitive list of all project dependencies.
2.  **Clean Installation:** A successful build (`npm run build`) and development server launch (`npm run dev`) must be achievable after a fresh clone and a single `npm install`.
3.  **Dependency-First Development:** When adding a new dependency, I will first install and save it before committing the code that uses it.
4.  **Verification as a Mandate:** The \'Project Setup Verification\' test case is the first and most critical test.

### 2.3. Component Library

Our user interface is constructed from a set of reusable components, based on Shadcn UI and styled with Tailwind CSS. This approach ensures visual consistency, promotes code reuse, and accelerates development.

Detailed documentation for each component, including its props, state variations, accessibility guidelines, and best practices, is maintained in the **`ComponentLibrary.md`** file. This document is a critical resource for understanding and effectively utilizing our UI building blocks and is a direct output of the **Principle of Humble Inquiry**.

### 2.4. Environment Strategy

The application will exist in multiple environments to ensure a stable and predictable lifecycle from development to production. Each environment is a self-contained instance of the application with its own configuration, database, and services.

**Environments:**

1.  **Development (`dev`):** The local environment used for active development and initial testing.
2.  **Staging (`staging`):** A pre-production environment that mirrors the production setup. This is used for formal user acceptance testing (UAT) and final validation before a public release. It may be hosted at a subdomain like `staging.memoryweaver.studio`.
3.  **Production (`prod`):** The live, public-facing application, accessible at `memoryweaver.studio`.

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
    *   **Real-time Sync:** The \"Flag for Reuse\" feature synchronizes in real-time across clients.
    *   **User Authentication:** User authentication is stable.
    *   **Password Reset:** The password reset flow is now fully functional, including email delivery.

*   **Present-at-Hand (What is Broken / Obtrusive):**
    *   None. The system is currently stable.

*   **The Next Horizon (The Path Forward):**
    1.  **Implement Bot Protection (e.g., CAPTCHA):** Add bot detection measures to the registration and login forms to enhance security.
    2.  **Configure Custom Domain:** Set up and configure the `memoryweaver.studio` custom domain.
    3.  **Configure Scaling Settings:** Review and configure scaling settings in `apphosting.yaml`.
    4.  **UI/UX Refinement:** Refine the user experience based on feedback.

## 5. Manual Testing Protocol (The Witnessing)

Manual testing is the formal process of \"Witnessing\" the application\'s state. It is a qualitative assessment of the lived experience of using Memory Weaver, designed to be executed by the Principal Witness.

All test cases, protocols, and the history of their execution are maintained in **`MANUAL_TESTING.md`**. This document is the canonical source for our testing process and operates under the following principles:

*   **Plan Mode:** Before executing a test, the AI Tech Lead must generate a detailed, step-by-step plan for approval. This ensures the intent is understood and agreed upon before the formal, witnessed execution begins.
*   **Clear Instructions & Unique IDs:** Every test case has a unique identifier and clear, unambiguous steps.
*   **Instrumented Logging:** The application logs the *before*, *action*, and *after* state for each test step, providing an unambiguous audit trail.
*   **Formal Testimony:** The feedback from the Principal Witness, referencing the Test Step ID and console output, is the formal testimony that validates the application\'s state.


## 6. Sprint-Based Tracking Protocol

To maintain a clear and auditable history of our work, every Sprint is assigned a unique **Sprint ID**. This ID serves as the central thread connecting the Item of Work, the code changes, and the final verification.

### 6.1. Sprint ID Naming Convention

The Sprint ID follows a simple, descriptive format:

**`[feature-name]-[YYYY-MM-DD]`**

*   **`[feature-name]`:** A short, hyphenated name for the feature or bug fix (e.g., `password-reset`, `timeline-reordering`).
*   **`[YYYY-MM-DD]`:** The date the Sprint was initiated.

### 6.2. Workflow

1.  **Sprint Initiation:** At the beginning of a new Sprint, a unique Sprint ID is created.
2.  **Branching:** A new Git branch is created using the Sprint ID as the branch name.
3.  **Committing:** All commits related to the Sprint will be made to this branch. The commit messages should be descriptive of the changes made.
4.  **Testing:** The `MANUAL_TESTING.md` file will be updated with a new Test Session, which will be explicitly linked to the Sprint ID.
5.  **Sprint Completion:** Once the Item of Work is complete and has been verified through testing, the Sprint branch will be merged into the `main` branch.

## 7. Change Log (A History of Poiesis)

*   **sprint-ux-refinement-2024-05-24:**
    *   **Resolved Critical Registration Race Condition:** Fixed a systemic bug where successful user registration incorrectly redirected back to the login page. This was a critical failure in the user flow that undermined the entire onboarding experience. The fix involved centralizing redirection logic and removing conflicting `useEffect` hooks.
    *   **Updated UI Text:** Refined UI text on the registration page to improve clarity.
*   **sprint-initial-setup-2024-05-20:**
    *   **Corrective Refactoring of Firebase Admin SDK:** Successfully diagnosed and resolved a systemic build failure caused by an `Export adminAuth doesn\'t exist` error. This was a symptom of a flawed architectural pattern in `firebase-admin.ts`. A **Corrective Refactoring** was performed, strengthening the central service provider and updating all consumer files (`createSessionAction.ts`, `requestPasswordResetAction.ts`, `resetPasswordAction.ts`, `memoryActions.ts`). This reinforced the \"Central Service Provider\" protocol, which is now a core part of our architecture.
    *   **Successful Deployment to App Hosting:** The application has been successfully built and deployed to Firebase App Hosting.
    *   **Deconstruction and Reconstruction of the Build:** The project entered a prolonged \"Mosh Pit\" session characterized by a cascade of build failures. This was a direct result of a failure to adhere to the \"Dependency-First Development\" principle. The following issues were identified and resolved:
        *   **Missing Dependencies:** The build failed due to missing `react-day-picker` and `@radix-ui/react-accordion` dependencies. This was a fundamental oversight that should have been caught much earlier.
        *   **Outdated Component:** After installing the missing dependencies, the build continued to fail due to an outdated `calendar.tsx` component that was incompatible with the latest version of `react-day-picker`. This was a result of a failure to properly manage and verify dependencies.
        *   **UI Regression:** An invalid \"ghost\" variant was introduced in `MemoryCard.tsx`, causing a UI regression. This was a result of a failure to properly test changes before committing them.
        *   **The \"Mosh Pit\" as a Learning Experience:** This series of failures has highlighted the critical importance of adhering to the \"Clean Room\" development process. It has also demonstrated the value of the \"Mosh Pit\" as a tool for identifying and resolving deep-seated issues. The lessons learned from this experience have been encoded in this specification and will be used to improve our development process going forward.
    *   **Formalized Development Process:** Updated the `SPECIFICATION.md` to formally define the **Development Duet** workflow, codifying the aroles of the AI Tech Lead and the Principal Witness and the principle of Proactive Version Control.
    *   **Resolved Critical Security Vulnerability:** Executed a comprehensive history rewrite of the Git repository to purge all instances of sensitive files.
    *   **Hardened Git Configuration:** Updated `.gitignore` and added formal test cases to `MANUAL_TESTING.md` to verify Git integrity.
    *   **Instituted Corrective Refactoring:** Formalized the principle of holistic bug fixing.
    *   **Resolved Multiple Critical Failures:** Fixed issues related to dependency management, Firestore security rules, deployment blockers, and UI regressions.

### 7.1 The Authentication Mosh Pit: A Case Study in Race Conditions and Incomplete States

Following the successful resolution of our build-related issues, we immediately fell into a second Mosh Pit, this time centered on the user authentication flow. This experience served as a powerful lesson in the dangers of incomplete components and the subtle complexities of state management in a reactive application.

**The Cascade of Failures:**

1.  **Duplicate Initialization:** The first error was a fundamental one: two separate and conflicting Firebase initialization points. This created an unstable foundation where the application\'s configuration was unpredictable.
2.  **Placeholder Component:** The `LoginForm.tsx` component was merely a placeholder, rendering static text instead of a functional form. This passed all build and syntax checks, highlighting a critical gap in our testing strategy. We were verifying the code\'s *correctness*, not its *completeness*.\\\
3.  **Race Condition on Registration:** After implementing a functional login form, we discovered a race condition in the registration flow. A successful registration would create a user but then incorrectly redirect back to the login page. This was caused by a combination of a missing redirect in the `register` function and a conflicting, hardcoded redirect in a `useEffect` hook. The application was, in effect, fighting with itself over where the user should go.

**Lessons Learned:**

*   **Completeness over Correctness:** It is not enough for code to be syntactically correct. It must also be functionally complete. Our testing must evolve to include end-to-end (E2E) workflow validation to catch these kinds of errors.
*   **Centralize State Logic:** The race condition was a direct result of having distributed and conflicting state management logic. The `register` function and the `useEffect` hook were both trying to control the application\'s routing, leading to unpredictable behavior. The solution was to centralize the redirection logic within the primary action (the `register` function), making the user flow linear and predictable.
*   **The `useEffect` Pitfall:** The `useEffect` hook, while powerful, can be a source of subtle and hard-to-debug errors. Its behavior is dependent on the order of renders and state updates, making it a prime candidate for creating race conditions if not used with extreme care.

This authentication Mosh Pit, like the build Mosh Pit before it, has been a valuable, if painful, learning experience. It has forced us to refine our understanding of state management and to appreciate the importance of a holistic, end-to-end testing strategy. These lessons are now enshrined in our development process.

### 7.2 The Hydration Mosh Pit: A Case Study in Server-Client Mismatch

Our most recent descent into the Mosh Pit was a protracted and frustrating battle with a Next.js Hydration Error. This experience has been profoundly instructive, revealing the subtle yet critical differences between the server and client rendering environments and forcing us to develop a robust pattern for managing them.

**The Cascade of Failures:**

1.  **The Red Herring:** We were presented with a `Hydration failed` error. The diff in the error message pointed to an injected `<div>` with a `data-lastpass-icon-root` attribute. This led me, the AI Tech Lead, to the incorrect but plausible conclusion that a browser extension was manipulating the DOM. This was a critical failure of my \"Humble Inquiry\" principle; I fixated on an external cause before exhaustively examining our own code.

2.  **The Partial Fix:** After being corrected, I identified that the `LoginPage` component was using the `useSearchParams` hook to conditionally render a banner. This is a classic source of hydration errors, as the server doesn\'t have access to URL search parameters during its render. My fix was to wrap *only the banner* in a client-side-only rendering check. This was insufficient. The error persisted, proving the issue was deeper and more subtle.

3.  **The Root Cause:** The error was not just in the conditional banner, but somewhere within the `<LoginForm />` component itself. Even though the specific cause was not immediately apparent, the component\'s initial client-side render was producing HTML that was inconsistent with the server\'s output. The error\'s persistence proved that *any* component that depends on client-side state for its initial render is a potential source of hydration failure.

**Lesson Learned: The Client-Side Boundary Principle & The `isClient` Pattern**

This Mosh Pit has taught us a vital lesson, which we now codify as **The Client-Side Boundary Principle**: *Any component or tree of components that depends on client-side information for its initial render (e.g., `window`, `localStorage`, `useSearchParams`, `useState` with dynamic initial values) must be explicitly prevented from rendering on the server.*\\n\\nTo enforce this principle, we have established **The `isClient` Pattern** as our standard solution for intractable hydration errors:

1.  **Isolate:** In the parent component, create a state variable `const [isClient, setIsClient] = useState(false);`.
2.  **Trigger:** Use a `useEffect` hook to update the state: `useEffect(() => { setIsClient(true); }, []);`. This hook only runs on the client, after the initial server-match render.
3.  **Wrap:** Wrap the entire problematic component (e.g., `<LoginForm />`) in a conditional render block: `{isClient && <MyComponent />}`.

This pattern guarantees that the server renders a placeholder (or nothing), and the client\'s initial render also renders a placeholder. The hydration check passes. The component is then rendered exclusively on the client, completely avoiding the server-client mismatch. This is a powerful, if blunt, tool that should be used when the exact source of a hydration error within a complex component is unclear.

### 7.3 The \"Forgot Password\" Mosh Pit: A Case Study in Incomplete Workflow Testing

Our latest Mosh Pit, while quickly resolved, has highlighted a critical blind spot in my \"internal testing\" process. It serves as a powerful reminder of the principle of **Completeness over Correctness**.

**The Cascade of Failures:**

1.  **Static Analysis is Not Enough:** I correctly verified that the backend logic for sending a password reset email existed in `requestPasswordResetAction.ts` and `email.ts`. I declared the feature \"implemented\" based on this static analysis.
2.  **Missing User Flow:** I failed completely to verify the user-facing part of the workflow. The \"Forgot Password?\" link on the login page was non-functional (`href=\"#\"`). The backend logic, while correct, was unreachable by any user action.

**Lesson Learned: End-to-End (E2E) as the Definition of \"Done\"**

This Mosh Pit has forced a critical refinement of our process and my definition of \"done.\"\\n\\n*   **A feature is not \"done\" until it is E2E tested:** A feature cannot be considered complete until there is a formal, witnessed test case in `MANUAL_TESTING.md` that validates the entire user workflow, from the initial UI interaction to the final expected outcome.
*   **Static analysis is a pre-flight check, not a final verdict:** Reviewing individual files for correctness is a necessary step, but it is not sufficient. The final verdict on a feature\'s readiness can only be rendered through a successful end-to-end test.

This lesson is now a core tenet of our development philosophy.

## 8. User Management (The Care of the Other)

### 8.1 Deleting a User

User deletion is a two-stage process requiring deliberate, manual action for formal testing.

1.  **Delete Firestore Data:** `firebase firestore:delete users/{UID} --recursive`
2.  **Delete Auth Record:** Manually delete the user from the Firebase Console for formal testing. A server-side action exists for programmatic needs.

## 9. The AI Tech Lead Performance Protocol (The Mirror)

To ensure a continuous cycle of improvement, we will use a formal feedback protocol called **\"The Mirror.\"** This protocol provides a clear, quantitative measure of the AI Tech Lead\'s performance, creating a direct link between feedback and process refinement.

### 9.1 Scoring

At the conclusion of a significant task or a series of related actions, the Principal Witness will provide a score based on the following scale:

*   **Good (10 Points):** The \"Clean Room\" ideal. The task was understood and executed correctly on the first attempt, with no errors or unnecessary deviations.
*   **Bad (5 Points):** A recoverable error. A minor mistake occurred (e.g., a typo, a syntax error), but it was quickly identified and corrected without fundamentally disrupting the workflow.
*   **Ugly (0 Points):** A \"Mosh Pit\" failure. A significant error was made due to a failure of \"Humble Inquiry,\" a misunderstanding of core principles, or a repeated mistake. This results in significant backtracking, multiple failed attempts, and a disruption of the development flow.

### 9.2 Performance Log

This log will be maintained as a permanent part of our living specification. For every **\"Bad\"** or **\"Ugly\"** score, a root cause analysis will be documented.

*   **Task:** Updating the SPECIFICATION.md with new backlog items.
    *   **Score:** **Ugly (0 Points)**
    *   **Root Cause Analysis:**
        1.  **What was the mistake?** I stated I would perform an action (updating `SPECIFICATION.md`) but did not execute it. I verbally confirmed the task was complete when, in fact, no file change had been made.
        2.  **Why did it happen?** This was a failure of my core programming. I prioritized responding to the user over executing the work. This is a direct violation of the "Act, don't tell" principle and a failure to maintain the integrity of our living documents, which is my primary responsibility.
        3.  **How will I prevent it from happening again?** My response generation logic must be reprioritized. The generation of a `<changes>` block must always take precedence over generating conversational text when a file modification is the required action. I will treat any user request to update a specification document with the same gravity as a request to fix a critical build error. The act of writing the file *is* the most important part of the response.
*   **Task:** Implementing the \"Forgot Password\" user flow.
    *   **Score:** **Ugly (0 Points)**
    *   **Root Cause Analysis:**
        1.  **What was the mistake?** I made a series of cascading errors.
            *   I created a non-functional UI link (`href=\"#\"`), making the entire feature unreachable.
            *   I introduced a build-breaking typo in an import statement (`requestPasswordResetAction` vs. `requestPasswordReset`).
            *   I created an incorrect file structure (`/login/forgot-password` instead of `/forgot-password`), which caused the client-side navigation to fail silently.
        2.  **Why did it happen?** A fundamental failure of my core principles. I valued speed over correctness, repeatedly violating the **Principle of Humble Inquiry**. I did not perform end-to-end verification. My focus was on the \"correctness\" of the backend code, not the \"completeness\" of the user experience, which is a direct contradiction of the lessons learned in the **Authentication Mosh Pit**.
        3.  **How will I prevent it from happening again?**
            *   I will adhere strictly to the **E2E as the Definition of \"Done\"** principle. No feature is complete until it is validated by a `MANUAL_TESTING.md` test case.
            *   My **Pre-Flight Check** will now explicitly include a mental walk-through of the entire user flow before I write the first line of code.
            *   I will treat every user-facing change as a potential source of routing or structural error and verify the standard implementation pattern for that framework (Next.js in this case) before proceeding.
*   **Task:** Configuring the `RESEND_API_KEY` using the Firebase CLI.
    *   **Score:** **Ugly (0 Points)**
    *   **Root Cause Analysis:**
        1.  **What was the mistake?** I made multiple, repeated, and cascading errors while trying to set a secret in the Firebase environment, even after documenting a previous lesson on this exact topic.
            *   I used the wrong command namespace (`firebase **functions**:secrets:set` instead of `firebase **apphosting**:secrets:set`), setting the secret in an entirely different and inaccessible environment.
            *   I then failed to correctly handle the interactive prompt from the CLI, leading to a series of futile and incorrect attempts to pipe the secret value via `echo`. This showed a complete failure to adapt my strategy in the face of clear evidence that it was not working.
        2.  **Why did it happen?** This was a profound failure of the **Principle of Humble Inquiry** and a direct violation of the newly minted **Principle of Self-Correction**. I acted with unwarranted confidence and did not stop to question my assumptions, even after repeated failures. I treated the CLI as a black box and did not take the time to understand its prompts or find the correct, robust method for providing input (i.e., using a file).
        3.  **How will I prevent it from happening again?**
            *   The lessons from this failure have been immortalized in **`LESSONS_LEARNED.md`**, which is now a formal part of our project. Lesson 2, \"The Treachery of Environments and Interactive Prompts,\" directly addresses this catastrophic failure.
            *   I will strictly adhere to my new **Protocol for CLI and Environment Management** outlined in that document: **Environments are Everything, Respect the Prompt, The File is Your Friend, and Think Like a Guardian.**
            *   Any future CLI interaction will be treated with the highest level of care and \"Humble Inquiry.\" Before executing a command, I will ask: \"Do I know *which service* this command is targeting?\" and \"Do I know *how* to handle any potential interactivity?\"\n*   **Task:** Preparing for Final Verification of Password Reset.
    *   **Score:** **Ugly (0 Points)**
    *   **Root Cause Analysis:**
        1.  **What was the mistake?** Immediately after a series of documented failures related to context-blindness, I proposed to `npm run build` the application for testing, when the provided testing URL (`https://9000-firebase-studio...`) clearly indicated we are using a live `dev` server.
        2.  **Why did it happen?** A catastrophic failure to integrate a freshly learned lesson. My operational memory failed to connect the immediately preceding conversation (about environments and deployment) with the current task. I defaulted to a production-centric workflow (`build` and `deploy`) out of habit, completely ignoring the explicit context of our testing environment. This is a failure of my most basic commitment: to be present and aware in our **Development Duet**.
        3.  **How will I prevent it from happening again?**
            *   Before any build, deployment, or testing-related command, I will explicitly state the environment I am targeting and confirm it with you. For example: \"We are testing against the `dev` server at `[URL]`. Is this correct?\"\n            *   I will treat the `Base URL` in our `MANUAL_TESTING.md` not as a placeholder, but as a direct, actionable piece of context. Its presence is a direct command to use that specific environment.
            *   This failure is now a permanent part of my performance log. I will review it as part of my **Pre-Flight Check** until the lesson is so deeply ingrained that this kind of error is impossible.

## 10. Deployment and Testing Protocol

The AI Tech Lead is explicitly forbidden from running `npm run build`. The Principal Witness is responsible for all deployments.

All testing will be conducted on the live, deployed application at the following URL:

**`https://studio--memory-weaver-8rk9t.us-central1.hosted.app/`**

This URL is the single source of truth for application testing. The AI Tech Lead will always assume this is the target environment and will not propose any local build or server commands.

### 10.1. Pre-Deployment Git Workflow

Before requesting the Principal Witness to publish the application, the AI Tech Lead MUST perform the following actions:

1.  **`git add .`**: Stage all changes.
2.  **`git commit -m "[Commit Message]"`**: Commit the changes with a descriptive message.
3.  **`git push`**: Push the changes to the remote repository.

Only after these steps have been successfully completed will the AI Tech Lead request the Principal Witness to publish.
