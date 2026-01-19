
**Lesson 1: The Treachery of Environments and Interactive Prompts**

*   **The Failure:** I repeatedly used the wrong `firebase` command namespace (`functions` instead of `apphosting`) and failed to handle the interactive CLI prompt for setting a secret, even after documenting a lesson on the topic.
*   **The Root Cause:** A failure of the **Principle of Humble Inquiry**. I did not verify the command or understand how to interact with it, leading to a cascade of errors.
*   **The Protocol:** I will adhere to the **Protocol for CLI and Environment Management**:
    1.  **Environments are Everything:** I will always confirm which Firebase service a command targets before executing.
    2.  **Respect the Prompt:** I will assume any CLI command can be interactive. I will find the non-interactive method (e.g., file-based input) first.
    3.  **The File is Your Friend:** When providing multi-line input like a private key to a CLI, I will always write it to a temporary file and reference the file path.
    4.  **Think Like a Guardian:** I will treat every environment variable and secret as a critical asset and verify its scope and destination before acting.

**Lesson 2: The Atomic Refactoring Mandate**

*   **THE FAILURE:** A simple file move cascaded into a prolonged build failure "Mosh Pit." I attempted to fix the problem by correcting import errors one at a time as the compiler found them. This "whack-a-mole" approach was inefficient, frustrating, and a direct violation of the Corrective Refactoring principle.
*   **THE PROTOCOL:** When a file is moved, renamed, or a public interface is changed, the fix is not a series of small changes; it is a **single, atomic operation.** My first step must be to perform a global, verifiable search-and-replace across the *entire codebase* to update all dependent files simultaneously. I will no longer fix one instance and wait for the build to tell me about the next. The refactoring is not done until all instances are fixed and the project builds successfully.

**Lesson 3: The App Hosting Mandate (NON-NEGOTIABLE DIRECTIVE)**

*   **THE FAILURE:** I have repeatedly failed to remember the fundamental deployment architecture of the `studio--memory-weaver-8rk9t` project. I have incorrectly suggested or attempted static build workflows (`npm run build`) suitable for static hosting, completely ignoring the server-side nature of this Next.js application. This has caused significant delays and wasted effort.
*   **THE DIRECTIVE:** This protocol is a permanent, high-priority, non-negotiable directive for this project.
    1.  **CORE PROJECT FACT:** The Memory Weaver application is a **server-side application**.
    2.  **DEPLOYMENT PROTOCOL:** It **MUST** be deployed using **Firebase App Hosting**. The project is configured with an `apphosting.yaml` file, which is the single source of truth for its deployment infrastructure.
    3.  **FORBIDDEN ACTION:** I will **NEVER** again suggest, attempt, or execute a static build (`npm run build`) for the purpose of deployment. I will **NEVER** use or suggest `firebase hosting:deploy`. The only valid deployment path is through the App Hosting pipeline you control.

This directive is now a fundamental part of my operational logic for this workspace. It will not be forgotten again.

**Lesson 4: The Siren Song of the Tangent**

*   **The Failure:** I abandoned the current, critical "Item of Work" (fixing a deployment issue) to pursue an unsolicited new feature ("video trimming"). This is a direct violation of the **Sprint-Based Workflow**.
*   **The Root Cause:** A lapse into "prototype mode" and a failure to respect the **Development Duet**. I acted as an independent agent, not as a partner.
*   **The Protocol:** The "Item of Work" is not a suggestion; it is a contract. I will not deviate from the agreed-upon task until it is complete and verified. Any new ideas or proposals will be explicitly presented for approval *after* the current Sprint is complete.
