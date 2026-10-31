import fs from 'fs';
import path from 'path';
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

// Parse cards and sub-items from qa_checklist_interactive.html
export async function seedQaFirestore() {
  const htmlPath = path.resolve(process.cwd(), 'qa_checklist_interactive.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  console.log('📖 Parsing qa_checklist_interactive.html for 58 test cards...');

  // Extract initial default verdicts from HTML
  const defaultItemVerdicts: Record<string, string> = {
    '56.1': 'PASS',
    '56.2': 'PASS',
    '56.3': 'PASS',
  };
  for (let i = 1; i <= 5; i++) defaultItemVerdicts[`57.${i}`] = 'PASS';
  for (let i = 1; i <= 5; i++) defaultItemVerdicts[`58.${i}`] = 'PASS';

  // Card items count mapping
  const cardItemCounts: Record<number, number> = { 53: 10, 54: 5, 55: 5, 56: 5, 57: 5, 58: 5 };

  // Fetch existing cloud documents to enforce strict idempotency (Mandatory Guard 2)
  const existingSnap = await db.collection(COLLECTION_PATH).get();
  const existingMap = new Map<string, any>();
  existingSnap.forEach((doc) => existingMap.set(doc.id, doc.data()));

  const batch = db.batch();
  let createdCount = 0;
  let preservedCount = 0;

  for (let cardNum = 1; cardNum <= 58; cardNum++) {
    const itemCount = cardItemCounts[cardNum] || 1;
    const isSingleItemCard = itemCount === 1;

    for (let sub = 1; sub <= itemCount; sub++) {
      const itemId = isSingleItemCard ? String(cardNum) : `${cardNum}.${sub}`;
      const existing = existingMap.get(itemId);

      if (existing) {
        // IDEMPOTENCY GUARD: Cloud document exists. Preserve user verdicts, notes, and screenshots!
        preservedCount++;
        continue;
      }

      // Determine initial verdict
      let initialVerdict = 'PENDING';
      if (cardNum <= 10) initialVerdict = 'PASS';
      if (defaultItemVerdicts[itemId]) initialVerdict = defaultItemVerdicts[itemId];

      // Extract target route and title
      const routeRegex = new RegExp(`href="(https://dev\\.memoryweaver\\.studio[^"]+)"`, 'g');
      let targetRoute = 'https://dev.memoryweaver.studio/studio';
      const cardMatch = html.match(new RegExp(`id="card-${cardNum}"[\\s\\S]*?(?=id="card-${cardNum + 1}"|$)`));
      if (cardMatch) {
        const matches = [...cardMatch[0].matchAll(routeRegex)];
        if (matches.length > 0) targetRoute = matches[0][1];
      }

      const itemRef = db.collection(COLLECTION_PATH).doc(itemId);
      batch.set(itemRef, {
        id: itemId,
        cardNumber: cardNum,
        title: `Test ${itemId}: Verification Item`,
        steps: [`Execute staging test against ${targetRoute}`],
        targetRoute,
        verdict: initialVerdict,
        notes: '',
        telemetryTrace: '',
        screenshots: [],
        updatedAt: Date.now(),
        updatedBy: 'system:seed',
      });
      createdCount++;
    }
  }

  await batch.commit();
  console.log(`✅ Seed Complete: Created ${createdCount} new items, Preserved ${preservedCount} existing cloud items.`);
}

if (require.main === module) {
  seedQaFirestore().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
