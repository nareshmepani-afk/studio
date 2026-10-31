import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local' });

const rawSa = process.env.SERVICE_ACCOUNT_JSON;
if (!rawSa) {
  console.error('❌ SERVICE_ACCOUNT_JSON missing in .env.local');
  process.exit(1);
}

const serviceAccount = JSON.parse(rawSa);
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const COLLECTION_PATH = 'qa_suites/active_deck/items';

export async function readQaStatus() {
  const snapshot = await db.collection(COLLECTION_PATH).get();
  const items: any[] = [];
  snapshot.forEach((d) => items.push(d.data()));

  const total = items.length;
  const pass = items.filter((i) => i.verdict === 'PASS').length;
  const fail = items.filter((i) => i.verdict === 'FAIL').length;
  const retest = items.filter((i) => i.verdict === 'RETEST').length;
  const pending = total - (pass + fail + retest);

  console.log(`\n📊 CLOUD QA STATUS [qa_suites/active_deck/items]`);
  console.log(`Total: ${total} | PASS: ${pass} | FAIL: ${fail} | RETEST: ${retest} | PENDING: ${pending}\n`);

  const actionables = items.filter((i) => i.verdict === 'FAIL' || i.verdict === 'RETEST');
  if (actionables.length === 0) {
    console.log('🟢 ALL TESTED ITEMS PASSING — Zero failed or re-test cards in Cloud Firestore.');
    return;
  }

  console.log(`🚨 ACTIONABLE ITEMS REQUIRING ATTENTION (${actionables.length}):`);
  actionables.forEach((item) => {
    console.log(`\n──────────────────────────────────────────`);
    console.log(`[Item ${item.id}] ${item.title} -> ${item.verdict}`);
    console.log(`Route:       ${item.targetRoute}`);
    if (item.notes) console.log(`Notes:       ${item.notes}`);
    if (item.telemetryTrace) console.log(`Telemetry:   ${item.telemetryTrace}`);
    if (item.screenshots?.length) console.log(`Screenshots: ${item.screenshots.join('\n             ')}`);
  });
  console.log(`──────────────────────────────────────────\n`);
}

if (require.main === module) {
  readQaStatus().catch((err) => {
    console.error('❌ Failed to read QA status:', err);
    process.exit(1);
  });
}
