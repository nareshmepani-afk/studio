# Living Knowledge Manifest

## System Architecture

### Edge Middleware & Routing
- **File**: [middleware.ts](file:///C:/Users/home/studio/src/middleware.ts)
- **Pathing**: Intercepts `/admin/:path*` (except `/admin/login` and `/admin/mfa-setup`) to validate authenticated admin access.
- **Session Evaluation**: Decodes the Firebase ID token cookie (`__session`) using edge-compatible JWT library (`jose`) and queries Firestore REST API for whitelist validation.

### Firestore Admin & Authentication Gateway
- **Collection**: `admin_users`
- **Fields**:
  - `isActive`: Boolean to allow/block back-office administrative console access.
  - `mfaSetupComplete`: Boolean verifying registration of TOTP MFA key.
  - `mfaSecret`: Encrypted/Base32 security key used to evaluate second factor authentication.
- **Server Action**: [actions.ts](file:///C:/Users/home/studio/src/app/admin/actions.ts) (`verifyAdminCredentials` writes the `__session` HTTP-only cookie).
- **Navigation Sync**: Uses hard window redirects (`window.location.href`) in authentication handlers to force browser cookie writes before middleware evaluation.

### Build-Time CSS Compilation & Tracking
- **Config Tracking**: Explicitly white-listed `tailwind.config.js` and `postcss.config.js` from the general `*.js` ignore rules in `.gitignore` to prevent styling/layout compile-time drops on remote Cloud builds.
- **Pre-Flight Validation**: Implemented a local package script (`npm run build:check`) that runs Next.js build compilation and validates CSS layout bundle size budgets (preventing <20kB layout-stripped deployments).

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
