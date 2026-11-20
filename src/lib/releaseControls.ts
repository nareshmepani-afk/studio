export const RELEASE_CONTROLS_COLLECTION = 'release_controls';

export type ReleaseControlSeverity = 'RED' | 'AMBER';

export type ReleaseControlStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'HELD'
  | 'HELD_BLOCKING'
  | 'DEFERRED_TO_PLANE'
  | 'EXECUTED';

export type ReleaseControlAction =
  | 'APPROVE'
  | 'HOLD'
  | 'DEFER_TO_PLANE'
  | 'REOPEN'
  | 'MARK_EXECUTED';

export type ReleaseControlEnvTag = '[ENV: PROD]' | '[ENV: STAGING]' | '[ENV: BOTH]';

export interface ReleaseControlAuditEntry {
  action: ReleaseControlAction;
  fromStatus: ReleaseControlStatus;
  toStatus: ReleaseControlStatus;
  actor: string;
  at: number;
  atIso: string;
  note?: string;
  acknowledgedKnockOn?: boolean;
}

export interface ReleaseControlRecord {
  id: string;
  order: number;
  title: string;
  summary: string;
  severity: ReleaseControlSeverity;
  /** Required for RED gates: 1 plain-English line explaining the exact downstream knock-on effect. */
  knockOnImpact: string;
  envTag: ReleaseControlEnvTag;
  ticketRefs: string[];
  status: ReleaseControlStatus;
  notes: string;
  acceptedKnockOnDelay: boolean;
  acknowledgedKnockOnAt?: number | null;
  planeTag?: '[DEFERRED-BLOCKER]' | '[DEFERRED-CONTROL]' | null;
  planeDeferredRef?: string | null;
  executedCommitSha?: string | null;
  executedAt?: number | null;
  executedAtIso?: string | null;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
  updatedAtIso?: string;
  auditTrail?: ReleaseControlAuditEntry[];
}

export type ReleaseControlSeed = Omit<
  ReleaseControlRecord,
  | 'status'
  | 'notes'
  | 'acceptedKnockOnDelay'
  | 'acknowledgedKnockOnAt'
  | 'planeTag'
  | 'planeDeferredRef'
  | 'executedCommitSha'
  | 'executedAt'
  | 'executedAtIso'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'updatedAtIso'
  | 'auditTrail'
>;

export const DEFAULT_RELEASE_CONTROL_SEEDS: ReleaseControlSeed[] = [
  {
    id: 'ctrl-push-walkthrough-batch-dev',
    order: 1,
    title: 'Push Staged Local Walkthrough Batch to Staging (dev)',
    summary:
      'Commits and pushes the locally verified dev batch (MW-414 Admin Pre-Launch prod guard & ?suite= URL sync, MW-415 Option 4+ Navbar + OpticsPrivacyShield compact live label, UK "Optimise Studio" copy, 5 Dual-Track Hard Rules, and Founder Inbox Option B) to origin/dev.',
    severity: 'RED',
    knockOnImpact:
      'Holding this delays deploying MW-414 & MW-415 to staging and blocks promoting the navbar/admin fixes to production.',
    envTag: '[ENV: BOTH]',
    ticketRefs: ['MW-414', 'MW-415'],
  },
  {
    id: 'ctrl-prod-smoke-signoff',
    order: 2,
    title: 'Confirm Production Smoke Test All Clear (memoryweaver.studio)',
    summary:
      'Confirms remaining production smoke checks (Studio AI Weaver synthesis + Gift Voucher link & email delivery) are verified green on memoryweaver.studio.',
    severity: 'RED',
    knockOnImpact:
      'Holding this keeps Final Step 4 paused so Stripe remains in Test Mode and live customer checkout stays locked.',
    envTag: '[ENV: PROD]',
    ticketRefs: ['MW-408'],
  },
  {
    id: 'ctrl-stripe-live-mode-switch',
    order: 3,
    title: 'Approve Final Step 4: Switch Stripe to Live Mode & Trigger Rollout',
    summary:
      'Uploads live STRIPE_SECRET_KEY (sk_live_) and STRIPE_WEBHOOK_SECRET (whsec_) into memory-weaver-8rk9t Secret Manager, registers canonical https://memoryweaver.studio/api/webhooks/stripe (3 events), activates Billing Portal, and triggers a fresh master rollout.',
    severity: 'RED',
    knockOnImpact:
      'Holding this keeps paid Director Pass, Generational Vault, and Heirloom Gift checkout strictly in Stripe Test Mode.',
    envTag: '[ENV: PROD]',
    ticketRefs: ['MW-408'],
  },
  {
    id: 'ctrl-rotate-plane-api-key',
    order: 4,
    title: 'Rotate PLANE_API_KEY & Close MW-405',
    summary:
      'Mints a fresh Plane.so workspace API key, updates local .env.local, verifies scripts/plane.js states, revokes the legacy key from git history, and marks MW-405 Done.',
    severity: 'AMBER',
    knockOnImpact:
      'Safe to hold until immediately after launch cutover; does not block staging builds or customer traffic.',
    envTag: '[ENV: STAGING]',
    ticketRefs: ['MW-405'],
  },
];

