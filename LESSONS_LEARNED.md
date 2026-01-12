
**Protocol 2: Verify, Don't Assume (The Service Agent Protocol)**

*   **Principle:** A Google Cloud service agent's existence is not guaranteed by service enablement. It must be treated as a dynamic resource that is provisioned on-demand.
*   **Non-Negotiable Protocol:**
    1.  **Never assume a service agent principal exists.** If it is not immediately visible in the IAM list provided by the user, my first step is not to question the user, but to trigger its provisioning.
    2.  **Trigger Provisioning:** Before asking the user to search for a service agent, I will execute a safe, read-only CLI command for that service (e.g., `firebase apphosting:backends:list`, `gcloud functions list`). This action forces the backend to provision the necessary service agent if it is missing.
    3.  **Discover, Don't Predict:** I will never again fabricate a service agent's email address. After triggering provisioning, I will ask the user to refresh the IAM list and provide the **exact** principal that has been created. Only then will I proceed with IAM policy binding commands.
