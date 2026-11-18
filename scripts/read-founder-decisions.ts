import { getStagingAdmin } from './lib/stagingAdmin';
import { loadPlaneEnv, createPlaneIssue } from './lib/planeClient';
import {
  buildSeededDecisionRecord,
  DEFAULT_FOUNDER_DECISION_SEEDS,
  FOUNDER_DECISIONS_COLLECTION,
  type FounderDecisionRecord,
} from '../src/lib/founderDecisions';

export function formatFounderDecisionSummary(d: FounderDecisionRecord): string {
  const chosenOption = d.options?.find((o) => o.id === d.selectedOptionId);
  const optionText = chosenOption ? `${chosenOption.id}: ${chosenOption.label}` : d.selectedOptionId;
  const lines = [
    `────────────────────────────────────────────────────────────`,
    `[${d.status}] ${d.ticketRef} — ${d.title} (${d.id})`,
    `Choice: ${optionText}${d.deferredToPlane ? ' [DEFERRED_TO_PLANE]' : ''}${d.planeDeferredRef ? ` (Plane: ${d.planeDeferredRef})` : ''}`,
    `Updated: ${d.updatedAtIso || 'N/A'} | By: ${d.decidedBy || 'seeded-default'}`,
  ];
  if (d.notes) {
    lines.push(`Notes: ${d.notes}`);
  }
  return lines.join('\n');
}

export function formatFounderDecisionForPlane(d: FounderDecisionRecord): {
  title: string;
  description: string;
} {
  const chosenOption = d.options?.find((o) => o.id === d.selectedOptionId);
  const optionText = chosenOption ? `${chosenOption.id}: ${chosenOption.label}` : d.selectedOptionId || 'None selected';
  const title = `[DEFERRED DECISION] ${d.ticketRef} — ${d.title}`;
  const lines = [
    `**Decision ID:** ${d.id}`,
    `**Ticket Reference:** ${d.ticketRef}`,
    `**Category:** ${d.category}`,
    `**Status:** DEFERRED_TO_PLANE`,
    `**Selected Option:** ${optionText}`,
    `**Founder Notes:** ${d.notes || 'None recorded'}`,
    `**Decided By:** ${d.decidedBy || 'N/A'}`,
    `**Updated At:** ${d.updatedAtIso || 'N/A'}`,
    '',
    '### Decision Summary',
    d.summary,
  ];

  if (d.options && d.options.length > 0) {
    lines.push('', '### Available Options');
    for (const opt of d.options) {
      const rec = opt.recommended ? ' **[RECOMMENDED]**' : '';
      lines.push(`- **${opt.id}**: ${opt.label}${rec}`);
      if (opt.description) lines.push(`  - ${opt.description}`);
    }
  }

  if (d.externalLinks && d.externalLinks.length > 0) {
    lines.push('', '### External Documentation & Console Links');
    for (const l of d.externalLinks) {
      lines.push(`- [${l.label}](${l.url})`);
    }
  }

  return { title, description: lines.join('\n') };
}

export async function readFounderDecisions(argv: string[] = process.argv.slice(2)) {
  const shouldSeed = argv.includes('--seed');
  const syncPlane = argv.includes('--sync-plane');
  const { adminDb } = getStagingAdmin();

  if (shouldSeed) {
    const now = Date.now();
    for (const seed of DEFAULT_FOUNDER_DECISION_SEEDS) {
      const ref = adminDb.collection(FOUNDER_DECISIONS_COLLECTION).doc(seed.id);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set(buildSeededDecisionRecord(seed, now), { merge: true });
      }
    }
  }

  const snap = await adminDb
    .collection(FOUNDER_DECISIONS_COLLECTION)
    .orderBy('order', 'asc')
    .limit(100)
    .get();

  const decisions: FounderDecisionRecord[] = snap.docs
    .map((docSnap) => ({
      ...(docSnap.data() as FounderDecisionRecord),
      id: docSnap.id,
    }))
    .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));

  const decided = decisions.filter((d) => d.status === 'DECIDED').length;
  const deferred = decisions.filter((d) => d.status === 'DEFERRED_TO_PLANE' || d.deferredToPlane).length;
  const pending = decisions.filter((d) => d.status === 'PENDING').length;

  console.log(`\n🧭 FOUNDER CUTOVER DECISIONS [founder_decisions] (memory-weaver-dev)`);
  console.log(
    `Total: ${decisions.length} | DECIDED: ${decided} | DEFERRED_TO_PLANE: ${deferred} | PENDING: ${pending}\n`
  );

  if (decisions.length === 0) {
    console.log('ℹ️ No founder_decisions seeded yet. Visit /admin?suite=decisions to initialise them.');
    return { total: 0, decided: 0, deferred: 0, pending: 0, synced: 0, decisions };
  }

  for (const d of decisions) {
    console.log(formatFounderDecisionSummary(d));
  }
  console.log(`────────────────────────────────────────────────────────────\n`);

  let synced = 0;
  if (syncPlane) {
    const planeCfg = loadPlaneEnv();
    if (!planeCfg) {
      throw new Error('PLANE_API_KEY is missing in environment or .env.local; cannot --sync-plane.');
    }
    const unsyncedDeferred = decisions.filter(
      (d) => (d.status === 'DEFERRED_TO_PLANE' || d.deferredToPlane === true) && !d.planeDeferredRef
    );

    for (const d of unsyncedDeferred) {
      const { title, description } = formatFounderDecisionForPlane(d);
      const planeKey = await createPlaneIssue(planeCfg, title, description);
      await adminDb.collection(FOUNDER_DECISIONS_COLLECTION).doc(d.id).set(
        {
          planeDeferredRef: planeKey,
          status: 'DEFERRED_TO_PLANE',
          deferredToPlane: true,
          updatedAt: Date.now(),
          updatedAtIso: new Date().toISOString(),
          updatedBy: 'qa:decisions --sync-plane',
        },
        { merge: true }
      );
      console.log(`📌 Created Plane ticket ${planeKey} for deferred decision ${d.id}`);
      synced++;
    }

    if (unsyncedDeferred.length === 0) {
      console.log('✅ All DEFERRED_TO_PLANE decisions already have Plane ticket links (or none are deferred).');
    }
  }

  return { total: decisions.length, decided, deferred, pending, synced, decisions };
}

if (require.main === module) {
  readFounderDecisions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to inspect staging founder_decisions:', err?.message || err);
      process.exit(1);
    });
}
