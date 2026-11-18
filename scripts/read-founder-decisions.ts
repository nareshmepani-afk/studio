import { getStagingAdmin } from './lib/stagingAdmin';
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
    `Choice: ${optionText}${d.deferredToPlane ? ' [DEFERRED_TO_PLANE]' : ''}`,
    `Updated: ${d.updatedAtIso || 'N/A'} | By: ${d.decidedBy || 'seeded-default'}`,
  ];
  if (d.notes) {
    lines.push(`Notes: ${d.notes}`);
  }
  return lines.join('\n');
}

export async function readFounderDecisions(argv: string[] = process.argv.slice(2)) {
  const shouldSeed = argv.includes('--seed');
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
  const deferred = decisions.filter((d) => d.status === 'DEFERRED_TO_PLANE').length;
  const pending = decisions.filter((d) => d.status === 'PENDING').length;

  console.log(`\n🧭 FOUNDER CUTOVER DECISIONS [founder_decisions] (memory-weaver-dev)`);
  console.log(
    `Total: ${decisions.length} | DECIDED: ${decided} | DEFERRED_TO_PLANE: ${deferred} | PENDING: ${pending}\n`
  );

  if (decisions.length === 0) {
    console.log('ℹ️ No founder_decisions seeded yet. Visit /admin?suite=decisions to initialise them.');
    return { total: 0, decided: 0, deferred: 0, pending: 0, decisions };
  }

  for (const d of decisions) {
    console.log(formatFounderDecisionSummary(d));
  }
  console.log(`────────────────────────────────────────────────────────────\n`);

  return { total: decisions.length, decided, deferred, pending, decisions };
}

if (require.main === module) {
  readFounderDecisions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to inspect staging founder_decisions:', err?.message || err);
      process.exit(1);
    });
}
