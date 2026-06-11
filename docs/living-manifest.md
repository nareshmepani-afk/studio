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

