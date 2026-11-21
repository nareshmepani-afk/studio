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

export type ReleaseControlGateTier = 'TIER_3_FOUNDER' | 'LEGACY_ARCHIVED';

export const ALLOWED_TIER_3_GATE_CATEGORIES = [
  'MONEY_BILLING',
  'DESTRUCTIVE_LIVE_DATA',
  'EXTERNAL_CUSTOMER_LEGAL',
  'NON_API_VENDOR_MFA',
] as const;

export type ReleaseControlGateCategory = (typeof ALLOWED_TIER_3_GATE_CATEGORIES)[number];

export function isValidTier3GateCategory(value: unknown): value is ReleaseControlGateCategory {
  return (
    typeof value === 'string' &&
    (ALLOWED_TIER_3_GATE_CATEGORIES as readonly string[]).includes(value)
  );
}

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
  /** Optional structured scannable verification/execution steps rendered as checklist bullets. */
  checklistSteps?: string[];
  severity: ReleaseControlSeverity;
  /** Required for RED gates: 1 plain-English line explaining the exact downstream knock-on effect. */
  knockOnImpact: string;
  envTag: ReleaseControlEnvTag;
  /** Optional on persisted Firestore docs for backward compatibility; required on all seeds & POST creates. */
  gateTier?: ReleaseControlGateTier;
  gateCategory?: ReleaseControlGateCategory;
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
  | 'gateTier'
  | 'gateCategory'
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
> & {
  gateTier: 'TIER_3_FOUNDER';
  gateCategory: ReleaseControlGateCategory;
};

/**
 * Strictly TIER_3_FOUNDER irreversible business/money/legal/vendor-MFA gates only.
 * Tier 1 engineering chores (bug fixes, smoke checks, infra deploys, key wiring) are
 * executed autonomously via APIs & synthetic health probes and must never be seeded here.
 */
export const DEFAULT_RELEASE_CONTROL_SEEDS: ReleaseControlSeed[] = [
  {
    id: 'ctrl-stripe-live-mode-switch',
    order: 1,
    title: 'Approve Final Step 4: Switch Stripe to Live Mode & Trigger Rollout',
    summary:
      'Uploads live STRIPE_SECRET_KEY (sk_live_) and STRIPE_WEBHOOK_SECRET (whsec_) into memory-weaver-8rk9t Secret Manager, registers canonical https://memoryweaver.studio/api/webhooks/stripe (3 events), activates Billing Portal, and triggers a fresh master rollout.',
    checklistSteps: [
      'Upload live STRIPE_SECRET_KEY (sk_live_) and STRIPE_WEBHOOK_SECRET (whsec_) into memory-weaver-8rk9t Secret Manager',
      'Register canonical https://memoryweaver.studio/api/webhooks/stripe webhook (3 billing/gift events)',
      'Activate Stripe Customer Billing Portal and trigger a fresh master App Hosting rollout',
    ],
    severity: 'RED',
    knockOnImpact:
      'Holding this keeps paid Director Pass, Generational Vault, and Heirloom Gift checkout strictly in Stripe Test Mode.',
    envTag: '[ENV: PROD]',
    gateTier: 'TIER_3_FOUNDER',
    gateCategory: 'MONEY_BILLING',
    ticketRefs: ['MW-408'],
  },
];

/**
 * Derives crisp scannable checklist bullets for any release control card, including
 * legacy Firestore documents that only stored a prose `summary` string.
 */
export function deriveControlChecklistSteps(
  control: Pick<ReleaseControlRecord, 'summary' | 'checklistSteps'>
): string[] {
  if (Array.isArray(control.checklistSteps) && control.checklistSteps.length > 0) {
    return control.checklistSteps.map((s) => String(s).trim()).filter(Boolean);
  }
  const raw = (control.summary || '').trim();
  if (!raw) return [];

  // Split semicolon/newline lists first, otherwise break multi-clause prose cleanly on ", and " / ", "
  const lineSplit = raw
    .split(/\r?\n|;\s*/)
    .map((s) => s.trim().replace(/^[-•☐]\s*/, ''))
    .filter(Boolean);
  if (lineSplit.length > 1) return lineSplit;

  const clauseSplit = raw
    .replace(/\.$/, '')
    .split(/,\s+(?:and\s+)?/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 18);
  if (clauseSplit.length >= 2 && clauseSplit.length <= 5) {
    return clauseSplit.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  }

  return [raw];
}

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

