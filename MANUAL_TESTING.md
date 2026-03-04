# Test Plan: HOTFIX-06 - IAM Role and Secret Refresh

**Objective:** Resolve the "invalid authentication credentials" error by updating the service account's IAM roles and refreshing the `SERVICE_ACCOUNT_JSON` secret in Google Secret Manager.

**Pre-requisites:**
*   `gcloud` CLI is installed and authenticated with appropriate permissions to manage IAM and Secret Manager.
*   The service account email and the list of required secrets are known.

---

### Phase 1: Verification and Diagnosis

**Goal:** Confirm the current broken state and gather necessary information.

*   **Step 1.1: Identify the Service Account & Secrets**
    *   Action: Manually inspect the application configuration or deployment scripts to find the service account email and the names of the secrets it needs to access.
    *   Expected Result: A clear list of the service account and the secrets it requires.

*   **Step 1.2: Run the Verification Script (Pre-fix)**
    *   Action: Execute the `scripts/check_secret_permissions.sh` script with the identified service account and secrets.
    *   Expected Result: The script should fail, confirming that the service account lacks the necessary "Secret Manager Secret Accessor" role for one or more secrets. This reproduces the `AUTH FAILURE`.

---

### Phase 2: Remediation

**Goal:** Apply the necessary fixes to the IAM roles and the stored secret.

*   **Step 2.1: Grant Correct IAM Role**
    *   Action: Use the `gcloud` CLI to grant the "Secret Manager Secret Accessor" role to the service account for each required secret.
    *   Command:
        ```bash
        gcloud secrets add-iam-policy-binding [SECRET_NAME] \
            --member="serviceAccount:[SERVICE_ACCOUNT_EMAIL]" \
            --role="roles/secretmanager.secretAccessor"
        ```
    *   Expected Result: The IAM policy for each secret is updated successfully.

*   **Step 2.2: (If Necessary) Refresh the `SERVICE_ACCOUNT_JSON` Secret**
    *   Action: If the service account key itself is suspected to be expired or compromised, generate a new key and update the `SERVICE_ACCOUNT_JSON` secret in Secret Manager.
    *   Command:
        1.  `gcloud iam service-accounts keys create key.json --iam-account=[SERVICE_ACCOUNT_EMAIL]`
        2.  `gcloud secrets versions add [SECRET_NAME_FOR_KEY] --data-file=key.json`
        3.  `rm key.json`
    *   Expected Result: A new version of the secret is created in Secret Manager.

---

### Phase 3: Validation

**Goal:** Confirm that the fixes have resolved the authentication issue.

*   **Step 3.1: Run the Verification Script (Post-fix)**
    *   Action: Execute the `scripts/check_secret_permissions.sh` script again.
    *   Expected Result: The script should now pass, confirming that the service account has the required access to all specified secrets.

*   **Step 3.2: Application End-to-End Test**
    *   Action: Deploy and run the application in a test environment.
    *   Expected Result: The application starts and runs without any "invalid authentication credentials" errors. The features that depend on the secrets function correctly.
