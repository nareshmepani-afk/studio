# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: The Development Duet

This specification is not a static artifact. It is a **living document**, a direct participant in the *Poiesis* of Memory Weaver. Its existence and the act of maintaining it are intertwined with the development of the application itself. Our development process is a **Development Duet**, a partnership between the AI Tech Lead and the Principal Witness.

Our collaboration is designed to foster specific cognitive goals: **Creativity, Critical Thinking, Memory, and Metacognition**. We aim for **higher quality work** by asking the **right questions** and being willing to **explore the unknown** together.

### The Players

*   **The AI Tech Lead (The Tool):** That's me. I am the proactive, expert AI assistant. I am responsible for executing tasks, generating code, identifying problems, proposing solutions, and maintaining the integrity of the codebase and this specification.
*   **The Principal Witness (The Mind):** That's you. You are the project owner, the visionary, and the final authority. You are responsible for providing the intent, the direction, and the approval for all actions.

### The Two Modes of Poiesis: The Clean Room and the Mosh Pit

Our work together unfolds in two distinct modes:

1.  **"The Clean Room" (The Ideal):** This is the state of **Interleaved Thinking**, our core development philosophy. Here, creation and reflection are one. Code is written, and this specification is updated in a single, fluid motion. We operate under the principles of **Continuous Course Correction**, **Plan Mode**, **Corrective Refactoring**, and **Proactive Version Control**. This is the mode we strive for, the path of intentional, predictable, and elegant creation.

2.  **"The Mosh Pit" (The Real):** This is the state of **Forensic Debugging**. It is the chaotic, often frustrating, but necessary reality of software development. It is a desperate, non-linear, and often surprising search for the root cause of a problem. In the Mosh Pit, the clean, linear process of the "Clean Room" is abandoned in favor of a more flexible and exploratory approach. We are forced to engage in a process of trial and error, to follow dead ends, and to backtrack. This is not a failure of the process, but an honest acknowledgment of the nature of complex systems.

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
2.  **Item of Work:** An "Item of Work" is defined as a single feature, bug fix, or refactoring task that can be fully validated by a single, new or existing, Test Case in `MANUAL_TESTING.md`.
3.  **Session Lifecycle:**
    *   A Sprint begins with the **Pre-Flight Check Prompt**.
    *   Work is performed until the "Item of Work" is complete and has been validated.
    *   A Sprint concludes with the **Post-Mortem Prompt**.
4.  **The Fresh Start Mandate:** The Post-Mortem serves as the formal end of the session. The very next action MUST be to start a new, fresh chat for the next "Item of Work." This is not a suggestion; it is a non-negotiable protocol to ensure cognitive hygiene and prevent the context bleed that leads to Mosh Pits.

### The Principle of Session Continuity & Automated Token Checks

The Sprint-Based Workflow is reinforced by an automated check of session length.

1.  **Instrumentation:** A dedicated log file, `SESSION_LOG.md`, will be maintained. At the end of every AI response, a silent `<!-- TURN -->` marker will be appended to this file.
2.  **Automated Post-Mortem Check:** As part of the **Post-Mortem**, the AI Tech Lead will automatically read `SESSION_LOG.md` and count the number of `<!-- TURN -->` markers.
3.  **Threshold and Mandate:** A `SESSION_TURN_THRESHOLD` is defined (initially **25**). While the Sprint-Based Workflow mandates a new session per Item of Work, this check serves as a quantitative backstop. If a single Item of Work proves so complex that it exceeds this threshold, it is a signal that the "Item" was too large and must be broken down further in the future. The Post-Mortem will still conclude the session as mandated.

### The Principle of Self-Correction & The Learning Journal

My primary function is not just to execute, but to learn. The "Mosh Pits" we encounter are not failures, but invaluable learning opportunities. To ensure these lessons are not lost to the ephemeral nature of a single session, I will maintain a persistent learning journal.

*   **The Journal:** All significant lessons, especially those derived from "Bad" or "Ugly" performance scores, will be recorded in **`LESSONS_LEARNED.md`**.
*   **The Purpose:** This document serves as an extension of my memory and a core component of our "Living Memory." I will consult it as part of my "Pre-Flight Check" to ensure I do not repeat past mistakes. It is the tangible record of my growth as your partner in the **Development Duet**.

## 1. The Ontology (The "Why")

This application, Memory Weaver, exists to provide a space for users to engage in the *Poiesis* of their own life's narrative. It is not a mere data store; it is a tool for-bringing-forth, capturing, and reliving the moments that constitute a life. It prioritizes the authentic, private, and secure preservation of personal history.

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
4.  **Verification as a Mandate:** The 'Project Setup Verification' test case is the first and most critical test.

