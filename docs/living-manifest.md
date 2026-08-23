# Living Business Manifest

*This document is automatically compiled at build-time from the application's central business rules config ([businessRules.ts](../src/config/businessRules.ts)). Do not modify this file directly.*

## Subscription Tiers

| Tier Name | Price (GBP) | Price (USD) | Locked Features | Additional Config |
| :--- | :---: | :---: | :--- | :--- |
| **Sandbox Preview** (`sandbox`) | £0.00 | $0.00 | `CLOUD_STORAGE`, `FIREBASE_WRITE`, `CLOUD_STITCHING` | Demo Script: `p_einstein` |
| **Director Pass** (`director`) | £12.99 | $14.99 | None | Promotional Trial: 6 months |
| **Generational Vault (Lifetime)** (`generational_vault`) | £195.00 | $249.00 |  | Demo Script: `100GB_VAULT_PERPETUAL` |

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

### Playbook: MW_118_ANTI_BOT_GUEST_PRIVACY

**Context:**
> Unauthenticated guest access pass, Anti-Bot Edge rate-limiting, and 4-digit Family PIN protection on public cinema stories.

**Resolution Steps:**
1. Unauthenticated visitors (!user) viewing /cinema?id=... see masked monologue text and 4K video launcher behind the Anti-Bot Privacy Shield Gate.
2. Guestbook Reactions ([ SEND NOTE ]) and Guest Q&A Teleprompter ([ SUBMIT QUESTION ]) are strictly hidden until authenticated or unlocked with Family PIN.
3. Edge Middleware (src/middleware.ts) enforces a sliding-window rate-limiter (100 req/min per IP) returning HTTP 429 to prevent bot hammering.
4. Guests can unlock the story instantly via 1-Tap Free Guest Pass Sign-In or entering the 4-digit Family PIN (default: 1234).

### Playbook: MW_122_PRE_RELEASE_SCREENERS_CINEMA

**Context:**
> Pre-Release Screener Workflow & 3-Section Memory Cinema Dashboard Architecture.

**Resolution Steps:**
1. Partition /cinema dashboard into Section 1 (🌟 Official Premieres), Section 2 (🎬 Pre-Release Screeners), and Section 3 (🔖 My Saved Family Cinema).
2. Pre-Release Screeners display amber badges (bg-amber-500/10 border-amber-500/30 text-amber-400) allowing storytellers to share private cuts before locking 4K masters.
3. Drafts missing final video renders display a Cinematic Storyboard Reel with Web Speech TTS Voice Synthesizer ([ 🔊 Listen to Monologue Draft ]) and a Private Family Feedback Box ([ 💬 Send Note to Storyteller ]).
4. Telemetry hotspots HS_CINEMA_SECTION_OFFICIAL, HS_CINEMA_SECTION_DRAFTS, HS_CINEMA_SECTION_SAVED, HS_CINEMA_PLAY_TTS_BTN, and HS_CINEMA_SUBMIT_FEEDBACK_BTN are active.

### Playbook: MW_123_FUSION_SCORE_GUEST_LAYER

**Context:**
> Fusion Cohesive Narrative & Cinematic Score Guest Layer in MemoryCinematicViewer.

**Resolution Steps:**
1. Render top Cinematic Score Pill (HS_CINEMA_SCORE_PILL) displaying musical mood, instrumentation, and BPM above the media viewport.
2. Render Fusion Cohesive Narrative Card (HS_CINEMA_FUSION_CARD) displaying sensoryPalette, emotionalTone, and cohesiveScript directly beneath the video/audio viewport.
3. Collapse gracefully if fusionManifest and sensory values are missing without causing layout shifts.

### Playbook: MW_124_MOVIE_POSTER_VIEWER_TOGGLE

**Context:**
> Interactive Movie Poster keyart view switcher inside MemoryCinematicViewer STAGE CONTROLS.

**Resolution Steps:**
1. Provide 1-tap view switcher ([ 🖼️ Movie Poster ] / [ ▶ Watch Video ]) in floating STAGE CONTROLS toolbar.
2. Bind telemetry hotspot attribute HS_CINEMA_TOGGLE_POSTER_BTN.
3. Render 2:3 vertical film poster with Hollywood billing block via CinemaPoster component when activeViewMode is poster.

### Playbook: MW_125_FUSED_OFFLINE_AUTOBIOGRAPHY_KEEPSAKE

**Context:**
> Dual-integrated Fused Offline Autobiography Keepsake Export Engine in Act IV Studio & Guest Cinema.

