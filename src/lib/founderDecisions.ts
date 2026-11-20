export const FOUNDER_DECISIONS_COLLECTION = 'founder_decisions';

export type FounderDecisionStatus = 'PENDING' | 'DECIDED' | 'DEFERRED_TO_PLANE';

export interface FounderDecisionOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface FounderDecisionLink {
  label: string;
  url: string;
}

export interface FounderDecisionRecord {
  id: string;
  order: number;
  ticketRef: string;
  category: string;
  title: string;
  summary: string;
  recommendedOptionId: string;
  selectedOptionId: string;
  status: FounderDecisionStatus;
  deferredToPlane: boolean;
  planeDeferredRef?: string;
  notes: string;
  options: FounderDecisionOption[];
  externalLinks: FounderDecisionLink[];
  createdAt: number;
  updatedAt: number;
  updatedAtIso?: string;
  decidedBy?: string;
}

export type FounderDecisionSeed = Omit<
  FounderDecisionRecord,
  'selectedOptionId' | 'status' | 'deferredToPlane' | 'notes' | 'createdAt' | 'updatedAt'
>;

export const DEFAULT_FOUNDER_DECISION_SEEDS: FounderDecisionSeed[] = [
  {
    id: 'mw-409-prod-qa-purge',
    order: 1,
    ticketRef: 'MW-409',
    category: 'Database Hygiene',
    title: 'Approve Production qa_suites Purge Prior to Cutover',
    summary:
      'Our dry-run audit against memory-weaver-8rk9t identified 88 legacy qa_suites Firestore paths (and 0 qa-evidence/ Storage objects). Running npm run prod:purge-qa -- --confirm-prod removes those test suite records strictly from production without touching memory-weaver-dev.',
    recommendedOptionId: 'approve_now',
    options: [
      {
        id: 'approve_now',
        label: 'Approve live Firestore purge now (--confirm-prod before dev -> master merge)',
        description: 'Deletes the 88 legacy qa_suites test paths from memory-weaver-8rk9t prior to opening Apex traffic.',
        recommended: true,
      },
      {
        id: 'purge_with_storage',
        label: 'Approve Firestore + qa-evidence/ Storage sweep (--confirm-prod --include-storage)',
        description: 'Performs both the Firestore cleanup and a belt-and-braces prefix sweep on memory-weaver-8rk9t.firebasestorage.app.',
      },
      {
        id: 'hold_until_after_cutover',
        label: 'Hold purge until immediately after production smoke verification',
        description: 'Keeps legacy documents untouched until after the first live smoke walk on memoryweaver.studio.',
      },
    ],
    externalLinks: [
      {
        label: 'Open Prod Firestore Data',
        url: 'https://console.firebase.google.com/project/memory-weaver-8rk9t/firestore/databases/-default-/data',
      },
    ],
  },
  {
    id: 'mw-408-prod-web-app-id',
    order: 2,
    ticketRef: 'MW-408',
    category: 'Firebase App Identity',
    title: 'Confirm Production Firebase Web App ID (f48699 vs e2b08f)',
    summary:
      'Production project memory-weaver-8rk9t currently lists two Web Apps: MemoryWeaverWebApp (1:67296998103:web:f48699405c37bcf4567692), already bound in apphosting.prod.yaml and src/lib/firebase/config.ts, and legacy Firebase app (1:67296998103:web:e2b08f9187175693567692).',
    recommendedOptionId: 'keep_f48699',
    options: [
      {
        id: 'keep_f48699',
        label: 'Keep MemoryWeaverWebApp (1:67296998103:web:f48699405c37bcf4567692)',
        description: 'Zero code edits required — already aligned across apphosting.prod.yaml and production client config.',
        recommended: true,
      },
      {
        id: 'switch_e2b08f',
        label: 'Switch production config to legacy Firebase app (e2b08f9187175693567692)',
        description: 'Updates apphosting.prod.yaml and src/lib/firebase/config.ts to point production builds at e2b08f.',
      },
      {
        id: 'audit_and_retire_unused',
        label: 'Keep f48699 active and verify retiring legacy e2b08f later',
        description: 'Proceeds with f48699 for launch and tracks removal of e2b08f cleanly afterwards.',
      },
    ],
    externalLinks: [
      {
        label: 'Open Prod Project Settings',
        url: 'https://console.firebase.google.com/project/memory-weaver-8rk9t/settings/general',
      },
    ],
  },
  {
    id: 'mw-408-auth-recaptcha-domains',
    order: 3,
    ticketRef: 'MW-408',
    category: 'Auth & App Security',
    title: 'Confirm Firebase Auth & reCAPTCHA Enterprise Authorised Domains',
    summary:
      'Before opening https://memoryweaver.studio to Testers or Gift Recipients, confirm Firebase Authentication Authorised Domains and reCAPTCHA Enterprise key 6LeeZdIsAAAAAN1jn9Pw3z1VZfB8zmLZTwqDYZMK both include memoryweaver.studio, www.memoryweaver.studio, admin.memoryweaver.studio, and the default hosted.app origin.',
    recommendedOptionId: 'confirmed_all_domains',
    options: [
      {
        id: 'confirmed_all_domains',
        label: 'Confirmed — all production domains are authorised in Firebase Auth & reCAPTCHA Enterprise',
        description: 'Ready for live registration, login, and protected billing checkout on production.',
        recommended: true,
      },
      {
        id: 'auth_done_recaptcha_pending',
        label: 'Firebase Auth domains added; still adding domains to reCAPTCHA Enterprise',
        description: 'Hold production sign-up cutover until reCAPTCHA key domain allowlist saves cleanly.',
      },
      {
        id: 'joint_console_check_needed',
        label: 'Request quick domain verification during cutover window',
        description: 'Verify both consoles together before switching Stripe Live Mode.',
      },
    ],
    externalLinks: [
      {
        label: 'Open Prod Auth Authorised Domains',
        url: 'https://console.firebase.google.com/project/memory-weaver-8rk9t/authentication/settings',
      },
      {
        label: 'Open Prod reCAPTCHA Enterprise Key',
        url: 'https://console.cloud.google.com/security/recaptcha/6LeeZdIsAAAAAN1jn9Pw3z1VZfB8zmLZTwqDYZMK/details?project=memory-weaver-8rk9t',
      },
    ],
  },
  {
    id: 'mw-405-plane-token-rotation',
    order: 4,
    ticketRef: 'MW-405',
    category: 'Credential Hygiene',
    title: 'Schedule Plane.so API Key Rotation',
    summary:
      'scripts/prod-preflight.ts already enforces zero hardcoded plane_api_ tokens in git source. Confirm when you would like to rotate PLANE_API_KEY in Plane Workspace Settings and update your local .env.local.',
    recommendedOptionId: 'rotate_after_walkthrough',
    options: [
      {
        id: 'rotate_after_walkthrough',
        label: 'Rotate PLANE_API_KEY right after the founder staging walkthrough',
        description: 'Keeps current staging bug-sync pipeline uninterrupted during walkthrough, then revokes the old key immediately afterwards.',
        recommended: true,
      },
      {
        id: 'already_rotated',
        label: 'Already rotated and saved in local .env.local',
        description: 'Marks MW-405 ready for immediate closure.',
      },
      {
        id: 'rotate_post_stripe_cutover',
        label: 'Rotate immediately after Stripe Live Mode is switched on',
        description: 'Combines final key rotation with the post-launch security close-out.',
      },
    ],
    externalLinks: [
      {
        label: 'Open Plane Workspace API Tokens',
        url: 'https://app.plane.so/memory-weaver-studio/settings/api-tokens/',
      },
    ],
  },
];

export function buildSeededDecisionRecord(
  seed: FounderDecisionSeed,
  now = Date.now()
): FounderDecisionRecord {
  return {
    ...seed,
    selectedOptionId: seed.recommendedOptionId,
    status: 'PENDING',
    deferredToPlane: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
    updatedAtIso: new Date(now).toISOString(),
  };
}