export function buildSeededReleaseControl(
  seed: ReleaseControlSeed,
  now = Date.now()
): ReleaseControlRecord {
  return {
    ...seed,
    status: 'PENDING',
    notes: '',
    acceptedKnockOnDelay: false,
    acknowledgedKnockOnAt: null,
    planeTag: null,
    planeDeferredRef: null,
    executedCommitSha: null,
    executedAt: null,
    executedAtIso: null,
    updatedBy: 'seeded-default',
    createdAt: now,
    updatedAt: now,
    updatedAtIso: new Date(now).toISOString(),
    auditTrail: [],
  };
}

export interface TransitionInput {
  action: ReleaseControlAction;
  actor: string;
  now?: number;
  notes?: string;
  expectedUpdatedAt?: number | null;
  acknowledgedKnockOn?: boolean;
  executedCommitSha?: string | null;
}

export type TransitionResult =
  | { ok: true; next: ReleaseControlRecord }
  | { ok: false; status: 400 | 409; error: string };

const MAX_AUDIT_ENTRIES = 20;

/**
 * Pure state-machine & optimistic concurrency guard for release_controls.
 * - Rejects mutations against terminal EXECUTED records with HTTP 409.
 * - Rejects stale browser updates when expectedUpdatedAt !== record.updatedAt with HTTP 409.
 * - Requires acknowledgedKnockOn === true when deferring a RED gate (1A), tagging [DEFERRED-BLOCKER].
 */
export function evaluateReleaseControlTransition(
  record: ReleaseControlRecord,
  input: TransitionInput
): TransitionResult {
  const now = typeof input.now === 'number' ? input.now : Date.now();
  const actor = (input.actor || 'founder-admin').trim();

  if (record.status === 'EXECUTED') {
    return {
      ok: false,
      status: 409,
      error: `Release control "${record.id}" is already EXECUTED and locked. Refresh the Founder Inbox to see current state.`,
    };
  }

  if (
    typeof input.expectedUpdatedAt === 'number' &&
    Number.isFinite(input.expectedUpdatedAt) &&
    record.updatedAt !== input.expectedUpdatedAt
  ) {
    return {
      ok: false,
      status: 409,
      error: `Stale state detected for "${record.id}" (updated concurrently). Refreshing Founder Inbox before applying changes.`,
    };
  }

  let nextStatus: ReleaseControlStatus = record.status;
  let acceptedKnockOnDelay = Boolean(record.acceptedKnockOnDelay);
  let acknowledgedKnockOnAt = record.acknowledgedKnockOnAt ?? null;
  let planeTag = record.planeTag ?? null;
  let executedCommitSha = record.executedCommitSha ?? null;
  let executedAt = record.executedAt ?? null;
  let executedAtIso = record.executedAtIso ?? null;

  switch (input.action) {
    case 'APPROVE': {
      nextStatus = 'APPROVED';
      break;
    }
    case 'HOLD': {
      nextStatus = record.severity === 'RED' ? 'HELD_BLOCKING' : 'HELD';
      break;
    }
    case 'DEFER_TO_PLANE': {
      if (record.severity === 'RED' && input.acknowledgedKnockOn !== true) {
        return {
          ok: false,
          status: 400,
          error:
            'Deferring a RED blocking gate requires explicit knock-on delay acknowledgement (acknowledgedKnockOn: true).',
        };
      }
      nextStatus = 'DEFERRED_TO_PLANE';
      planeTag = record.severity === 'RED' ? '[DEFERRED-BLOCKER]' : '[DEFERRED-CONTROL]';
      if (record.severity === 'RED') {
        acceptedKnockOnDelay = true;
        acknowledgedKnockOnAt = now;
      }
      break;
    }
    case 'REOPEN': {
      nextStatus = 'PENDING';
      break;
    }
    case 'MARK_EXECUTED': {
      nextStatus = 'EXECUTED';
      executedCommitSha = input.executedCommitSha?.trim() || record.executedCommitSha || null;
      executedAt = now;
      executedAtIso = new Date(now).toISOString();
      break;
    }
    default: {
      return {
        ok: false,
        status: 400,
        error: `Unsupported release control action: ${String(input.action)}`,
      };
    }
  }

  const nextNotes = typeof input.notes === 'string' ? input.notes.trim() : record.notes || '';
  const auditEntry: ReleaseControlAuditEntry = {
    action: input.action,
    fromStatus: record.status,
    toStatus: nextStatus,
    actor,
    at: now,
    atIso: new Date(now).toISOString(),
    ...(nextNotes ? { note: nextNotes } : {}),
    ...(input.acknowledgedKnockOn ? { acknowledgedKnockOn: true } : {}),
  };

  const nextAudit = [...(Array.isArray(record.auditTrail) ? record.auditTrail : []), auditEntry].slice(
    -MAX_AUDIT_ENTRIES
  );

  return {
    ok: true,
    next: {
      ...record,
      status: nextStatus,
      notes: nextNotes,
      acceptedKnockOnDelay,
      acknowledgedKnockOnAt,
      planeTag,
      executedCommitSha,
      executedAt,
      executedAtIso,
      updatedBy: actor,
      updatedAt: now,
      updatedAtIso: new Date(now).toISOString(),
      auditTrail: nextAudit,
    },
  };
}

