import { getStagingAdmin } from './lib/stagingAdmin';
import { loadPlaneEnv, createPlaneIssue } from './lib/planeClient';
import { readFounderDecisions } from './read-founder-decisions';
import { readBugReports } from './read-bug-reports';
import {
  buildSeededReleaseControl,
  DEFAULT_RELEASE_CONTROL_SEEDS,
  evaluateReleaseControlTransition,
  formatReleaseControlForPlane,
  RELEASE_CONTROLS_COLLECTION,
  sortReleaseControls,
  type ReleaseControlRecord,
} from '../src/lib/releaseControls';

function readArgValue(argv: string[], key: string): string | null {
  const prefix = `--${key}=`;
  const inline = argv.find((a) => a.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const idx = argv.indexOf(`--${key}`);
  if (idx !== -1 && idx + 1 < argv.length && !argv[idx + 1].startsWith('--')) {
    return argv[idx + 1];
  }
  return null;
}

export async function readReleaseControls(argv: string[] = process.argv.slice(2)) {
  const shouldSeed = argv.includes('--seed');
  const syncPlane = argv.includes('--sync-plane');
  const markExecuted = argv.includes('--mark-executed');

  // Fails closed on production (memory-weaver-8rk9t): release controls are staging-only.
  const { adminDb } = getStagingAdmin();
  const col = adminDb.collection(RELEASE_CONTROLS_COLLECTION);

  if (shouldSeed) {
    const now = Date.now();
    for (const seed of DEFAULT_RELEASE_CONTROL_SEEDS) {
      const ref = col.doc(seed.id);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set(buildSeededReleaseControl(seed, now), { merge: true });
      }
    }
  }

  if (markExecuted) {
    const id = readArgValue(argv, 'id');
    if (!id) {
      throw new Error('--mark-executed requires --id=<control-id>');
    }
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`Release control "${id}" not found in ${RELEASE_CONTROLS_COLLECTION}.`);
    }
    const existing = { ...(snap.data() as ReleaseControlRecord), id: snap.id };
    const sha = readArgValue(argv, 'sha') || undefined;
    const notes = readArgValue(argv, 'notes') || undefined;
    const transition = evaluateReleaseControlTransition(existing, {
      action: 'MARK_EXECUTED',
      actor: 'qa:controls --mark-executed',
      executedCommitSha: sha,
      notes,
    });
    if (!transition.ok) {
      throw new Error(transition.error);
    }
    await ref.set(transition.next, { merge: false });
    console.log(`✅ Marked release control "${id}" EXECUTED${sha ? ` (SHA ${sha})` : ''}.`);
  }

  const snap = await col.limit(100).get();
  const controls = sortReleaseControls(
    snap.docs.map((d) => ({ ...(d.data() as ReleaseControlRecord), id: d.id }))
  );

  const approved = controls.filter((c) => c.status === 'APPROVED');
  const heldBlocking = controls.filter((c) => c.status === 'HELD_BLOCKING');
  const redPending = controls.filter((c) => c.severity === 'RED' && c.status === 'PENDING');
  const amberActive = controls.filter(
    (c) => c.severity === 'AMBER' && (c.status === 'PENDING' || c.status === 'HELD')
  );

  console.log(`\n🚦 FOUNDER RELEASE CONTROLS [release_controls] (memory-weaver-dev)`);
  console.log(
    `Total: ${controls.length} | 🚀 APPROVED: ${approved.length} | 🔴 RED PENDING: ${redPending.length} | 🔴 HELD_BLOCKING: ${heldBlocking.length} | 🟠 AMBER ACTIVE: ${amberActive.length}\n`
  );

  if (heldBlocking.length > 0) {
    console.log('⚠️  HOLD_ACTIVE — Founder is holding RED blocking gate(s). Do NOT push/merge downstream blocked items:');
    for (const c of heldBlocking) {
      console.log(`   - [${c.id}] ${c.title} -> Knock-on: ${c.knockOnImpact}${c.notes ? ` | Note: ${c.notes}` : ''}`);
    }
    console.log('');
  }

  for (const c of controls) {
    const icon = c.severity === 'RED' ? '🔴' : '🟠';
    console.log(`────────────────────────────────────────────────────────────`);
    console.log(`${icon} [${c.status}] ${c.id} ${c.envTag} — ${c.title}`);
    console.log(`Knock-on: ${c.knockOnImpact}`);
    if (c.planeDeferredRef) console.log(`Plane Ticket: ${c.planeDeferredRef} (${c.planeTag || ''})`);
    if (c.executedCommitSha) console.log(`Executed SHA: ${c.executedCommitSha} (${c.executedAtIso || ''})`);
    if (c.notes) console.log(`Notes: ${c.notes}`);
  }
  if (controls.length > 0) {
    console.log(`────────────────────────────────────────────────────────────\n`);
  }

  let syncedControls = 0;
  if (syncPlane) {
    const planeCfg = loadPlaneEnv();
    if (!planeCfg) {
      throw new Error('PLANE_API_KEY is missing in environment or .env.local; cannot --sync-plane.');
    }

    const unsyncedDeferred = controls.filter(
      (c) => c.status === 'DEFERRED_TO_PLANE' && !c.planeDeferredRef
    );
    for (const c of unsyncedDeferred) {
      const { title, description } = formatReleaseControlForPlane(c);
      const planeKey = await createPlaneIssue(planeCfg, title, description);
      await col.doc(c.id).set(
        {
          planeDeferredRef: planeKey,
          updatedAt: Date.now(),
          updatedAtIso: new Date().toISOString(),
          updatedBy: 'qa:controls --sync-plane',
        },
        { merge: true }
      );
      console.log(`📌 Created Plane ticket ${planeKey} for deferred release control ${c.id}`);
      syncedControls++;
    }
  }

  // Delegate cleanly to single-source readers (no duplicate sync logic)
  const subArgs = syncPlane ? ['--sync-plane'] : [];
  const decisionsSummary = await readFounderDecisions(subArgs);
  const bugsSummary = await readBugReports(subArgs);

  return {
    controlsCount: controls.length,
    approvedCount: approved.length,
    heldBlockingCount: heldBlocking.length,
    syncedControls,
    decisionsSummary,
    bugsSummary,
  };
}

if (require.main === module) {
  readReleaseControls().catch((err) => {
    console.error('❌ qa:controls failed:', err?.message || err);
    process.exit(1);
  });
}