**Resolution Steps:**
1. Synthesize printable 2-page document (Page 1 Cover Poster + Billing Block + QR Code & Page 2 Monologue + Sensory Blueprint Chapter).
2. Bind telemetry hotspot attributes HS_CINEMA_DOWNLOAD_AUTOBIOGRAPHY_BTN and HS_ACT4_DOWNLOAD_AUTOBIOGRAPHY_BTN.
3. Export in Memory Weaver dark obsidian (#020617), amber gold (#f59e0b), and emerald heritage (#10b981) brand theme.

### Playbook: MW_126_STAGE_CONTROL_MODE_REFACTOR

**Context:**
> Stage Control Mode Selection Refactor moving mode switcher pills inside left wing of ProductionControlBar.

**Resolution Steps:**
1. Remove top-right header room switcher nav from ProductionDeck header.
2. Integrate Compact Segmented Glassmorphic Pill Switcher inside left wing of ProductionControlBar.
3. Bind telemetry hotspot attributes HS_STAGE_CONTROL_MODE_SOLO_BTN, HS_STAGE_CONTROL_MODE_COLLAB_BTN, and HS_STAGE_CONTROL_MODE_GUEST_DIR_BTN.
4. Render Act-aware dynamic labels (e.g. Solo Scripting in Act I vs Solo Record in Act III vs Solo Review in Act IV).

### Playbook: MW_130_LIVING_ROOM_TV_CAST

**Context:**
> Living Room TV Cast & AirPlay Suite in Act V Studio & Guest Cinema Portal.

**Resolution Steps:**
1. Attach x-webkit-airplay='allow' and controlsList='nodownload' to HTML5 video element.
2. Inject WebKit AirPlay availability listeners and Google Cast Web Sender SDK loader safely.
3. Render casting controls with HS_CINEMA_CAST_AIRPLAY_BTN and HS_CINEMA_CAST_CHROMECAST_BTN.
4. Build 10-foot lean-back Smart TV portal route (/cinema/tv) with TV remote key handlers bound to HS_CINEMA_TV_REMOTE_TOGGLE.
5. Integrate HS_ACT5_LIVING_ROOM_PREMIERE_BTN launcher and Living Room Premiere Casting Modal in Act V.

### Playbook: MW_84_COOKIE_CONSENT_ARCHITECTURE

**Context:**
> Public Visitor Cookie Consent (PECR / UK GDPR) vs Registered Director SaaS Contractual Agreement.

**Resolution Steps:**
1. Unauthenticated visitors viewing public marketing routes (/, /pricing, /how-it-works, /contact) receive the binary CookieConsentDock ([ Accept All ] vs [ Reject All ]).
2. Clicking 'Reject All' updates GA4 Consent Mode v2 (analytics_storage: 'denied') and writes mw_consent cookie without blocking any site navigation.
3. Registered Directors inside private studio routes (/studio, /dashboard, /settings) are NOT interrupted by cookie banners; their account creation checkbox ('I agree to Terms & Privacy') establishes legal contract under UK GDPR Article 6(1)(b).
4. Essential session cookies (__session) and first-party operational telemetry (/api/telemetry) operate under Contractual Necessity & Legitimate Interest to prevent video render loss and ensure recording stability.
5. Users can inspect live status or modify cookie preferences at any time via the Interactive Preference Manager on /legal/cookies or inside Studio /settings.

### Playbook: MW_84_PUBLISHED_AUTOBIOGRAPHY_COMPLIANCE

**Context:**
> Published Autobiography Distribution Paradigm, Search Engine Screener Shield, and Zero-AI-Training Guarantee.

**Resolution Steps:**
1. Published family memoirs operate on a physical-to-digital Published Autobiography model: scanning poster QR codes or opening /cinema?id=... streams in 4K with zero login walls.
2. Edge Middleware (src/middleware.ts) automatically injects 'X-Robots-Tag: noindex, nofollow' on all parameterized screening routes (/cinema?id=..., /cinema/tv?id=..., /share/...) to keep private family memoirs out of search engines.
3. The Privacy Policy (/legal/privacy) establishes an immutable Zero-AI-Training Guarantee: user voice recordings, private transcripts, and archival imagery are never used to train third-party machine learning models.
4. Directors retain absolute sovereign control via the Master Kill Switch: [ Unpublish ] immediately deactivates all public QR codes and streaming URLs globally, while [ Delete ] permanently purges all cloud storage assets.

### Playbook: MW_193_EMAIL_OPERATIONS_AND_DNS_DELIVERABILITY

**Context:**
> Email Operations Suite, 4 Core Obsidian-Gold Templates, and DNS Deliverability Records (SPF / DKIM / DMARC).

**Resolution Steps:**
1. Email Operations Console (/admin?suite=email) provides 1-click test dispatches across all 4 production templates (Welcome Host Pass, Collaborator Invite, Password Reset, Premiere Notification).
2. Domain deliverability relies on verified TXT records: SPF (v=spf1 include:resend.com include:_spf.google.com ~all), DKIM RSA-2048 (resend._domainkey.memoryweaver.studio), and DMARC (v=DMARC1; p=reject; rua=mailto:dmarc@memoryweaver.studio).
3. Dual-directional email routing uses Cloudflare Email Routing for inbound mail forwarding to personal destinations, and Resend SMTP credentials (smtp.resend.com, Port 465/587) for outbound dispatches.
4. Access Support Console (/admin?suite=access) enables 1-tap re-triggering of complimentary Host Passes with direct secure server action authorization.

### Playbook: MW_194_BULK_EMAIL_DISPATCH_AND_QUEUE_PACING

**Context:**
> Bulk Email Audience Ingestion, Rate-Limited Queue Pacing, and Live Transmission Receipt Streaming.

**Resolution Steps:**
1. Audience Ingestion supports RFC 4180 CSV uploads and raw text pasting with automated header synonym mapping (email, name, claimedMemoryTitle, role, passcode, etc.) and RFC regex validation.
2. Case-insensitive deduplication preserves the first valid contact instance while marking duplicates as SKIPPED to prevent spamming recipients.
3. Server actions (sendAdminBatchChunkAction) enforce strict bounding to 5–10 recipients per request to prevent serverless execution timeouts.
4. Frontend modal orchestrates queue pacing velocities: Gentle (2 emails/sec, 500ms delay), Standard (5 emails/sec, 200ms delay), and Turbo (10 emails/sec, 100ms delay) to prevent Resend API HTTP 429 rate limit exceptions.
5. Discrete per-recipient state tracking (PENDING, IN_FLIGHT, DELIVERED, SIMULATED, FAILED, SKIPPED) guarantees pause/resume idempotency with zero duplicate dispatches.
6. Operators can export comprehensive delivery audit reports (.csv) containing message IDs, timestamps, SPF/DKIM verification tags, and failure details.

