# 💳 Stripe Setup & Configuration Guide (Option B: One-Time Payments)

> **Architecture Standard**: In accordance with Section 5 of the Memory Weaver Terms of Service, all paid passes (**31-Day Director Pass** @ £12.99 and **Generational Vault** @ £195.00) operate as **single, non-recurring transactions** (`mode: 'payment'`). There are no automated recurring subscriptions or surprise renewals.

---

## 🔑 1. Required Secrets & Environment Variables

| Variable Name | Environment | Description | Format / Example |
| :--- | :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Server (Secret Manager) | Stripe Secret Key for session creation and customer handling | `sk_test_51...` or `sk_live_51...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client / Browser | Stripe Publishable Key for client-side SDK initialisation | `pk_test_51...` or `pk_live_51...` |
| `STRIPE_WEBHOOK_SECRET` | Server (Secret Manager) | Webhook endpoint signing secret for raw body signature validation | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Client / Server | Base origin URL for checkout redirects & return callbacks | `https://dev.memoryweaver.studio` (Staging)<br>`https://memoryweaver.studio` (Production) |

---

## 🛠️ 2. Step-by-Step Setup Runbook

### Step 2.1: Obtain Stripe API Keys
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle to **Test Mode** (top-right header switch) for staging setup, or stay in Live Mode for production.
3. Navigate to **Developers** ➡️ **API keys** ([dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)).
4. Copy the following:
   - **Publishable key** (`pk_test_...` / `pk_live_...`) $\rightarrow$ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (Click *Reveal secret key*, `sk_test_...` / `sk_live_...`) $\rightarrow$ `STRIPE_SECRET_KEY`

---

### Step 2.2: Register Stripe Webhook Endpoints
Webhooks notify our backend when a checkout session completes so we can activate the director pass, update storage quotas, and record the payment ledger.

1. In the Stripe Dashboard, navigate to **Developers** ➡️ **Webhooks** ([dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)).
2. Click **+ Add endpoint**.
3. **Endpoint URL**:
   - **Staging**: `https://dev.memoryweaver.studio/api/webhooks/stripe`
   - **Production**: `https://memoryweaver.studio/api/webhooks/stripe`
4. **Events to Listen to (Option B Non-Recurring Standard)**:
   Click **+ Select events** and check:
   - ✅ `checkout.session.completed` *(Primary trigger: unlocks 31-Day Pass or 100 GB Lifetime Vault and adds cumulative +31 days)*
   - ✅ `payment_intent.succeeded` *(Audit fallback for one-off payment captures)*
   - ✅ `charge.refunded` *(Handles customer support refunds by transitioning account to archive status)*
5. Click **Add endpoint**.
6. Under the **Signing secret** section of the newly created webhook, click **Reveal** and copy the secret (`whsec_...`) $\rightarrow$ `STRIPE_WEBHOOK_SECRET`.

---

### Step 2.3: Configure the Stripe Customer Billing Portal
The customer portal gives storytellers and family producers self-serve access to download VAT receipts and tax invoices without requiring support intervention.

1. In the Stripe Dashboard, navigate to **Settings** (gear icon) ➡️ **Billing** ➡️ **Customer portal** ([dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)).
2. Click **Activate portal** (if not already active).
3. **Invoice History**:
   - ✅ Check **View invoice and receipt history** (allows 1-click PDF receipt downloads).
4. **Payment Methods**:
   - ✅ Check **Allow customers to update payment methods**.
5. **Subscriptions**:
   - ❌ **Uncheck "Allow customers to cancel subscriptions"** *(Memory Weaver uses single non-recurring transactions under Option B; disabling this eliminates confusion around recurring renewals)*.
6. **Business Information**:
   - **Terms of Service**: `https://memoryweaver.studio/legal/terms`
   - **Privacy Policy**: `https://memoryweaver.studio/legal/privacy`
7. Click **Save changes**.

---

### Step 2.4: Inject Secrets into Firebase App Hosting & Secret Manager

To make these keys securely accessible to Cloud Run backends:

#### In Google Cloud Secret Manager:
1. Navigate to [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager?project=memory-weaver-8rk9t) for project `memory-weaver-8rk9t`.
2. Add or update secrets:
   - `STRIPE_SECRET_KEY`: `sk_test_...` / `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...`
3. Grant the Firebase App Hosting compute service account (`...-compute@developer.gserviceaccount.com`) the **Secret Manager Secret Accessor** role.

#### In Local `.env.local` (for isolated local development):
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://dev.memoryweaver.studio
```

---

## 🧪 3. Verification & Testing Playbook

### Stripe Test Card Numbers
When testing on Staging (`https://dev.memoryweaver.studio/pricing`):

| Test Scenario | Card Number | Expiry | CVC | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Successful Pass Purchase** | `4242 •••• •••• 4242` | Any future date | `123` | Redirects to `/settings?checkout=success`, unlocks 31-Day Pass (15 GB) |
| **Successful Lifetime Vault** | `4242 •••• •••• 4242` | Any future date | `123` | Redirects to `/settings?checkout=success`, unlocks Lifetime Vault (100 GB) |
| **Cumulative Extension** | `4242 •••• •••• 4242` | Any future date | `123` | Second purchase adds $+31$ days to existing expiry date |
| **Declined Card** | `4000 •••• •••• 0002` | Any future date | `123` | Stripe inline error, no charge created, pass remains unchanged |

---

## 💻 4. Local Webhook Forwarding (Stripe CLI)

If you are developing or testing webhook logic locally on your development machine:

```powershell
# 1. Authenticate Stripe CLI
stripe login

# 2. Forward webhooks to local Next.js instance
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Copy the output signing secret (whsec_...) into your .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...

# 4. In a separate terminal, trigger a test checkout event:
stripe trigger checkout.session.completed
```
