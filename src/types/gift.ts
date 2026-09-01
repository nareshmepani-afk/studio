/**
 * Gift Voucher Domain Types
 * 
 * Act V Heirloom Gifting Engine (MW-86 / Ticket #220)
 * Defines the Firestore schema, enumerated types, and result interfaces
 * for the gift voucher lifecycle: creation → verification → redemption.
 */

// ---------------------------------------------------------------------------
// Enumerated Type Aliases
// ---------------------------------------------------------------------------

/** The purchasable gift tier — mirrors CheckoutTier from stripe.ts */
export type GiftTier = 'director' | 'generational_vault';

/** Voucher lifecycle status */
export type VoucherStatus = 'unredeemed' | 'redeemed' | 'revoked';

/** How the keepsake/link reaches the storyteller */
export type DeliveryMode = 'printable_pdf' | 'scheduled_email' | 'instant_link';

/**
 * Unboxing ceremony language for multilingual diaspora support.
 * Allows the giver to select the entrance copy language so a grandmother
 * sees her greeting in her native script.
 */
export type UnboxingLanguage = 'en' | 'gu' | 'pa' | 'hi';

/** Tone presets for AI Dedication Muse */
export type DedicationTone = 'heartfelt' | 'poetic' | 'celebratory' | 'understated';

/** Human-readable labels for unboxing languages */
export const UNBOXING_LANGUAGE_LABELS: Record<UnboxingLanguage, string> = {
  en: 'English',
  gu: 'ગુજરાતી (Gujarati)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  hi: 'हिन्दी (Hindi)',
};

// ---------------------------------------------------------------------------
// Firestore Document Schema: /gift_vouchers/{voucherCode}
// ---------------------------------------------------------------------------

export interface GiftVoucherDocument {
  /** Crockford Base32 token, e.g. "MW-VAULT-7K8P-9Q2M" */
  code: string;

  /** Gift tier (mirrors Stripe checkout tier) */
  tier: GiftTier;

  /** Storage vault allocation: 15 GB (director) or 100 GB (generational_vault) */
  vaultQuotaGb: 15 | 100;

  /** Duration in days for time-limited passes; null for perpetual lifetime */
  durationDays: 31 | null;

  /** Current lifecycle status */
  status: VoucherStatus;

  // ── Giver Metadata ──────────────────────────────────────────────────

  /** Firebase UID of the purchaser */
  giverUid: string;

  /** Display name of the giver */
  giverName: string;

  /** Email address of the giver */
  giverEmail: string;

  /** Personal dedication message (max 500 chars) */
  giftMessage: string;

  /** Optional audio/video dedication Cloud Storage URL (Phase 4) */
  giverMediaUrl?: string | null;

  // ── Recipient Metadata ──────────────────────────────────────────────

  /** Display name of the intended recipient */
  recipientName: string;

  /** Optional email for scheduled delivery */
  recipientEmail?: string | null;

  /** Delivery mechanism selected by the giver */
  deliveryMode: DeliveryMode;

  /** ISO 8601 date for scheduled email dispatch (null if not scheduled) */
  scheduledDeliveryDate?: string | null;

  /** Whether the scheduled email has been dispatched */
  deliveryDispatched?: boolean;

  /** ISO 8601 timestamp of scheduled email dispatch */
  deliveryDispatchedAt?: string | null;

  /** Language for the unboxing ceremony entrance copy */
  unboxingLanguage?: UnboxingLanguage;

  // ── Financial & Audit Ledger ────────────────────────────────────────

  /** True if minted via admin console (zero Stripe charge) */
  isFounderMint: boolean;

  /** Stripe Checkout Session ID (null for founder mints) */
  stripeSessionId?: string | null;

  /** Stripe Payment Intent ID (null for founder mints) */
  stripePaymentIntentId?: string | null;

  /** Amount paid in minor currency units (e.g. 19500 = £195.00) */
  amountPaid: number;

  /** Payment currency */
  currency: 'gbp' | 'usd';

  /** ISO 8601 timestamp of purchase/mint */
  purchasedAt: string;

  // ── Redemption Audit Trail ──────────────────────────────────────────

  /** Firebase UID of the user who redeemed */
  redeemedByUid?: string | null;

  /** Email of the user who redeemed */
  redeemedByEmail?: string | null;

  /** ISO 8601 timestamp of redemption */
  redeemedAt?: string | null;

  // ── Security & Abuse Prevention ─────────────────────────────────────

  /** Number of failed verification attempts against this code */
  failedAttempts: number;

  /** ISO 8601 timestamp of the last failed attempt */
  lastAttemptAt?: string | null;

  /** ISO 8601 expiry date (null for perpetual validity) */
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// API Result Types
// ---------------------------------------------------------------------------

/** Returned by /api/gift/redeem on successful redemption */
export interface RedemptionResult {
  tier: GiftTier;
  giverName: string;
  vaultQuotaGb: number;
  giftMessage: string;
}

/** Returned by /api/gift/verify for public voucher lookups */
export interface VoucherVerifyResult {
  valid: boolean;
  tier?: GiftTier;
  giverName?: string;
  recipientName?: string;
  giftMessage?: string;
  status?: VoucherStatus;
  unboxingLanguage?: UnboxingLanguage;
}

// ---------------------------------------------------------------------------
// Gift Checkout Parameters (passed to Stripe session builder)
// ---------------------------------------------------------------------------

/** Parameters injected into Stripe Checkout metadata for gift purchases */
export interface GiftCheckoutParams {
  isGift: true;
  recipientName: string;
  recipientEmail?: string;
  giftMessage: string;
  deliveryMode: DeliveryMode;
  scheduledDeliveryDate?: string;
  unboxingLanguage?: UnboxingLanguage;
}

// ---------------------------------------------------------------------------
// Gift Tier Display Configuration (Editorial naming)
// ---------------------------------------------------------------------------

export interface GiftTierDisplay {
  editorialName: string;
  subtitle: string;
  priceGbp: string;
  priceUsd: string;
  features: string[];
}

export const GIFT_TIER_DISPLAY: Record<GiftTier, GiftTierDisplay> = {
  director: {
    editorialName: 'The Milestone Director\'s Edition',
    subtitle: '31 Days Full Studio Access & 15 GB Vault',
    priceGbp: '£12.99',
    priceUsd: '$14.99',
    features: [
      'Full 5-Act Studio Access',
      '15 GB 4K Cloud Vault',
      'AI Narrative Synthesis',
      'Unlimited Cinema Streaming',
      '31 Days of Studio Access',
    ],
  },
  generational_vault: {
    editorialName: 'The Generational Heirloom',
    subtitle: 'Lifetime Archival & 100 GB Vault',
    priceGbp: '£195.00',
    priceUsd: '$249.00',
    features: [
      'Permanent 100 GB Generational Vault',
      'Lifetime Studio Access — Zero Rent Forever',
      'Offline Archive Export Package',
      'All Future Studio Enhancements',
      'Priority Family Heritage Support',
    ],
  },
};
