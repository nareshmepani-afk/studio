import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

// Initialize Stripe server client lazily to avoid build-time errors if env vars are unset
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build';
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia' as any,
      appInfo: {
        name: 'Memory Weaver Studio',
        version: '1.1.0-beta',
        url: 'https://memoryweaver.studio',
      },
    });
  }
  return stripeInstance;
}

export type CheckoutTier = 'director' | 'generational_vault';
export type SupportedCurrency = 'gbp' | 'usd';

export interface TierPricingConfig {
  name: string;
  description: string;
  mode: Stripe.Checkout.SessionCreateParams.Mode;
  amount: {
    gbp: number; // in pennies / pence (e.g. 1299 for £12.99)
    usd: number; // in cents (e.g. 1499 for $14.99)
  };
  interval?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval;
  storageQuotaBytes: number;
}

export const PRICING_TIERS_CONFIG: Record<CheckoutTier, TierPricingConfig> = {
  director: {
    name: '31-Day Director Pass',
    description: 'Full 5-Act Studio, 15 GB 4K Cloud Vault, AI Narrative Synthesis & Unlimited 4K Cinema Streaming (31 Days Studio Access • Single Non-Recurring Transaction).',
    mode: 'payment',
    amount: {
      gbp: 1299, // £12.99 one-off
      usd: 1499, // $14.99 one-off
    },
    storageQuotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB
  },
  generational_vault: {
    name: 'Generational Vault (Lifetime)',
    description: 'Permanent 100 GB Generational Cloud Vault, Offline Archive Export, All Future Studio Enhancements & Zero Rent Forever (Perpetual Lifetime Access).',
    mode: 'payment',
    amount: {
      gbp: 19500, // £195.00 one-time
      usd: 24900, // $249.00 one-time
    },
    storageQuotaBytes: 100 * 1024 * 1024 * 1024, // 100 GB
  },
};

/**
 * Ensures a single Stripe Customer ID per user to prevent customer duplication in Stripe Dashboard.
 */
export async function getOrCreateStripeCustomer(params: {
  uid: string;
  email: string;
  displayName?: string | null;
}): Promise<string> {
  const { uid, email, displayName } = params;

  if (adminDb) {
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    if (userData?.stripeCustomerId) {
      return userData.stripeCustomerId as string;
    }
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: displayName || undefined,
    metadata: {
      uid,
    },
  });

  if (adminDb) {
    try {
      await adminDb.collection('users').doc(uid).set(
        {
          stripeCustomerId: customer.id,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to cache stripeCustomerId in Firestore:', err);
    }
  }

  return customer.id;
}

/**
 * Creates a customized Stripe Checkout session for Director Pass or Generational Vault.
 * Both tiers operate under mode: 'payment' for fixed-duration and lifetime access (matching Section 5 of Terms of Service).
 */
export async function createStripeCheckoutSession(params: {
  uid: string;
  email: string;
  displayName?: string | null;
  tier: CheckoutTier;
  currency?: SupportedCurrency;
  origin: string;
  returnUrl?: string;
}): Promise<Stripe.Checkout.Session> {
  const { uid, email, displayName, tier, currency = 'gbp', origin, returnUrl } = params;
  const stripe = getStripe();
  const tierConfig = PRICING_TIERS_CONFIG[tier];

  if (!tierConfig) {
    throw new Error(`Invalid checkout tier: ${tier}`);
  }

  const customerId = await getOrCreateStripeCustomer({ uid, email, displayName });
  const unitAmount = tierConfig.amount[currency] || tierConfig.amount.gbp;

  const successUrl = `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`;
  const cancelUrl = returnUrl || `${origin}/pricing?checkout=cancelled&tier=${tier}`;

  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
    currency,
    product_data: {
      name: tierConfig.name,
      description: tierConfig.description,
      metadata: {
        tier,
      },
    },
    unit_amount: unitAmount,
  };

  if (tierConfig.mode === 'subscription' && tierConfig.interval) {
    priceData.recurring = {
      interval: tierConfig.interval,
    };
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    client_reference_id: uid,
    customer_email: undefined, // omitted when customer ID is specified
    mode: tierConfig.mode,
    line_items: [
      {
        price_data: priceData,
        quantity: 1,
      },
    ],
    metadata: {
      uid,
      tier,
      userEmail: email,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    allow_promotion_codes: false,
    submit_type: 'pay',
    custom_text: {
      submit: {
        message: 'Your memory studio access and 4K cloud vault activate immediately upon completion.',
      },
    },
  };

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Creates a self-serve Stripe Customer Billing Portal session.
 */
export async function createStripeBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const { customerId, returnUrl } = params;
  const stripe = getStripe();

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
