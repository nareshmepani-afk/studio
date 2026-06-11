/**
 * Central Business Manifest
 * 
 * Act as the single source of truth for app operations.
 * Highly structured and immutable configuration manifest.
 */
export const BUSINESS_MANIFEST = {
  tiers: {
    sandbox: {
      name: "Sandbox Preview",
      priceMonthlyGbp: 0,
      priceMonthlyUsd: 0,
      featuresLocked: ["CLOUD_STORAGE", "FIREBASE_WRITE", "CLOUD_STITCHING"],
      demoScript: "p_einstein"
    },
    director: {
      name: "Director Pass",
      priceMonthlyGbp: 12.99,
      priceMonthlyUsd: 14.99,
      promotionalTrialMonths: 6
    }
  },
  userLifecycles: {
    paid_host_pass_expired: {
      statusLabel: "Expired Pass Archive Mode",
      allowDataVisibility: true,
      blockWriteActions: true,
      blockedVectors: [
        "SAVE_MEMORY_UPLOAD",
        "STITCH_AND_APPROVE",
        "SNAPSHOT_POSTER_FRAME",
        "UPLOAD_CUSTOM_ARTWORK"
      ],
      ctaMapping: {
        primary: "Renew / Upgrade Pass",
        secondary: "Cancel"
      }
    }
  },
  supportPlaybooks: {
    MW_66_GUEST_INTERCEPT: {
      context: "Guest encounters DirectorialUpsellDialog.tsx due to database write blocks.",
      resolutionSteps: [
        "Instruct user to keep current browser tab open to preserve local WebM Blobs in IndexedDB.",
        "Direct user to execute the account creation flow inside the Radix container.",
        "Pipeline will automatically migrate localforage cache to active Firestore collection post-auth."
      ]
    }
  }
} as const;

export type BusinessManifest = typeof BUSINESS_MANIFEST;
