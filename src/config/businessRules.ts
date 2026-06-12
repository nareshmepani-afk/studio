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
        "UPLOAD_CUSTOM_ARTWORK",
        "CREATE_NEW_CHAPTER",
        "ENTER_RECORDING_PIPELINE"
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
    },
    MW_69_DIAGNOSTIC_SHORTCUT: {
      context: "User requires rapid remote debug tracing assistance or encounters studio glitches. Outbound delivery is dispatched via Resend. Inbound support mail is managed by Cloudflare Email Routing on memoryweaver.studio forwarding to the active destination inbox, which is connected to Plane.so for automated ticket ingestion.",
      resolutionSteps: [
        "Verify Resend is configured with a valid RESEND_API_KEY and verified domain sender addresses (support@ and studio@).",
        "Verify Cloudflare Email Routing is enabled with support@ forwarding rule active.",
        "Ensure the destination inbox (or direct alias) is configured to ingest incoming tickets into the Plane.so project backlog.",
        "Instruct user to press Ctrl + / (or Cmd + / on Mac) anywhere in the workspace to trigger the bug report overlay.",
        "Extract the 'traceId' parameter string from the received Plane.so issue ticket description and query BigQuery to view the historical event timeline."
      ]
    },
    MW_70_COMPLIMENTARY_PASS: {
      context: "User complimentary 6-month pass claiming and expiration flow handling.",
      resolutionSteps: [
        "A user is only allowed to claim the complimentary 6-month Director Pass once in their lifetime.",
        "Verify double-claim prevention by checking if 'directorPassActivationDate' is populated in the user's Firestore document.",
        "Calculate active vs expired status dynamically using a 6-month date delta offset from the activation date.",
        "In case of expiration, block features and show the upgrade prompt rather than allowing a re-claim."
      ]
    }
  }
} as const;

export type BusinessManifest = typeof BUSINESS_MANIFEST;
