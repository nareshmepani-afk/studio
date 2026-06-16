# Living Business Manifest

*This document is automatically compiled at build-time from the application's central business rules config ([businessRules.ts](../src/config/businessRules.ts)). Do not modify this file directly.*

## Subscription Tiers

| Tier Name | Price (GBP) | Price (USD) | Locked Features | Additional Config |
| :--- | :---: | :---: | :--- | :--- |
| **Sandbox Preview** (`sandbox`) | £0.00 | $0.00 | `CLOUD_STORAGE`, `FIREBASE_WRITE`, `CLOUD_STITCHING` | Demo Script: `p_einstein` |
| **Director Pass** (`director`) | £12.99 | $14.99 | None | Promotional Trial: 6 months |

### 🔒 USER LIFECYCLE ACCESS STATE MATRIX

| Lifecycle Status | Workspace Reading Data | Firestore Writing Rights | Cloud Stitching Calls | Directorial Dialogue UI Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `paid_host_pass_active` | 🟢 Unrestricted | 🟢 Enabled | 🟢 Enabled | Native Studio Cockpit |
| `paid_host_pass_expired` | 🟢 Unrestricted (Archive) | 🔴 Blocked | 🔴 Blocked | Triggers 'Renew Pass' Layout |
| `guest_sandbox` | 🟡 Demo Template Only | 🔴 Blocked (Local Only) | 🔴 Blocked | Triggers 'Claim Free Pass' Layout |

## Support Playbooks

### Playbook: MW_66_GUEST_INTERCEPT

**Context:**
> Guest encounters DirectorialUpsellDialog.tsx due to database write blocks.

**Resolution Steps:**
1. Instruct user to keep current browser tab open to preserve local WebM Blobs in IndexedDB.
2. Direct user to execute the account creation flow inside the Radix container.
3. Pipeline will automatically migrate localforage cache to active Firestore collection post-auth.

### Playbook: MW_69_DIAGNOSTIC_SHORTCUT

**Context:**
> User requires rapid remote debug tracing assistance or encounters studio glitches. Outbound delivery is dispatched via Resend. Inbound support mail is managed by Cloudflare Email Routing on memoryweaver.studio forwarding to the active destination inbox, which is connected to Plane.so for automated ticket ingestion.

**Resolution Steps:**
1. Verify Resend is configured with a valid RESEND_API_KEY and verified domain sender addresses (support@ and studio@).
2. Verify Cloudflare Email Routing is enabled with support@ forwarding rule active.
3. Ensure the destination inbox (or direct alias) is configured to ingest incoming tickets into the Plane.so project backlog.
4. Instruct user to press Ctrl + / (or Cmd + / on Mac) anywhere in the workspace to trigger the bug report overlay.
5. Extract the 'traceId' parameter string from the received Plane.so issue ticket description and query BigQuery to view the historical event timeline.

### Playbook: MW_70_COMPLIMENTARY_PASS

**Context:**
> User complimentary 6-month pass claiming and expiration flow handling.

**Resolution Steps:**
1. A user is only allowed to claim the complimentary 6-month Director Pass once in their lifetime.
2. Verify double-claim prevention by checking if 'directorPassActivationDate' is populated in the user's Firestore document.
3. Calculate active vs expired status dynamically using a 6-month date delta offset from the activation date.
4. In case of expiration, block features and show the upgrade prompt rather than allowing a re-claim.

### Playbook: MW_18_HEADLESS_TESTING_BYPASS

**Context:**
> Headless browser tests fail to initialize media devices or fail on Firebase authentication CAPTCHAs.

**Resolution Steps:**
1. Launch Chromium in Playwright (test-playwright-run.js) with flags '--use-fake-ui-for-media-stream' and '--use-fake-device-for-media-stream' to bypass webcam/mic permission dialogs.
2. Use URL query parameters '?mode=guest&sessionId=TEST_E2E_SESSION' to bypass Firebase authentication and ReCAPTCHA challenges.
3. Locate static assets locally under public/ffmpeg/ instead of relying on external unpkg.com CDN paths to support fully-offline headless execution.

### Playbook: MW_19_ADMIN_ROUTING

**Context:**
> Accessing the Admin Portal (admin.memoryweaver.studio) redirects or rewrites to the secure /admin app layout without exposing administrative routes on the primary studio subdomain.

**Resolution Steps:**
1. Ensure Next.js edge middleware (src/middleware.ts) intercepts requests with host starting with admin.
2. Ensure infinite loop guard is active: only rewrite if pathname does not start with /admin.
3. Ensure session cookies ('session' and 'x-trace-id' header) are preserved during rewriting to maintain authentication context.
4. To verify locally, use host header spoofing or local hosts file mapping to route admin.localhost to local port.

