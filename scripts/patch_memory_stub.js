/**
 * 🛠️ Memory Stub Patch & Backfill Script
 *
 * Directive: MW-88 Dual-Surface State Consolidation & Repair
 * Patches legacy/stub memory documents with canonical curriculum fields.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

async function patchMemoryStub(
  userId: string,
  memoryId: string,
  patchData: Record<string, any>
) {
  const docRef = db.collection('users').doc(userId).collection('memories').doc(memoryId);
  const snap = await docRef.get();

  if (!snap.exists) {
    console.warn(`[patchMemoryStub] Document ${memoryId} not found under user ${userId}`);
    return false;
  }

  await docRef.set(patchData, { merge: true });
  console.log(`[patchMemoryStub] Successfully patched ${memoryId}:`, patchData);
  return true;
}

if (require.main === module) {
  const targetUid = 'TQdB395kXxaAGPhFxk1LVWuT8cg2';
  const targetMemoryId = 'ey96djU6qR1BrDGnvZwp';
  const patchPayload = {
    promptId: 'p1',
    chapterId: 'part-i',
    sceneId: 'part-1-scene-1',
    partNumber: 1,
    title: 'Child of Two Worlds',
    productionStage: 2,
    actsCompleted: ['act1', 'act2'],
    createdAt: '2026-08-18T15:40:10.567Z',
    status: 'pre-release',
  };

  patchMemoryStub(targetUid, targetMemoryId, patchPayload)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[patchMemoryStub] Error:', err);
      process.exit(1);
    });
}

module.exports = { patchMemoryStub };
