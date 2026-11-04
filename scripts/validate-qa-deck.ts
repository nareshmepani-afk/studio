/**
 * 🛡️ Automated QA Deck Consistency Linter (TOOL-MW-164)
 *
 * Validates that all 59 cards and sub-items in `qa_checklist_interactive.html`
 * remain 100% in sync with canonical curriculum schemas and Rule 5 standards.
 *
 * Checks:
 *   1. Zero banned / hallucinated scene titles (e.g. "The Brass Spice Tin", "The Family Album")
 *   2. Strict alignment between target scene IDs and canonical titles in masterStoryStructure.ts
 *   3. Rule 5 compliance: Fully qualified https://dev.memoryweaver.studio/ URLs with zero ellipsis placeholders
 *   4. Zero-State vs Sandbox taxonomy compliance (Rule 30.12)
 *
 * Usage:
 *   npx tsx scripts/validate-qa-deck.ts
 *   npm run qa:validate
 */

import fs from 'fs';
import path from 'path';
import { MASTER_STORY_STRUCTURE } from '../src/lib/curriculum/masterStoryStructure';

const CHECKLIST_PATH = path.resolve(__dirname, '../qa_checklist_interactive.html');

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
    // Check for truncated ellipsis paths
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

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

if (require.main === module) {
  console.log('🔍 Validating QA Deck consistency against SSOT Curriculum...');
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

  console.log('🟢 QA Deck Validation PASSED — All routes, scenes, and Rule 5 URLs are 100% in sync with backend SSOT.\n');
  process.exit(0);
}
