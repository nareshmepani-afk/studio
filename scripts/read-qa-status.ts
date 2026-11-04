import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const stagingConfig = {
  apiKey: 'AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98',
  authDomain: 'memory-weaver-dev.firebaseapp.com',
  projectId: 'memory-weaver-dev',
  storageBucket: 'memory-weaver-dev.firebasestorage.app',
  messagingSenderId: '98973313245',
  appId: '1:98973313245:web:bbe45fb78d08d0563c1334',
};

const app = getApps().length ? getApps()[0] : initializeApp(stagingConfig, 'qa-status-reader');
const db = getFirestore(app);

const COLLECTION_PATH = 'qa_suites/active_deck/items';

export async function readQaStatus() {
  const snapshot = await getDocs(collection(db, COLLECTION_PATH));
  const items: any[] = [];
  snapshot.forEach((d) => items.push(d.data()));

  const total = items.length;
  const pass = items.filter((i) => i.verdict === 'PASS').length;
  const fail = items.filter((i) => i.verdict === 'FAIL').length;
  const retest = items.filter((i) => i.verdict === 'RETEST').length;
  const pending = total - (pass + fail + retest);

  const openInquiries = items.filter(
    (i) => (i.notes && i.notes.trim()) && !i.developerResolution
  );

  console.log(`\n📊 CLOUD QA STATUS [qa_suites/active_deck/items] (memory-weaver-dev)`);
  console.log(`Total: ${total} | PASS: ${pass} | FAIL: ${fail} | RETEST: ${retest} | PENDING: ${pending} | Open Inquiries: ${openInquiries.length}\n`);

  const actionables = items.filter(
    (i) => i.verdict === 'FAIL' || i.verdict === 'RETEST' || (i.notes && i.notes.trim() && !i.developerResolution)
  );

  if (actionables.length === 0) {
    console.log('🟢 ALL TESTED ITEMS PASSING & ZERO UNANSWERED INQUIRIES — Deck is in pristine state.');
    return;
  }

  console.log(`🚨 ACTIONABLE ITEMS REQUIRING ATTENTION (${actionables.length}):`);
  actionables.forEach((item) => {
    const isUnanswered = item.notes && !item.developerResolution;
    console.log(`\n──────────────────────────────────────────`);
    console.log(`[Item ${item.id}] ${item.title} -> ${item.verdict}${isUnanswered ? ' (❓ UNANSWERED INQUIRY)' : ''}`);
    console.log(`Route:       ${item.targetRoute}`);
    if (item.notes) console.log(`Notes:       ${item.notes}`);
    if (item.developerResolution) console.log(`Resolution:  ${item.developerResolution}`);
    if (item.telemetryTrace) console.log(`Telemetry:   ${item.telemetryTrace}`);
    if (item.screenshots?.length) console.log(`Screenshots: ${item.screenshots.join('\n             ')}`);
  });
  console.log(`──────────────────────────────────────────\n`);
  console.log(`💡 Run 'npm run qa:inquiries' to inspect the full Q&A Ledger.\n`);
}

if (require.main === module) {
  readQaStatus()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to read QA status:', err);
      process.exit(1);
    });
}
