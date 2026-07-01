# Living Knowledge Manifest

## System Architecture

### [ADMIN-CRM] (Back-Office Portal)
- **Host / Domain**: Accessed securely via `admin.*` subdomain.
- **Edge Middleware Protection**: Intercepts `/admin/:path*` (except login and MFA routes) using `jose` JWT checks and queries Firestore REST API for whitelist validation.
- **Authentication & MFA**: Implements multi-factor authentication (MFA) redirects (`/admin/mfa-setup`) to register/validate TOTP secrets (`mfaSecret` in `admin_users` collection).
- **Operational Data & Tracking**: Uses Server Actions ([crmActions.ts](file:///C:/Users/home/studio/src/actions/crmActions.ts)) to paginate and cache user journeys (`user_journeys` collection) showing session steps, heartbeats, and storage metrics.
- **Support Ingestion**: Connects inbound support forwarding from Cloudflare Routing directly to Plane.so project backlogs.

### [DEV-APP] (Local Development & Testing)
- **Local Sandbox**: Evaluates code at `localhost` with fully-offline fallbacks.
- **Staging / Dev Target**: Deployed to `memory-weaver-dev` alias servicing `https://dev.memoryweaver.studio/`.
- **Headless & E2E Testing**: Utilizes Playwright runner (`test-playwright-run.js`) with fake UI flags (`--use-fake-ui-for-media-stream`) and local webm blob assets (`public/ffmpeg/`) to run media device tests.
- **Security & CAPTCHA Bypass**: Employs client-side and server-side compile-time fenced gates. If `NEXT_PUBLIC_BYPASS_CAPTCHA === 'true'` and the project is not production (`memory-weaver-8rk9t`), the application skips loading/executing reCAPTCHA Enterprise and verifies via the `BYPASS_STAGE_RECAPTCHA` token.
- **Telemetry Processing**: Ingests debounced event arrays securely through `/api/telemetry/flush`, running on the standard Node.js serverless runtime to execute atomic `WriteBatch` operations via `adminDb` safely.
- **Operational Shield**: Runs Vitest test suite ([businessRules.test.ts](file:///C:/Users/home/studio/src/config/__tests__/businessRules.test.ts)) freezing tier prices, sandbox settings, and support playbook step counts.

### [LIVE-PRODUCTION] (Public Deployments)
- **Production URL**: Primary live instance at `memoryweaver.studio`.
- **Infrastructure Integrations**: Employs Cloudflare Email Routing for destination address mapping.
- **Secret & Key Security**: Configures dynamic secret resolution via Google Secret Manager inside [apphosting.yaml](file:///C:/Users/home/studio/apphosting.yaml#L28-L36). All production API keys (e.g., `RESEND_API_KEY`, `SERVICE_ACCOUNT_JSON`) must NEVER be written to the codebase in plaintext or committed as part of local env parameters; they must be managed directly in the Google Cloud/Firebase Secret Console and exposed dynamically to the server runtime.
- **Telemetry & Exceptions**: Structured server-side logging with distributed trace correlation IDs and BigQuery analytics tracking.
- **Pre-Flight Pipeline Guard**: Integrates `node scripts/generateLivingDocs.js` and `npm run build:check` in the build process to verify living manifest markdown updates and validate CSS bundle size budgets (>20kB check) before deployments.


## Master Project Backlog

- `[x]` **[MW-100]** Sync manifest baseline and fix server action cookie race condition.
- `[x]` **[MW-101]** Finalize Phase 1 Edge Auth Validation testing post-cookie patch.
- `[x]` **[MW-102]** Build UI Component for Phase 1.2 TOTP MFA Enrollment.
- `[x]` **[MW-103]** Build Data Layout for Phase 2.1 Access & Support Whitelist CRUD Table.
- `[x]` **[MW-104]** Implement Real-Time Firestore Listener Streams for Phase 3.1 Terminal Log Console.
- `[x]` **[MW-105]** Structure SVG Math Sparkline Paths for Phase 3.2 Business & Analytics Dashboard.
- `[x]` **[MW-106]** SUCCESS: Force configuration files tracking, resolve router navigation race conditions, register pre-flight build check, and verify clean production deployments.
- `[x]` **[MW-121]** Implement compile-time fenced reCAPTCHA bypass logic in authentication server actions.
- `[x]` **[MW-123]** Create telemetry API route handler supporting transactional WriteBatches on Node.js runtime.
- `[x]` **[MW-125]** Extend client-side reCAPTCHA script loading and execution bypass constraints to the Registration route.
- `[x]` **[MW-126]** Automate dev user initialization & staging integration pass runbook.
- `[x]` **[MW-127]** Define App Hosting environment variables configuration and inject build-time flags.
- `[x]` **[MW-128]** Fix App Hosting dynamic client-side configuration selector and resolve Authorized Domains referer issues.

## System Quality Directives

> **UI QUALITY DIRECTIVE**: All dashboard, authentication, and internal support layout elements must feature absolute center alignment, proper padding envelopes, typography hierarchies, and strict functional device compliance (e.g., QR quiet zone buffers). Internal tooling mirrors public production fidelity.

## Operational & Diagnostic Lessons

### 1. Subdomain Routing Collision
- **Issue**: Registering the same subdomain (e.g., `dev.memoryweaver.studio`) across multiple Firebase Hosting sites/projects creates a Google Frontend (GFE) routing conflict.
- **Solution**: The domain must be deleted from the conflicting console. Simply updating DNS records is insufficient.

### 2. GFE Cloud Run Ingress IAM Blocks
- **Issue**: Firebase Hosting rewrites to Cloud Run services fail with `403 Forbidden` if the Firebase Hosting service agent or target audience lacks invocation permissions.
### 3. Google Cloud Logging & CLI Tooling Constraints
- **Constraint**: `gcloud` and `firebase` global CLI binaries are not guaranteed to be installed in the developer's terminal environment.
- **Rule**: Never execute shell-based CLI diagnostics without verifying path access first. Instead, parse local credentials files (`~/.config/configstore/firebase-tools.json`) and call REST API endpoints using native `https` node modules (avoiding `fetch` on Windows Node runtimes which triggers asynchronous handle crashes like `UV_HANDLE_CLOSING`).

### 4. Firestore Document Scriptorium Architecture (Empty Array Validation)
- **Constraint**: The `Scriptorium` editor workspace maps over elements inside `scriptBlocks`. If this field is empty or initialized as an empty map (`arrayValue: {}`), the editor component will crash silently on load, causing the screen to go blank.
- **Rule**: When committing or selecting AI-generated script visions, never write an empty array value. If a vision is applied, ensure `scriptBlocks` contains at least one default block object containing the selected text, a valid ID (`crypto.randomUUID()`), and a type declaration (`beat`).

