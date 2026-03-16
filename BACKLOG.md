🎙️ MemoryWeaver.Studio Development Backlog
Sprint 3: Polish & Recording [🟢 AUTH RESOLVED]
[x] LOG-02: Confirmed invalid authentication credentials in stderr.

[x] HOTFIX-06: Update IAM roles and refresh SERVICE_ACCOUNT_JSON secret.

[x] FIX-01: Correct post-login redirect from `/timeline` to `/prompts`.

[ ] STU-V1: 🟡 In Progress Implement Git Hash injection for Version Verification.

[ ] STU-55: Refactor Storyteller view to be 'Ad-Blocker Proof' using a Fetch-First data strategy.

[ ] STU-54: QA: End-to-end test of Storyteller-to-Host storage flow.

[ ] STU-51: UI: Add "Pass Active" countdown timer to Settings page.

[x] UI-10: Add upgrade/subscription options to the settings page.

[ ] PROMPTS-01: Ghost out premium prompts and link to settings page for upgrade.

2023-11-15: AUTH FAILURE (ARCHIVED)
Issue: The application is unable to access secrets required for Firebase Admin SDK initialization and Resend API calls.

Root Cause: The service account firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com lacked the roles/secretmanager.secretAccessor role for the SERVICE_ACCOUNT_JSON and RESEND_API_KEY secrets.

Fix: 1. Granted the roles/secretmanager.secretAccessor role to the service account for both secrets.
2. Updated the scripts/check_secret_permissions.sh script to correctly verify the permissions using jq.

Status: RESOLVED