export interface EnvironmentVersionSnapshot {
  commitSha: string | null;
  commitTimestamp: string | null;
  environment?: string | null;
  projectId?: string | null;
  buildTimestamp?: string | null;
  reachable?: boolean;
}

export type EnvironmentParityStatus =
  | 'IN_SYNC'
  | 'STAGING_AHEAD'
  | 'PROD_NEWER_CHECK_BACKMERGE'
  | 'SHAS_DIFFER_NO_TIMESTAMP'
  | 'UNAVAILABLE';

export interface EnvironmentParityReport {
  status: EnvironmentParityStatus;
  label: string;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  stagingSha: string | null;
  prodSha: string | null;
  stagingTimestamp: string | null;
  prodTimestamp: string | null;
  note: string;
}

export function normaliseShortSha(sha?: string | null): string | null {
  if (!sha) return null;
  const trimmed = String(sha).trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.slice(0, 7);
}

/**
 * Pure staging-vs-production live build parity evaluator for FounderInboxConsole.
 * Normalises SHAs to lowercase 7-character prefixes and refuses to guess direction
 * when either commitTimestamp is null or unparseable.
 */
export function evaluateEnvironmentParity(
  staging: EnvironmentVersionSnapshot | null | undefined,
  prod: EnvironmentVersionSnapshot | null | undefined
): EnvironmentParityReport {
  const stagingSha = normaliseShortSha(staging?.commitSha);
  const prodSha = normaliseShortSha(prod?.commitSha);
  const stagingTimestamp = staging?.commitTimestamp || null;
  const prodTimestamp = prod?.commitTimestamp || null;

  if (!stagingSha || !prodSha || prod?.reachable === false || staging?.reachable === false) {
    return {
      status: 'UNAVAILABLE',
      label: 'Live Parity Unavailable',
      tone: 'slate',
      stagingSha,
      prodSha,
      stagingTimestamp,
      prodTimestamp,
      note: 'Production version probe timed out or was skipped; Founder Inbox controls remain unaffected.',
    };
  }

  if (stagingSha === prodSha) {
    return {
      status: 'IN_SYNC',
      label: 'In Sync (Staging & Prod Match)',
      tone: 'emerald',
      stagingSha,
      prodSha,
      stagingTimestamp,
      prodTimestamp,
      note: 'Staging (dev) and Live Production (master) are serving the exact same build.',
    };
  }

  const stagingMs = stagingTimestamp ? Date.parse(stagingTimestamp) : Number.NaN;
  const prodMs = prodTimestamp ? Date.parse(prodTimestamp) : Number.NaN;

  if (Number.isNaN(stagingMs) || Number.isNaN(prodMs)) {
    return {
      status: 'SHAS_DIFFER_NO_TIMESTAMP',
      label: 'SHAs Differ (Timestamp Unavailable)',
      tone: 'amber',
      stagingSha,
      prodSha,
      stagingTimestamp,
      prodTimestamp,
      note: 'Live SHAs differ and commit timestamps are incomplete; Antigravity will verify exact git ancestry.',
    };
  }

  if (prodMs > stagingMs) {
    return {
      status: 'PROD_NEWER_CHECK_BACKMERGE',
      label: 'Prod Newer — Verify Back-Merge',
      tone: 'rose',
      stagingSha,
      prodSha,
      stagingTimestamp,
      prodTimestamp,
      note: 'Production appears newer than Staging. Fixes on master are not automatically on dev — Antigravity must complete the origin/master -> dev back-merge.',
    };
  }

  return {
    status: 'STAGING_AHEAD',
    label: 'Staging Ahead of Prod',
    tone: 'amber',
    stagingSha,
    prodSha,
    stagingTimestamp,
    prodTimestamp,
    note: 'Staging has newer verified changes awaiting founder sign-off before promotion to Production.',
  };
}

