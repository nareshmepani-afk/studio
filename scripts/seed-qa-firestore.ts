import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDocs, collection, writeBatch } from 'firebase/firestore';

const stagingConfig = {
  apiKey: 'AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98',
  authDomain: 'memory-weaver-dev.firebaseapp.com',
  projectId: 'memory-weaver-dev',
  storageBucket: 'memory-weaver-dev.firebasestorage.app',
  messagingSenderId: '98973313245',
  appId: '1:98973313245:web:bbe45fb78d08d0563c1334',
};

const app = getApps().length ? getApps()[0] : initializeApp(stagingConfig);
const db = getFirestore(app);

const COLLECTION_PATH = 'qa_suites/active_deck/items';

function decodeHtml(str: string) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&bull;/g, '•')
    .replace(/&rarr;/g, '→')
    .replace(/&#39;/g, "'");
}

export async function seedQaFirestore() {
  const htmlPath = path.resolve(process.cwd(), 'qa_checklist_interactive.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  // Card 55 updated to 6 items (GOV-MW-163)
  const cardItemCounts: Record<number, number> = { 53: 10, 54: 5, 55: 6, 56: 5, 57: 5, 58: 5, 59: 5 };

  console.log('📖 Fetching existing docs from memory-weaver-dev to ensure idempotency...');
  const snap = await getDocs(collection(db, COLLECTION_PATH));
  const existingMap = new Map<string, any>();
  snap.forEach((d) => existingMap.set(d.id, d.data()));
  console.log(`Found ${existingMap.size} existing items on memory-weaver-dev.`);

  const batch = writeBatch(db);
  let created = 0;
  let preserved = 0;

  for (let cardNum = 1; cardNum <= 59; cardNum++) {
    const nextCardStr = cardNum < 59 ? `id="card-${cardNum + 1}"` : '<!-- END OF CARDS -->';
    const cMatch = html.match(new RegExp(`id="card-${cardNum}"[\\s\\S]*?(?=${nextCardStr}|$)`));
    if (!cMatch) continue;
    const cardChunk = cMatch[0];

    // Card title
    const titleMatch = cardChunk.match(/<h2 class="text-sm font-bold text-white[^"]*">([^<]+)<\/h2>/) ||
                       cardChunk.match(/<h3 class="text-sm font-bold text-white[^"]*">([^<]+)<\/h3>/) ||
                       cardChunk.match(/Test\s+\d+:\s+([^<]+)/);
    const cardTitle = decodeHtml(titleMatch ? titleMatch[1].trim() : `Test ${cardNum}`);

    // Route
    const routeMatch = cardChunk.match(/href="(https:\/\/dev\.memoryweaver\.studio[^"]+)"/);
    const cardRoute = routeMatch ? routeMatch[1] : 'https://dev.memoryweaver.studio/studio';

    const count = cardItemCounts[cardNum] || 1;
    if (count === 1) {
      const itemId = String(cardNum);
      const existing = existingMap.get(itemId);
      if (existing) {
        // Strict metadata-only merge: update targetRoute and title, preserving verdicts/notes/traces/screenshots
        const itemRef = doc(db, 'qa_suites', 'active_deck', 'items', itemId);
        batch.set(itemRef, {
          title: cardTitle,
          targetRoute: cardRoute,
          steps: [`Execute staging verification against ${cardRoute}`],
        }, { merge: true });
        preserved++;
      } else {
        const itemRef = doc(db, 'qa_suites', 'active_deck', 'items', itemId);
        batch.set(itemRef, {
          id: itemId,
          cardNumber: cardNum,
          title: cardTitle,
          steps: [`Execute staging verification against ${cardRoute}`],
          targetRoute: cardRoute,
          verdict: cardNum <= 10 ? 'PASS' : 'PENDING',
          notes: '',
          telemetryTrace: '',
          screenshots: [],
          updatedAt: Date.now(),
          updatedBy: 'system:seed'
        });
        created++;
      }
    } else {
      for (let sub = 1; sub <= count; sub++) {
        const itemId = `${cardNum}.${sub}`;
        const existing = existingMap.get(itemId);

        const itemBlockMatch = cardChunk.match(new RegExp(`Item\\s+${cardNum}\\.${sub}[\\s\\S]*?(?=Item\\s+${cardNum}\\.${sub + 1}|$)`));
        let itemTitle = `Item ${itemId}: Verification Item`;
        let itemRoute = cardRoute;

        if (itemBlockMatch) {
          const tMatch = itemBlockMatch[0].match(/<span class="text-xs font-bold text-white">([^<]+)<\/span>/);
          if (tMatch) itemTitle = decodeHtml(tMatch[1].trim());

          const rMatch = itemBlockMatch[0].match(/href="(https:\/\/dev\.memoryweaver\.studio[^"]+)"/);
          if (rMatch) itemRoute = rMatch[1];
        }

        if (existing) {
          // Strict metadata-only merge: strictly preserve verdict, notes, telemetryTrace, and screenshots
          const itemRef = doc(db, 'qa_suites', 'active_deck', 'items', itemId);
          batch.set(itemRef, {
            title: itemTitle,
            targetRoute: itemRoute,
            steps: [`Execute staging verification against ${itemRoute}`],
            testerPersona: {
              testerEmail: 'nareshmepani@hotmail.com',
              testerUid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
            },
          }, { merge: true });
          preserved++;
          continue;
        }

        let verdict = 'PENDING';
        if (['56.1', '56.2', '56.3', '56.4', '56.5'].includes(itemId)) verdict = 'PASS';
        if (cardNum === 57 || cardNum === 58) verdict = 'PASS';
        if (itemId === '59.5') verdict = 'PASS';

        const itemRef = doc(db, 'qa_suites', 'active_deck', 'items', itemId);
        batch.set(itemRef, {
          id: itemId,
          cardNumber: cardNum,
          title: itemTitle,
          steps: [`Execute staging verification against ${itemRoute}`],
          targetRoute: itemRoute,
          testerPersona: {
            testerEmail: 'nareshmepani@hotmail.com',
            testerUid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
          },
          verdict,
          notes: '',
          telemetryTrace: '',
          screenshots: [],
          updatedAt: Date.now(),
          updatedBy: 'system:seed'
        });
        created++;
      }

      // Ensure parent card document exists for cards with sub-items
      const parentId = String(cardNum);
      const parentRef = doc(db, 'qa_suites', 'active_deck', 'items', parentId);
      if (existingMap.has(parentId)) {
        batch.set(parentRef, {
          title: cardTitle,
          targetRoute: cardRoute,
          steps: [`Execute staging verification against ${cardRoute}`],
        }, { merge: true });
      } else {
        batch.set(parentRef, {
          id: parentId,
          cardNumber: cardNum,
          title: cardTitle,
          steps: [`Execute staging verification against ${cardRoute}`],
          targetRoute: cardRoute,
          verdict: (cardNum === 57 || cardNum === 58) ? 'PASS' : 'PENDING',
          notes: '',
          telemetryTrace: '',
          screenshots: [],
          updatedAt: Date.now(),
          updatedBy: 'system:seed'
        });
        created++;
      }
    }
  }

  if (created > 0 || preserved > 0) {
    console.log(`Committing batch (${created} new items, ${preserved} preserved items merged)...`);
    await batch.commit();
  }
  console.log(`✅ Seed Complete: Created ${created} new items, Preserved & Merged ${preserved} existing cloud items without overwriting verdicts, notes, traces, or screenshots.`);
  process.exit(0);
}

if (require.main === module) {
  seedQaFirestore().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
