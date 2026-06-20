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

## Master Project Backlog

- `[ ]` **[MW-101]** Finalize Phase 1 Edge Auth Validation testing post-cookie patch.
- `[ ]` **[MW-102]** Build UI Component for Phase 1.2 TOTP MFA Enrollment.
- `[ ]` **[MW-103]** Build Data Layout for Phase 2.1 Access & Support Whitelist CRUD Table.
- `[ ]` **[MW-104]** Implement Real-Time Firestore Listener Streams for Phase 3.1 Terminal Log Console.
- `[ ]` **[MW-105]** Structure SVG Math Sparkline Paths for Phase 3.2 Business & Analytics Dashboard.