export interface ThreeZoneRadarInput {
  localBranch: string;
  dirtyCount: number;
  unpushedDevCount: number;
  originDevSha: string | null;
  liveStagingSha: string | null;
  originMasterSha: string | null;
  liveProdSha: string | null;
  stagingAheadCount: number;
  prodOnlyCount: number;
  refsFresh: boolean;
}

/**
 * Formats the concise 4-line 3-Zone Environment Radar for scripts/read-release-controls.ts.
 */
export function formatThreeZoneRadar(input: ThreeZoneRadarInput): string[] {
  const localState =
    input.dirtyCount === 0 && input.unpushedDevCount === 0
      ? 'clean (0 dirty, 0 unpushed)'
      : `⚠️ ${input.dirtyCount} dirty, ${input.unpushedDevCount} unpushed ahead of origin/dev`;

  const devRef = normaliseShortSha(input.originDevSha) || 'unknown';
  const liveDev = normaliseShortSha(input.liveStagingSha) || 'unreachable';
  const stagingMatch = liveDev !== 'unreachable' && devRef === liveDev ? '✅' : '⏳';

  const masterRef = normaliseShortSha(input.originMasterSha) || 'unknown';
  const liveProd = normaliseShortSha(input.liveProdSha) || 'unreachable';
  const prodMatch = liveProd !== 'unreachable' && masterRef === liveProd ? '✅' : '⏳';

  const refTag = input.refsFresh ? '' : ' (cached refs)';
  let parityLine: string;
  if (input.prodOnlyCount > 0) {
    parityLine = `🚨 BACK-MERGE REQUIRED: ${input.prodOnlyCount} commit(s) on origin/master are NOT on origin/dev — Antigravity must merge origin/master -> dev before any new dev push${refTag}`;
  } else if (input.stagingAheadCount > 0) {
    parityLine = `🟠 Staging ahead of Prod by ${input.stagingAheadCount} commit(s) (0 prod-only hotfixes)${refTag}`;
  } else {
    parityLine = `✅ Staging (origin/dev) and Prod (origin/master) are in full git sync${refTag}`;
  }

  return [
    `Zone 1 [LOCAL]  : branch=${input.localBranch} | ${localState}`,
    `Zone 2 [STAGING]: origin/dev=${devRef} | live dev.memoryweaver.studio=${liveDev} ${stagingMatch}`,
    `Zone 3 [PROD]   : origin/master=${masterRef} | live memoryweaver.studio=${liveProd} ${prodMatch}`,
    `Parity          : ${parityLine}`,
  ];
}

export interface ReleaseControlTargetMeta {
  envTag: ReleaseControlEnvTag;
  isProdTarget: boolean;
  badgeLabel: string;
  badgeClassName: string;
  scopeCue: string | null;
}

/**
 * Pure visual target metadata helper for FounderInboxConsole.
 * Makes production-targeted actions unmistakable ([ENV: PROD] • memoryweaver.studio)
 * while keeping bare hostnames (zero hardcoded https://dev... URLs).
 */
export function getReleaseControlTargetMeta(
  envTag?: ReleaseControlEnvTag | string | null
): ReleaseControlTargetMeta {
  if (envTag === '[ENV: PROD]') {
    return {
      envTag: '[ENV: PROD]',
      isProdTarget: true,
      badgeLabel: '[ENV: PROD] • memoryweaver.studio',
      badgeClassName:
        'bg-rose-600 text-white border-rose-400 font-extrabold tracking-wide shadow-sm shadow-rose-500/30',
      scopeCue:
        'Targets Live Production (memoryweaver.studio / memory-weaver-8rk9t) — approved here on Staging Control Plane',
    };
  }

  if (envTag === '[ENV: BOTH]') {
    return {
      envTag: '[ENV: BOTH]',
      isProdTarget: false,
      badgeLabel: '[ENV: BOTH] • dev -> master',
      badgeClassName: 'bg-violet-500/20 text-violet-200 border-violet-400/45 font-bold',
      scopeCue: null,
    };
  }

  return {
    envTag: '[ENV: STAGING]',
    isProdTarget: false,
    badgeLabel: '[ENV: STAGING] • dev.memoryweaver.studio',
    badgeClassName: 'bg-amber-500/15 text-amber-200 border-amber-400/40 font-bold',
    scopeCue: null,
  };
}
