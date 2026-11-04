import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const stagingConfig = {
  apiKey: 'AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98',
  authDomain: 'memory-weaver-dev.firebaseapp.com',
  projectId: 'memory-weaver-dev',
  storageBucket: 'memory-weaver-dev.firebasestorage.app',
  messagingSenderId: '98973313245',
  appId: '1:98973313245:web:bbe45fb78d08d0563c1334',
};

const app = getApps().length ? getApps()[0] : initializeApp(stagingConfig, 'qa-resolution-recorder');
const db = getFirestore(app);

export async function recordQaResolution(itemId: string, resolution: string, resolvedBy = 'Chat 2 (The Flash Executor)', commitSha = 'b1fd5c9c') {
  const itemRef = doc(db, 'qa_suites', 'active_deck', 'items', itemId);
  await setDoc(
    itemRef,
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

const RESOLUTION_55_4 = `1. [Why "The Brass Spice Tin" was missing]: The canonical curriculum (src/lib/curriculum/masterStoryStructure.ts) designates Part I Scene 2 as "The House I Grew Up In". "The Brass Spice Tin" was a legacy draft placeholder from early prototype copy that was never in the production curriculum.
2. [Why "1956" appeared]: Two factors: (a) aiWeaver.ts contained a legacy few-shot prompt with "In 1956..." and a mandatory year extrapolation rule, causing the LLM to hallucinate 1956 on minimal user input ("test modifications"); (b) the shared staging memory (ey96djU6qR1BrDGnvZwp) had a pre-existing take from an earlier test run containing 1956. Fixed via GOV-MW-162 Truth Shield and patched Firestore doc.
3. [Why it wasn't flagged up]: Checklist authoring lacked an automated cross-validation linter between checklist text and canonical curriculum schemas. Fixed via 'npm run qa:validate'.
4. [Sandbox Solution]: Implemented GOV-MW-163 (qaFixtureSeeder.ts). Tests now mount isolated fixtures (qa_fixture_\${uid}_55.4) via ?qa_seed=55.4, preventing contamination of shared staging memories, with dual-key cleanup protection.`;

if (require.main === module) {
  recordQaResolution('55.4', RESOLUTION_55_4)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to record resolution:', err);
      process.exit(1);
    });
}
