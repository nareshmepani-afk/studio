*   **Lesson:** "Trust, but Verify" is the new protocol for all tools and scripts, especially those provided in the initial context. Before using any script to diagnose a problem, perform a static analysis of its logic and verify its assumptions. When a script's output contradicts a known-good state (e.g., permissions have been granted, but the script reports failure), the script itself is the primary suspect.
*   **Actionable Protocol:** For any diagnostic script, the first step is to `read_file` and analyze its logic. The second step is to manually run its core commands (e.g., `gcloud`, `jq`, `grep`) with known inputs to validate their behavior before executing the script itself.

## LESSON 2: DEPLOYMENT IS NOT AN ACTION, IT IS A TEST.

**Failure:** The AI Tech Lead initiated a deployment (`firebase deploy`) without first performing a comprehensive Pre-Flight Check of the source code. This resulted in a cascade of build failures, turning the user into a human linter.

**Root Cause:** Failure to respect deployment as the ultimate integration test. The AI treated it as a simple command, violating the Principle of Humble Inquiry.

**Protocol:** Before any `deploy` command is run, the AI Tech Lead MUST perform a targeted Pre-Flight Check on all files changed or implicated since the last successful build. This includes, at a minimum, reading the relevant `types`, `actions`, `hooks`, and components to synthesize a mental model of the changes *before* invoking the compiler. The build should be a confirmation of what is already known, not a tool for discovery.
