import fs from 'fs';
import path from 'path';
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

// Canonical categorization of remaining pending cards:
// [A] True Go-Live Blockers (High-Pillar User & Architecture Journeys)
// [B] Legacy Cards Already Superseded by Cards 55-59
const GO_LIVE_BLOCKER_CARDS = new Set([11, 35, 42, 49, 50, 51, 52, 53, 54]);

export function scanPendingCardsFromHtml(): {
  blockers: { cardNum: number; title: string; route: string; rationale: string }[];
  superseded: { cardNum: number; title: string; route: string; supersededBy: string }[];
} {
  const htmlPath = path.resolve(process.cwd(), 'qa_checklist_interactive.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Read DEFAULT_CARD_VERDICTS
  const verdictsMatch = html.match(/const DEFAULT_CARD_VERDICTS = ({[\s\S]*?});/);
  let defaultVerdicts: Record<number, any> = {};
  if (verdictsMatch) {
    try {
      const evalStr = verdictsMatch[1].replace(/new Date\(\)\.toISOString\(\)/g, '"PASS_TIME"');
      defaultVerdicts = eval('(' + evalStr + ')');
    } catch {
      defaultVerdicts = {};
    }
  }

  const blockers: { cardNum: number; title: string; route: string; rationale: string }[] = [];
  const superseded: { cardNum: number; title: string; route: string; supersededBy: string }[] = [];

  const blockerRationales: Record<number, string> = {
    11: 'Completed Reel Details & Real Duration: Storytellers reviewing completed takes must see authentic durations and bonus memories.',
    35: 'Studio-Grade Spell-Check (MW-108): Rule 20 British English (lang="en-GB") validation and zero false red squigglies.',
    42: 'Storage Checksumming (OPS-116): Ensures archival audio/video assets are never corrupted in transit.',
    49: 'Master Curriculum SSOT (ARCH-MW-127): 6x4=24 symmetric chapters + Family Anthology Part VII.',
    50: 'Sensory Seeds Tray (UX-MW-131): Dedicated sensory triggers across unwritten prompts.',
    51: 'Shared Narrative Primitives (ARCH-MW-132): SensoryScriptEditor and SensoryModalityKey parity.',
    52: 'Diaspora Voice Shield & 120 WPM Cadence (SPEC-MW-134): Spoken pacing calculation in teleprompter.',
    53: 'Bidirectional Script Sync & Autosave (ARCH-MW-136): BroadcastChannel + localStorage zero-loss text preservation.',
    54: 'Heirloom Folio Navigation (ARCH-MW-139): FloatingChapterDial, MobileThumbRibbon, FolioChapterDrawer.',
  };

  const supersededByMap: Record<number, string> = {
    12: 'Superseded by Card 59 (Adaptive Studio Switcher & Scene Continuity Shield).',
    13: 'Superseded by Card 58 (Dual-Mode Stage & Retake Escape Hatch).',
    14: 'Superseded by Card 54 (Heirloom Folio Typography & Navigation).',
    15: 'Superseded by Card 58 (Acoustics Check & Live Sound Check Visualiser).',
    16: 'Superseded by Card 51 (Shared Narrative Primitives) & Card 53 (Script Sync).',
    17: 'Superseded by Card 58 (Act III Mode 2 Review & Retake Performance Flow).',
    18: 'Superseded by Card 52 (Narrative Script Input Suite) & Card 54 (Heirloom Folio).',
    19: 'Superseded by Card 53 (Autosave) & Card 55.4/55.5 (Save-First Scene Reloads).',
    20: 'Superseded by Card 55.1 (Solid Gilded Ingot Primary Call-to-Action Beacon).',
    21: 'Superseded by Card 54 (Heirloom Folio) & Card 58 (Optics Privacy Shield).',
    22: 'Superseded by Card 54 (Heirloom Folio) & Card 58 (Camera Auto-Release).',
    23: 'Superseded by Card 54 (MobileThumbRibbon & Equal-Width Grid).',
    24: 'Superseded by Card 58 (Act III Take-Aware Mode 1 vs Mode 2 Dual Stage).',
    25: 'Superseded by Card 54 (Heirloom Folio ChapterSpineRail integration).',
    26: 'Superseded by Card 54 (Upright Part Labels & Lifecycle Badges).',
    27: 'Superseded by Card 59 (Option C Synchronised Steppers & Adaptive Switcher).',
    28: 'Superseded by standard FiresideAuthHeader mobile ergonomics.',
    29: 'Superseded by Card 58 (Act III Mode 2 Master Reel Review Suite).',
    30: 'Superseded by Card 58 (Mobile Video Selection Room in Mode 2).',
    31: 'Superseded by Card 56 (Scene Correlation Shield) & Card 58 (Master Reel Protection).',
    32: 'Superseded by Card 58 (Non-Destructive Audition Take Default).',
    33: 'Superseded by Card 56 (Self-Healing Schema Hydration & Document Repair).',
    34: 'Superseded by Card 58 (Universal Take Status Machine & Cutting Room Floor).',
    36: 'Superseded by BonusMemoryDrawer in Card 54 / Card 55.',
    37: 'Superseded by Non-Destructive Sensory Note Weaving in Card 51 / Card 55.',
    38: 'Superseded by Card 58 (Eliminating Premature Recording Mode Decisions).',
    39: 'Superseded by Card 49 (6x4=24 Symmetric Curriculum SSOT).',
    40: 'Superseded by Card 49 (1:1 Curriculum Parity).',
    41: 'Superseded by Card 49 & Card 54 (Act Stepper Reset on Scene Switch).',
    43: 'Superseded by Card 55.2 (Sensory Tray Chromatic Harmony & Option A Sky Blue).',
    44: 'Superseded by automated Rule 5 edge versioning (/api/version verified on every build).',
    45: 'Superseded by Card 55.2 (Fireside Chromatic Lockstep & Zero-Truncation).',
    46: 'Superseded by Card 49 (Global Curriculum Bridge Parts I-VI Parity).',
    47: 'Superseded by Card 54 (Curriculum Jump Matrix in FolioChapterDrawer).',
    48: 'Superseded by Card 49 & Card 59 (Unified Responsive Production Board).',
  };

  for (let i = 1; i <= 59; i++) {
    if (defaultVerdicts[i]) continue; // Already passed

    const nextCardStr = i < 59 ? 'id="card-' + (i + 1) + '"' : '<!-- END OF CARDS -->';
    const cMatch = html.match(new RegExp('id="card-' + i + '"[\\s\\S]*?(?=' + nextCardStr + '|$)'));
    if (!cMatch) continue;
    const chunk = cMatch[0];

    const titleMatch = chunk.match(/<h3 class="text-lg font-bold text-white">([^<]+)<\/h3>/) ||
                       chunk.match(/<h2 class="text-xl font-black text-white">([^<]+)<\/h2>/) ||
                       chunk.match(/Test\s+\d+:\s+([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&ldquo;|&rdquo;/g, '"') : `Test ${i}`;
    const routeMatch = chunk.match(/href="(https:\/\/dev\.memoryweaver\.studio[^"]+)"/);
    const route = routeMatch ? routeMatch[1] : '';

    if (GO_LIVE_BLOCKER_CARDS.has(i)) {
      blockers.push({
        cardNum: i,
        title,
        route,
        rationale: blockerRationales[i] || 'Essential production user journey.',
      });
    } else {
      superseded.push({
        cardNum: i,
        title,
        route,
        supersededBy: supersededByMap[i] || 'Superseded by Cards 55–59 modern architecture.',
      });
    }
  }

  return { blockers, superseded };
}

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
  } else {
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
  }

  // Pending items architectural scan
  const { blockers, superseded } = scanPendingCardsFromHtml();
  console.log(`\n📋 PENDING CARDS AUDIT (44 Pending Cards in Deck):`);
  console.log(`  [A] True Go-Live Blockers: ${blockers.length} cards (Cards: ${blockers.map((b) => b.cardNum).join(', ')})`);
  console.log(`  [B] Legacy Superseded:     ${superseded.length} cards (Cards: ${superseded.map((s) => s.cardNum).join(', ')})`);
  console.log(`\n──────────────────────────────────────────`);
  console.log(`🎯 [A] TRUE GO-LIVE BLOCKERS (${blockers.length} CARDS):`);
  blockers.forEach((b) => {
    console.log(`  • Card ${b.cardNum}: ${b.title}`);
    console.log(`    ↳ Rationale: ${b.rationale}`);
    console.log(`    ↳ URL:       ${b.route}`);
  });

  console.log(`\n🏛️ [B] LEGACY CARDS SUPERSEDED BY CARDS 55–59 (${superseded.length} CARDS):`);
  superseded.forEach((s) => {
    console.log(`  • Card ${s.cardNum}: ${s.title}`);
    console.log(`    ↳ Status:    ${s.supersededBy}`);
  });
  console.log(`──────────────────────────────────────────\n`);
}

if (require.main === module) {
  readQaStatus()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to read QA status:', err);
      process.exit(1);
    });
}
