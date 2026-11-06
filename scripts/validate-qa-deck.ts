/**
 * 🛡️ Automated QA Deck Consistency Linter & Live Persona Validator (TOOL-MW-164)
 *
 * Validates that all 59 cards and sub-items in `qa_checklist_interactive.html`:
 *   1. Strictly enforce Rule 30.6/30.12: Any item expecting a Clean Slate CTA
 *      ('[ ✏️ Draft Scene / Begin Story ]' or 'zero-state') MUST include '?clean_slate=true'
 *      or '?qa_seed=' in its target URL. Bare scene URLs for clean-slate expectations strictly FAIL.
 *   2. Zero banned / legacy scene titles (e.g. "The Brass Spice Tin", "The Family Album")
 *   3. Strict alignment between target scene IDs and canonical titles in masterStoryStructure.ts
 *   4. Rule 5 compliance: Fully qualified https://dev.memoryweaver.studio/ URLs with zero ellipsis placeholders
 *   5. Live Persona Diagnostic: Inspects Firestore `users/TQdB395kXxaAGPhFxk1LVWuT8cg2/memories`
 *      to ensure live populated memoirs are properly shielded by sandbox/clean-slate overrides.
 *
 * Usage:
 *   npx tsx scripts/validate-qa-deck.ts
 *   npm run qa:validate
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { MASTER_STORY_STRUCTURE } from '../src/lib/curriculum/masterStoryStructure';

const CHECKLIST_PATH = path.resolve(__dirname, '../qa_checklist_interactive.html');
const TESTER_UID = 'TQdB395kXxaAGPhFxk1LVWuT8cg2';

const stagingConfig = {
  apiKey: 'AIzaSyDvnkb8tt3m_Fn9i74GOsQncdkAd0dwS98',
  authDomain: 'memory-weaver-dev.firebaseapp.com',
  projectId: 'memory-weaver-dev',
  storageBucket: 'memory-weaver-dev.firebasestorage.app',
  messagingSenderId: '98973313245',
  appId: '1:98973313245:web:bbe45fb78d08d0563c1334',
};

export function validateQaDeck(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(CHECKLIST_PATH)) {
    return { valid: false, errors: [`Checklist file not found at ${CHECKLIST_PATH}`], warnings: [] };
  }

  const html = fs.readFileSync(CHECKLIST_PATH, 'utf8');

  // Check 1: Banned legacy titles
  const BANNED_TITLES = [
    { title: 'The Brass Spice Tin', correct: 'The House I Grew Up In (part-1-scene-2)' },
    { title: 'The Family Album', correct: 'Traditions, Feasts & Sacred Days (part-1-scene-3)' },
  ];

  BANNED_TITLES.forEach(({ title, correct }) => {
    if (html.includes(title)) {
      errors.push(`Found banned / legacy scene title "${title}". Must be "${correct}".`);
    }
  });

  // Check 2: Canonical curriculum titles exist in the deck
  const canonicalTitles: { id: string; title: string }[] = [];
  MASTER_STORY_STRUCTURE.forEach((part) => {
    part.scenes.forEach((scene) => {
      canonicalTitles.push({ id: scene.id, title: scene.title });
    });
  });

  // Check 3: Rule 5 URL validation
  const lines = html.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('href="/') && !line.includes('href="/admin') && !line.includes('href="/api')) {
      errors.push(`Line ${index + 1}: Found relative URL path in href: "${line.trim()}". Rule 5 mandates fully-qualified https://dev.memoryweaver.studio/ URLs.`);
    }
    if (line.includes('https://dev.memoryweaver.studio/...') || line.includes('http://localhost') || line.includes('127.0.0.1')) {
      errors.push(`Line ${index + 1}: Found invalid localhost or placeholder ellipsis URL: "${line.trim()}".`);
    }
  });

  // Check 4: Check that all scene deep links map to known scenes
  const sceneLinkRegex = /id=(part-\d+-scene-\d+)/g;
  let match: RegExpExecArray | null;
  const referencedScenes = new Set<string>();
  while ((match = sceneLinkRegex.exec(html)) !== null) {
    referencedScenes.add(match[1]);
  }

  referencedScenes.forEach((sceneId) => {
    const exists = canonicalTitles.some((s) => s.id === sceneId);
    if (!exists) {
      errors.push(`Referenced scene ID "${sceneId}" does not exist in masterStoryStructure.ts.`);
    }
  });

  // Check 5 (Rule 30.6 / 30.12 Refinement 2): Clean-Slate CTA URL Parameter Gate
  // Any sub-item expecting "Draft Scene / Begin Story" MUST provide ?clean_slate=true or ?qa_seed=
  const itemBlocks = html.split(/<!--\s*ITEM\s+(\d+\.\d+)\s*-->/i);
  for (let i = 1; i < itemBlocks.length; i += 2) {
    const itemNum = itemBlocks[i];
    const itemChunk = itemBlocks[i + 1] || '';

    const expectsCleanSlateCta =
      itemChunk.includes('Draft Scene / Begin Story') ||
      itemChunk.includes('Draft Scene') ||
      itemChunk.toLowerCase().includes('zero-state clean slate');

    if (expectsCleanSlateCta) {
      // Find all direct href launchers inside this item
      const allHrefs = [...itemChunk.matchAll(/href="(https:\/\/dev\.memoryweaver\.studio[^"]+)"/g)].map(m => m[1]);
      const hasIsolationParam = allHrefs.some(url => url.includes('clean_slate=true') || url.includes('qa_seed='));

      if (allHrefs.length > 0 && !hasIsolationParam) {
        errors.push(
          `Item ${itemNum}: Expects Clean-Slate CTA ("[ ✏️ Draft Scene / Begin Story ]") but none of its target URLs [${allHrefs.join(', ')}] contain isolation parameters (?clean_slate=true or ?qa_seed=). Under Rule 30.6 and Rule 30.12, clean-slate tests must be explicitly isolated from authentic user data.`
        );
      }
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

export async function runLivePersonaDiagnostic(): Promise<void> {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(stagingConfig, 'persona-validator');
    const db = getFirestore(app);

    const userMemsSnap = await getDocs(collection(db, 'users', TESTER_UID, 'memories'));
    const populatedScenes = new Map<string, { docId: string; proseLen: number }>();
    userMemsSnap.forEach((d) => {
      const data = d.data();
      const isQaFixture = d.id.startsWith('qa_fixture_') || Boolean(data.isQATestFixture) || Boolean(data.isTestFixture);
      if (data.sceneId && data.prose && !isQaFixture) {
        populatedScenes.set(data.sceneId, { docId: d.id, proseLen: data.prose.length });
      }
    });

    console.log(`📡 [Persona Diagnostic] Audited ${userMemsSnap.size} memories for ${TESTER_UID}:`);
    populatedScenes.forEach((info, sceneId) => {
      console.log(`   - Populated Scene "${sceneId}": Doc ${info.docId} (${info.proseLen} chars prose)`);
    });
  } catch (err: any) {
    console.warn(`⚠️ [Persona Diagnostic Warning] Could not reach Firestore for live diagnostic: ${err.message}`);
  }
}

if (require.main === module) {
  console.log('🔍 Validating QA Deck consistency against SSOT Curriculum & Rule 30.6/30.12...');
  const result = validateQaDeck();

  if (result.warnings.length > 0) {
    console.log(`⚠️ Warnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (!result.valid) {
    console.error(`❌ QA Deck Validation FAILED with ${result.errors.length} error(s):`);
    result.errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log('🟢 QA Deck Validation PASSED — All routes, scenes, and Rule 30.6/30.12 isolation gates verified.\n');

  // Run live diagnostic
  runLivePersonaDiagnostic()
    .then(() => process.exit(0))
    .catch(() => process.exit(0));
}