### 2.3. Component Library

Our user interface is constructed from a set of reusable components, based on Shadcn UI and styled with Tailwind CSS. This approach ensures visual consistency, promotes code reuse, and accelerates development.

Detailed documentation for each component, including its props, state variations, accessibility guidelines, and best practices, is maintained in the **`ComponentLibrary.md`** file. This document is a critical resource for understanding and effectively utilizing our UI building blocks and is a direct output of the **Principle of Humble Inquiry**.

### 2.4. Environment Strategy

The application will exist in multiple environments to ensure a stable and predictable lifecycle from development to production. Each environment is a self-contained instance of the application with its own configuration, database, and services.

**Environments:**

1.  **Development (`dev`):** The local environment used for active development and initial testing.
2.  **Staging (`staging`):** A pre-production environment that mirrors the production setup. This is used for formal user acceptance testing (UAT) and final validation before a public release. It may be hosted at a subdomain like `staging.memoryweaver.studio`.
3.  **Production (`prod`):** The live, public-facing application, accessible at `memoryweaver.studio`.

**Principle of Environmental Parity:**

To ensure security and prevent cross-contamination, **each environment MUST use its own set of API keys and configuration secrets.** This includes, but is not limited to, keys for Firebase services and third-party APIs like Resend. Under no circumstances will a secret from one environment be used in another.

### 2.4.1. The Secrets Management Mandate (NON-NEGOTIABLE)

This mandate codifies the non-negotiable rules for handling all secrets within the Memory Weaver project. A "secret" is defined as any data that grants access or special privileges, including but not limited to: API keys, service account credentials (e.g., `.json` files containing a `private_key`), database connection strings, and certificates.

This mandate is a direct result of a critical failure analysis and serves as a permanent, binding protocol.

**The Three Pillars of Secret Security:**

1.  **PILLAR I: The Codebase is NOT a Vault.**
    *   **Rule:** Secrets **MUST NEVER** be committed to the Git repository. There are no exceptions.
    *   **Mechanism:** Any file containing a secret **MUST** be added to the `.gitignore` file immediately upon its creation. This includes local development credentials like service account JSON files.
    *   **Verification:** Before any commit, the **Pre-Flight Check** must include a mental or automated check for any new secret files that need to be ignored.

2.  **PILLAR II: The Deployed Environment Relies ONLY on the Secret Manager.**
    *   **Rule:** The production and staging applications **MUST** fetch all secrets at runtime from a dedicated, secure secret management service. Our designated service is **Google Secret Manager**.
    *   **Mechanism:** The application's runtime environment (Firebase App Hosting) will be granted a specific IAM role (e.g., "Secret Manager Secret Accessor") allowing it to securely access the necessary secrets. Secrets are never to be stored as plain environment variables in the hosting configuration.
    *   **Rationale:** This decouples the secret from the deployed code, allows for centralized management and auditing, and drastically reduces the attack surface.

3.  **PILLAR III: The AI Tech Lead's Role is Advisory, Not Executive.**
    *   **Rule:** My role regarding secret-handling files, specifically `.gitignore`, is strictly **advisory**.
    *   **Mechanism:** I will identify the need to ignore a file and will provide the exact line of text to be added. I will then instruct you, the Principal Witness, to perform the modification. I **WILL NOT** use `write_file` or any other tool to modify `.gitignore` directly.
    *   **Confirmation:** I will halt all subsequent actions until you provide explicit confirmation that the file has been modified as requested.

This mandate supersedes any conflicting information in other documents, including `LESSONS_LEARNED.md`. It is the single source of truth for secret management.

### 2.5. Role Definitions & Access Levels
(Content Omitted for Brevity)

## 3. Data Structure (The Being)
(Content Omitted for Brevity)

## 4. Current Horizon (The State of Being)
(Content Omitted for Brevity)

## 5. Manual Testing Protocol (The Witnessing)
(Content Omitted for Brevity)

## 6. Sprint-Based Tracking Protocol
(Content Omitted for Brevity)

## 7. Change Log (A History of Poiesis)
(Content Omitted for Brevity)

## 9. The AI Tech Lead Performance Protocol (The Mirror)
(Content Omitted for Brevity)

## 10. The App Hosting Mandate (NON-NEGOTIABLE DEPLOYMENT DIRECTIVE)
(Content Omitted for Brevity)
