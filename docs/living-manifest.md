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

