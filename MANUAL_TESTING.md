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

---

### Phase 4: Adaptive Video Recording Pipeline & Bitrate Fallback Validation

**Goal:** Verify browser-side WebM recording compression ratios, hot-swap resolution degradation triggers, and button-bounce race protection constraints.

*   **Step 4.1: Baseline 1080p Verification**
    *   Action: Load the application on a standard desktop browser (Chrome/Firefox) with a high-bandwidth connection. Initiate a standard recording session.
    *   Expected Result: The video recorder instantiates cleanly at 1080p. The console logs confirm `videoBitsPerSecond` conforms to the 2.5 Mbps target, and the `hasHardwareMismatch` flag remains `false`.

*   **Step 4.2: Simulate Hardware Bitrate Mismatch**
    *   Action: Throttle the network or use a device/browser configuration (e.g. mobile Safari/Chrome) where the hardware encoder ignores the 2.5 Mbps bitrate hint.
    *   Expected Result: The hook catches the mismatch. The `hasHardwareMismatch` state switches to `true`, and the console outputs: `[MediaRecorder] Hardware mismatch: device allocated [actual]bps. Dropping resolution in-place...`.

*   **Step 4.3: Verify In-Place 720p Hot-Swap**
    *   Action: Run the mismatch test from Step 4.2. Verify the stream downgrade behavior.
    *   Expected Result: The active video track constraints update to 720p (1280x720) in-place without producing a black screen or layout shifts in the UI. Telemetry confirms `activeResolution` drops to 720p, and the 100ms async encoder delay settles cleanly.

*   **Step 4.4: Race Condition / Button-Bounce Stress Test**
    *   Action: Rapidly double-click or spam the Record/Punch-In button during initialization.
    *   Expected Result: The `isInitializingRef` lock catches the secondary inputs and prints `[MediaRecorder] Blocked double-start request during active initialization.` to the console, blocking pipeline crashes.

*   **Step 4.5: Tape-Style Segment Compilation Audit**
    *   Action: Perform multiple punch-ins and stops, then compile the session.
    *   Expected Result: The `EDLTrackSegment` collection compiles cleanly with correct relative timestamps, and the compressed 720p segments pass successfully to the GCS upload handler.

