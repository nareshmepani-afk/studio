import { getStagingAdmin } from './lib/stagingAdmin';

export async function recordQaResolution(
  itemId: string,
  resolution: string,
  resolvedBy = 'Chat 2 (The Flash Executor)',
  commitSha = 'b1fd5c9c'
) {
  const { adminDb } = getStagingAdmin();
  const itemRef = adminDb.collection('qa_suites').doc('active_deck').collection('items').doc(itemId);
  await itemRef.set(
    {
      developerResolution: resolution,
      resolutionStatus: 'RESOLVED',
      resolvedCommit: commitSha,
      resolvedAt: Date.now(),
      resolvedBy: resolvedBy,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  console.log(`✅ Recorded resolution for Item ${itemId} in Cloud Firestore.`);
}

const RESOLUTION_55_5 = `1. [Why "EDIT SCENE" was displayed]: The tester account (nareshmepani@hotmail.com) already owns an authentic memoir for Part I Scene 2 in Firestore (doc 5F7e9DACtBao5lgKYAxf) containing authentic narrative prose ("Looking back, what stays with me most..."). Under SingleCardPromptCarousel.tsx, whenever activeProse is populated, the carousel renders the script viewer and the button explicitly displays "✏️ EDIT SCENE" (line 1825). The "[ ✏️ Draft Scene / Begin Story ]" label (line 2009) is designed solely for pristine zero-state scenes.
2. [Why it passed the data test]: 'npm run qa:validate' is a static codebase linter that checks routes and canonical curriculum IDs against masterStoryStructure.ts; it cannot inspect private, per-user Firestore documents. Furthermore, Item 55.5 previously linked to a bare route without ?qa_seed=55.5, which allowed it to fall back to the tester's populated memoir.
3. [The Permanent Sandbox Fix]: Bound Item 55.5 to the deterministic sandbox seeder via ?qa_seed=55.5 (mounting qa_fixture_\${uid}_55_5) and attached the '[ 🧪 Provision Sandbox Scene ]' button. In sandbox mode, the scene initializes with pristine empty prose, correctly displaying '[ ✏️ Draft Scene / Begin Story ]', while isolating mutations from authentic memoir 5F7e9DACtBao5lgKYAxf.`;

if (require.main === module) {
  recordQaResolution('55.5', RESOLUTION_55_5)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to record resolution:', err);
      process.exit(1);
    });
}
