#!/usr/bin/env node

/**
 * NotebookLM Vault Sync Manifest Utility
 * 
 * Maps codebase documents across C:\Users\home\studio to their authoritative
 * NotebookLM departmental vaults and identifies files modified in the working tree
 * or recent commits ready for ingestion into NotebookLM.
 * 
 * Usage:
 *   node scripts/syncVaultManifest.mjs
 *   node scripts/syncVaultManifest.mjs --all
 *   node scripts/syncVaultManifest.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Command line arguments
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const outputJson = args.includes('--json');

// Departmental NotebookLM Vault Mappings
const VAULT_DEFINITIONS = [
  {
    name: 'Executive Board & Architecture Vault',
    icon: '🏛️',
    description: 'Financial models, pricing, sprint roadmaps, ADRs, commercial thesis',
    patterns: [
      'docs/MW-86_ACT_V_SPEC.md',
      'docs/AGENT_ARCHITECTURE_ROADMAP.md',
      'docs/blueprint.md',
      'docs/STATE_SYNC.md',
      'docs/living-manifest.md',
      'MISSION_LOG.md',
      '.agents/AGENTS.md',
      '.agents/ROUTING_MATRIX.md',
      '.agents/chat_0_dispatch_brain_system_prompt.md',
      '.agents/MODEL_SELECTION_GUIDE.md',
      '.agents/STUDIO_CONTROL_REGISTRY.md'
    ]
  },
  {
    name: 'Legal, Regulatory & SCA Vault',
    icon: '⚖️',
    description: 'Section 6 terms, UK Consumer Rights, Stripe SCA, GDPR, privacy policies',
    patterns: [
      'src/app/legal/terms/page.tsx',
      'src/app/legal/privacy/page.tsx',
      'src/app/legal/cookies/page.tsx',
      'src/app/legal/LegalLayoutContent.tsx',
      'firestore.rules'
    ]
  },
  {
    name: 'Storytelling, Indic Dialects & Prompts Vault',
    icon: '🎧',
    description: 'Indic dedications (Gujarati/Punjabi/Hindi), Web Audio SFX, prompt sparks',
    patterns: [
      'src/config/businessRules.ts',
      'src/lib/dedicationMuse.ts',
      'src/lib/audio/unboxingAudio.ts'
    ]
  },
  {
    name: 'QA, Invariants & Verification Vault',
    icon: '🛡️',
    description: 'Vitest invariant test suites, Playwright E2E probes, QA verification checklists',
    patterns: [
      'qa_checklist_interactive.html',
      'scripts/generate_qa_checklist.js',
      'src/test/setup.ts'
    ]
  },
  {
    name: 'Systems, Tech & Codebase Vault',
    icon: '📐',
    description: 'Next.js App Router, Cloud Run, App Hosting, APIs, components, build scripts',
    patterns: [
      'src/middleware.ts',
      'src/lib/missionLog.ts',
      'src/app/api/admin/mission-log/route.ts',
      'src/app/api/version/route.ts',
      'scripts/generateLivingDocs.js'
    ]
  }
];

// Helper to run git command safely
function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

// Get git status of working tree
function getGitWorkingStatus() {
  const statusOutput = runGit('git status --porcelain');
  const dirtyMap = new Map();
  if (!statusOutput) return dirtyMap;

  for (const line of statusOutput.split(/\r?\n/)) {
    if (!line || line.length < 4) continue;
    const statusCode = line.substring(0, 2).trim();
    const filePath = line.substring(3).trim().replace(/\\/g, '/');
    dirtyMap.set(filePath, statusCode);
  }
  return dirtyMap;
}

// Get recent git commits info for a file
function getGitFileCommitInfo(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const log = runGit(`git log -1 --format="%h|%cr|%s" -- "${normalized}"`);
  if (!log) return null;
  const [hash, timeAgo, subject] = log.split('|');
  return { hash, timeAgo, subject };
}

// Check whether a file changed in the HEAD commit
function isFileInHeadCommit(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const diffOutput = runGit(`git diff-tree --no-commit-id --name-only -r HEAD -- "${normalized}"`);
  return Boolean(diffOutput && diffOutput.trim());
}

// Main execution
function main() {
  const dirtyMap = getGitWorkingStatus();
  const resultsByVault = [];

  let totalFilesScanned = 0;
  let totalReadyForIngestion = 0;
  let totalDirtyInWorkingTree = 0;

  for (const vault of VAULT_DEFINITIONS) {
    const vaultFiles = [];

    for (const relPattern of vault.patterns) {
      const absPath = path.join(ROOT_DIR, relPattern);
      const normalizedRel = relPattern.replace(/\\/g, '/');

      if (!fs.existsSync(absPath)) {
        continue;
      }

      totalFilesScanned++;
      const stats = fs.statSync(absPath);
      const gitInfo = getGitFileCommitInfo(normalizedRel);
      const isDirty = dirtyMap.has(normalizedRel);
      const isRecentCommit = isFileInHeadCommit(normalizedRel);

      let syncStatus = 'UP_TO_DATE';
      let statusLabel = '⚪ Synced';

      if (isDirty) {
        syncStatus = 'DIRTY_WORKING_TREE';
        statusLabel = '🟡 Working Tree Modified';
        totalDirtyInWorkingTree++;
      } else if (isRecentCommit) {
        syncStatus = 'RECENTLY_COMMITTED';
        statusLabel = '🟢 Ready for Ingestion';
        totalReadyForIngestion++;
      }

      vaultFiles.push({
        relativePath: normalizedRel,
        absolutePath: absPath,
        sizeBytes: stats.size,
        modifiedTime: stats.mtime.toISOString(),
        lastCommitHash: gitInfo?.hash || 'untracked',
        lastCommitTime: gitInfo?.timeAgo || 'never',
        lastCommitSubject: gitInfo?.subject || 'N/A',
        syncStatus,
        statusLabel,
        isDirty,
        isRecentCommit
      });
    }

    resultsByVault.push({
      vaultName: vault.name,
      icon: vault.icon,
      description: vault.description,
      files: vaultFiles
    });
  }

  // Handle JSON output
  if (outputJson) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      workspaceRoot: ROOT_DIR,
      summary: {
        totalFilesScanned,
        totalReadyForIngestion,
        totalDirtyInWorkingTree
      },
      vaults: resultsByVault
    }, null, 2));
    return;
  }

  // Visual Terminal Output
  console.log('\n' + '='.repeat(80));
  console.log(' 🛰️  NOTEBOOKLM KNOWLEDGE VAULT SYNC MANIFEST');
  console.log('    Workspace Root: ' + ROOT_DIR);
  console.log('='.repeat(80) + '\n');

  for (const vault of resultsByVault) {
    console.log(`${vault.icon} \x1b[1m${vault.vaultName}\x1b[0m`);
    console.log(`   \x1b[90m${vault.description}\x1b[0m\n`);

    const filesToDisplay = showAll 
      ? vault.files 
      : vault.files.filter(f => f.syncStatus !== 'UP_TO_DATE' || vault.files.length <= 2);

    if (filesToDisplay.length === 0) {
      console.log('   \x1b[32m✔ All documents up to date with repository baseline.\x1b[0m\n');
      continue;
    }

    console.log('   ' + '-'.repeat(74));
    console.log(`   ${'Status'.padEnd(26)} ${'Relative Path'.padEnd(36)} ${'Commit / Modified'}`);
    console.log('   ' + '-'.repeat(74));

    for (const file of filesToDisplay) {
      let colorStatus = file.statusLabel;
      if (file.syncStatus === 'RECENTLY_COMMITTED') {
        colorStatus = `\x1b[32m${file.statusLabel}\x1b[0m`;
      } else if (file.syncStatus === 'DIRTY_WORKING_TREE') {
        colorStatus = `\x1b[33m${file.statusLabel}\x1b[0m`;
      } else {
        colorStatus = `\x1b[90m${file.statusLabel}\x1b[0m`;
      }

      const displayPath = file.relativePath.length > 34 
        ? '...' + file.relativePath.slice(-31) 
        : file.relativePath;

      const commitSnippet = file.lastCommitHash !== 'untracked' 
        ? `${file.lastCommitHash} (${file.lastCommitTime})` 
        : 'Untracked';

      console.log(`   ${colorStatus.padEnd(35)} ${displayPath.padEnd(36)} \x1b[90m${commitSnippet}\x1b[0m`);
    }
    console.log('\n');
  }

  console.log('='.repeat(80));
  console.log(` 📊 SUMMARY: Scanned ${totalFilesScanned} documents.`);
  if (totalReadyForIngestion > 0) {
    console.log(`    \x1b[32m🟢 ${totalReadyForIngestion} document(s) recently committed and READY for ingestion into NotebookLM.\x1b[0m`);
  }
  if (totalDirtyInWorkingTree > 0) {
    console.log(`    \x1b[33m🟡 ${totalDirtyInWorkingTree} document(s) have uncommitted working tree edits.\x1b[0m`);
  }
  if (totalReadyForIngestion === 0 && totalDirtyInWorkingTree === 0) {
    console.log('    \x1b[32m✔ All tracked documents are currently synchronised.\x1b[0m');
  }
  console.log('='.repeat(80));
  console.log(' 💡 To ingest into NotebookLM: Copy the marked file contents and add/update them');
  console.log('    in the corresponding departmental NotebookLM vault.');
  console.log('    Run with --all to inspect all tracked files regardless of status.');
  console.log('    Run with --json for automated telemetry ingestion.\n');
}

main();
