# Build Resolution & Deployment Guide

## Current Status
The rollout is failing with a generic "Something went wrong" message. This usually indicates an issue at the Build or Infrastructure phase.

## How to Find the REAL Logs
The Firebase Console summary is often insufficient. To see the actual failure:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Search for **Cloud Build**.
3. Look for the most recent build related to your App Hosting backend (`studio`).
4. Click on the build ID to see the full execution log. This will show exactly where `npm run build` or the setup failed.

## Common Rollout Failures
1. **Secret Access**: The App Hosting service account (`firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com`) lacks the `Secret Manager Secret Accessor` role.
2. **Module Collision**: The `workspace/` directory in the project root is colliding with the build container's internal paths.
3. **Missing Dependencies**: Ensure all libraries used in server actions (like `firebase-admin`) are in `dependencies`, not `devDependencies`.

## Resolution Steps
1. **Run Diagnostics**: Execute `bash scripts/check_secret_permissions.sh` in your terminal.
2. **Clean Rollout**: Use the corrected command:
   ```bash
   firebase apphosting:rollouts:create studio --project memory-weaver-8rk9t
   ```
