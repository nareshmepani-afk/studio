# Build Resolution & Deployment Guide

## Current Status
The rollout is failing with "Something went wrong creating your App Hosting rollout." 
This usually happens **before** the build starts, during the API call to initialize the rollout.

## How to find the REAL logs
The Firebase Console summary is often insufficient. To see the actual failure:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Search for **Cloud Build** in the top search bar.
3. Look for the most recent build related to your App Hosting backend (`studio`).
4. Click on the **Build ID** to see the full execution log.
5. If no build exists there, search for **Logs Explorer**.
6. Use the filter: `resource.type="apphosting.googleapis.com/Backend" AND textPayload:"error"`

## Common Causes for "Something went wrong"
1. **Secret Access**: The App Hosting service account (`firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com`) lacks the `Secret Manager Secret Accessor` role for one of the secrets defined in `apphosting.yaml`.
2. **Missing Secrets**: You have defined `SERVICE_ACCOUNT_JSON` or `RESEND_API_KEY` in `apphosting.yaml`, but they haven't been created in the Secret Manager yet.
3. **Invalid YAML**: Syntax errors or unsupported fields like `kind: 'publishedConfig'` when using source-based builds.

## Resolution Steps
1. **Run Diagnostics**: Execute `bash scripts/check_secret_permissions.sh` in your terminal.
2. **Manual Rollout**: Run the following command to see a more descriptive error:
   ```bash
   firebase apphosting:rollouts:create studio --project memory-weaver-8rk9t
   ```
