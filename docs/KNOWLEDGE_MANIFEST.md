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
- **Headless & E2E Testing**: Utilizes Playwright runner (`test-playwright-run.js`) with fake UI flags (`--use-fake-ui-for-media-stream`) and local webm blob assets (`public/ffmpeg/`) to run media device tests.
- **Security & CAPTCHA Bypass**: Employs URL parameter authentication bypasses (`?mode=guest&sessionId=TEST_E2E_SESSION`) to test workflow stages without triggering Firebase Auth/ReCAPTCHA.
- **Operational Shield**: Runs Vitest test suite ([businessRules.test.ts](file:///C:/Users/home/studio/src/config/__tests__/businessRules.test.ts)) freezing tier prices, sandbox settings, and support playbook step counts.

### [LIVE-PRODUCTION] (Public Deployments)
- **Production URL**: Primary live instance at `memoryweaver.studio`.
- **Infrastructure Integrations**: Employs Cloudflare Email Routing for destination address mapping and Resend API key setup for outbound user delivery.
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

## System Quality Directives

> **UI QUALITY DIRECTIVE**: All dashboard, authentication, and internal support layout elements must feature absolute center alignment, proper padding envelopes, typography hierarchies, and strict functional device compliance (e.g., QR quiet zone buffers). Internal tooling mirrors public production fidelity.
