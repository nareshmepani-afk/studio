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

const app = getApps().length ? getApps()[0] : initializeApp(stagingConfig, 'qa-inquiries-reader');
const db = getFirestore(app);
const COLLECTION_PATH = 'qa_suites/active_deck/items';

export async function readQaInquiries() {
  const snapshot = await getDocs(collection(db, COLLECTION_PATH));
  const items: any[] = [];
  snapshot.forEach((d) => items.push(d.data()));

  const withInquiries = items.filter(
    (i) => (i.notes && i.notes.trim()) || i.testerInquiry || i.developerResolution
  );

  console.log(`\n💬 CLOUD QA INQUIRY & RESOLUTION LEDGER (memory-weaver-dev)`);
  console.log(`Total Deck Items: ${items.length} | Items with Inquiries/Notes: ${withInquiries.length}\n`);

  if (withInquiries.length === 0) {
    console.log('🟢 Zero items with open inquiries or notes.');
    return;
  }

  withInquiries.forEach((item) => {
    const isResolved = item.resolutionStatus === 'RESOLVED' || item.developerResolution;
    const statusIcon = isResolved ? '✅ RESOLVED' : '❓ OPEN INQUIRY';
    console.log(`────────────────────────────────────────────────────────────`);
    console.log(`[Item ${item.id}] ${item.title} -> [${item.verdict}] | ${statusIcon}`);
    console.log(`Tester Notes / Question:\n${item.notes || item.testerInquiry}`);
    if (item.developerResolution) {
      console.log(`\nEngineering Resolution (${item.resolvedCommit || 'Active Edge'}):`);
      console.log(item.developerResolution);
    } else {
      console.log(`\n⚠️ NO FORMAL RESOLUTION RECORDED YET`);
    }
  });
  console.log(`────────────────────────────────────────────────────────────\n`);
}

if (require.main === module) {
  readQaInquiries()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to read QA inquiries:', err);
      process.exit(1);
    });
}