export function isControlActionable(control: ReleaseControlRecord): boolean {
  return (
    control.status === 'PENDING' ||
    control.status === 'HELD' ||
    control.status === 'HELD_BLOCKING'
  );
}

export function sortReleaseControls(controls: ReleaseControlRecord[]): ReleaseControlRecord[] {
  const rank = (c: ReleaseControlRecord): number => {
    if (c.severity === 'RED' && (c.status === 'PENDING' || c.status === 'HELD_BLOCKING')) return 0;
    if (c.severity === 'AMBER' && (c.status === 'PENDING' || c.status === 'HELD')) return 1;
    if (c.status === 'APPROVED') return 2;
    if (c.status === 'DEFERRED_TO_PLANE') return 3;
    return 4; // EXECUTED
  };

  return [...controls].sort((a, b) => {
    const rDiff = rank(a) - rank(b);
    if (rDiff !== 0) return rDiff;
    return Number(a.order || 999) - Number(b.order || 999);
  });
}

export interface InboxBadgeCounts {
  red: number;
  amber: number;
  approvedAwaitingCli: number;
  readySignOff: number;
  pendingDecisions: number;
  totalActionable: number;
}

export function computeInboxBadgeCounts(params: {
  controls: ReleaseControlRecord[];
  pendingDecisionsCount: number;
  readyBugsCount: number;
}): InboxBadgeCounts {
  const red = params.controls.filter(
    (c) => c.severity === 'RED' && (c.status === 'PENDING' || c.status === 'HELD_BLOCKING')
  ).length;
  const amber =
    params.controls.filter(
      (c) => c.severity === 'AMBER' && (c.status === 'PENDING' || c.status === 'HELD')
    ).length + params.pendingDecisionsCount;
  const approvedAwaitingCli = params.controls.filter((c) => c.status === 'APPROVED').length;
  const readySignOff = params.readyBugsCount;

  return {
    red,
    amber,
    approvedAwaitingCli,
    readySignOff,
    pendingDecisions: params.pendingDecisionsCount,
    totalActionable: red + amber + readySignOff,
  };
}

export function formatReleaseControlForPlane(control: ReleaseControlRecord): {
  title: string;
  description: string;
} {
  const tag =
    control.planeTag || (control.severity === 'RED' ? '[DEFERRED-BLOCKER]' : '[DEFERRED-CONTROL]');
  const title = `${tag} ${control.envTag} ${control.title}`;
  const lines = [
    `**Control ID:** ${control.id}`,
    `**Gatekeeper Signal:** ${control.severity === 'RED' ? '🔴 RED (Blocking)' : '🟠 AMBER (Non-Blocking)'}`,
    `**Environment Tag:** ${control.envTag}`,
    `**Status:** ${control.status}`,
    `**Knock-On Impact:** ${control.knockOnImpact}`,
    `**Accepted Knock-On Delay:** ${control.acceptedKnockOnDelay ? 'YES (Explicitly acknowledged by founder)' : 'N/A'}`,
    `**Related Tickets:** ${control.ticketRefs.length > 0 ? control.ticketRefs.join(', ') : 'None'}`,
    `**Founder Notes:** ${control.notes || 'None recorded'}`,
    `**Updated By:** ${control.updatedBy || 'N/A'}`,
    `**Updated At:** ${control.updatedAtIso || 'N/A'}`,
    '',
    '### Gate Summary',
    control.summary,
  ];

  return { title, description: lines.join('\n') };
}
