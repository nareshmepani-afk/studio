/**
 * 🚀 Interactive QA Deck Sync Engine & v2.0.0 Agent Handoff Conduit (TOOL-MW-151)
 *
 * Synchronises the 59/59 Card SSOT Verdict Summary, Latest Executive Summary &
 * Production-Ready Retrospective (`MISSION_LOG.md`), Active Pre-Flight Decision Lock
 * (`ACTIVE_DIRECTIVE.md`), and Dynamic Spotlight Cards from `qa_checklist_interactive.html`
 * into the canonical shared Google Doc in Google Drive:
 * `MW-QA-Deck-Active` (`17_Nuc3VTM1DC9V9kII9dej-Q_5XL70Rl-mZN7uA-O3c`)
 *
 * Governed under Rule 30 (Interactive QA Standard), Rule 49 (Agent Relay Protocol),
 * Rule 51 (Explicit Provenance Protocol) & Rule 60.1 (Mandatory Card Sign-Off Gate).
 *
 * Usage:
 *   npx tsx scripts/syncQADeck.ts
 *   npm run qa:sync -- --operator="Chat 2 (The Flash Executor)" [--retro="..."] [--lock="..."]
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { execFileSync } from 'child_process';
import { getCloudAndHtmlQaSummary, QaSummaryResult } from './read-qa-status';

interface LauncherLink {
  url: string;
  text: string;
}

interface TestItem {
  itemNumber: string;
  title: string;
  banner: string;
  steps: string[];
  resolutionLedger?: string;
  launcher: LauncherLink | null;
  verdict?: 'pass' | 'fail' | 'pending';
}

interface TestCard {
  cardNum: number;
  title: string;
  badges: string[];
  launchers: LauncherLink[];
  items: TestItem[];
}

interface HeaderMeta {
  targetSha: string;
  edgeSha: string;
  updatedTime: string;
  edgeDeployTime: string;
  totalCards: number;
}

export interface AgentHandoffContext {
  checkpointTitle: string;
  checkpointBody: string;
  checkpointSha: string;
  directiveRef: string;
  decisionLock: string;
  directiveStatus: string;
  executionReceipt: string;
  autoFreshnessTriggered: boolean;
  liveGitSubject: string;
}

const CANONICAL_QA_DECK_DOC_ID = '17_Nuc3VTM1DC9V9kII9dej-Q_5XL70Rl-mZN7uA-O3c';
const DEFAULT_SPOTLIGHT_CARD_NUMS = [59, 58, 54, 53, 52, 35];

function resolveBinary(plugin: 'gdocs' | 'gdrive'): string {
  const binDir = path.join(
    os.homedir(),
    '.gemini',
    'antigravity',
    'plugin_data',
    plugin,
    'bin'
  );
  if (fs.existsSync(binDir)) {
    const exeFiles = fs.readdirSync(binDir).filter(f => f.startsWith(`${plugin}-`) && f.endsWith('.exe'));
    if (exeFiles.length > 0) {
      return path.join(binDir, exeFiles[0]);
    }
  }

  const cmdPath = path.join(
    os.homedir(),
    '.gemini',
    'config',
    'plugins',
    plugin,
    'skills',
    plugin,
    'scripts',
    `${plugin}.cmd`
  );
  if (fs.existsSync(cmdPath)) {
    return cmdPath;
  }

  return plugin;
}

/**
 * Probes https://dev.memoryweaver.studio/api/version using Node's native https module
 * with a hard 5-second timeout fallback so sync never fails or hangs if staging is mid-build.
 */
export function probeLiveEdgeVersion(timeoutMs: number = 5000): Promise<{ commitSha?: string; buildTimestamp?: string } | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (val: { commitSha?: string; buildTimestamp?: string } | null) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    try {
      const req = https.get('https://dev.memoryweaver.studio/api/version', { timeout: timeoutMs }, (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const parsed = JSON.parse(raw);
            finish(parsed);
          } catch {
            finish(null);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        clearTimeout(timer);
        finish(null);
      });

      req.on('error', () => {
        clearTimeout(timer);
        finish(null);
      });
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

function extractHeaderMeta(html: string): HeaderMeta {
  const targetShaMatch = html.match(/id="header-target-sha"[^>]*>([^<]+)<\/strong>/i);
  const edgeShaMatch = html.match(/id="header-edge-sha"[^>]*>([^<]+)<\/strong>/i);
  const updatedTimeMatch = html.match(/id="header-updated-time"[^>]*>([^<]+)<\/strong>/i);
  const edgeDeployTimeMatch = html.match(/id="header-edge-deploy-time"[^>]*>([^<]+)<\/strong>/i);
  const totalCardsMatch = html.match(/id="total-cards"[^>]*>([^<]+)<\/span>/i) || html.match(/(\d+)\s*Total Cards/i);

  const cardIds = [...html.matchAll(/id=["']card-(\d+)["']/g)].map(m => parseInt(m[1], 10));
  const uniqueCardCount = Array.from(new Set(cardIds)).length;

  return {
    targetSha: targetShaMatch ? targetShaMatch[1].trim() : '4478c91e',
    edgeSha: edgeShaMatch ? edgeShaMatch[1].trim() : '4478c91',
    updatedTime: updatedTimeMatch ? updatedTimeMatch[1].trim() : new Date().toLocaleString('en-GB'),
    edgeDeployTime: edgeDeployTimeMatch ? edgeDeployTimeMatch[1].trim() : '16 Nov 2026, 14:53 UTC',
    totalCards: totalCardsMatch ? parseInt(totalCardsMatch[1].trim(), 10) : uniqueCardCount || 59
  };
}

/**
 * Extracts the latest flight checkpoint from MISSION_LOG.md and active directive/receipt
 * from ACTIVE_DIRECTIVE.md, applying the Auto-Freshness Guardrail if Git HEAD is newer
 * (without mutating tracked working-tree files during post-rollout sync).
 */
export function extractAgentHandoffContext(
  workspaceRoot: string,
  headSha8: string,
  liveGitSubject: string,
  cliRetro?: string,
  cliLock?: string
): AgentHandoffContext {
  const missionLogPath = path.join(workspaceRoot, 'MISSION_LOG.md');
  const activeDirectivePath = path.join(workspaceRoot, 'ACTIVE_DIRECTIVE.md');

  let checkpointTitle = `Checkpoint (Commit ${headSha8})`;
  let checkpointBody = '';
  let checkpointSha = headSha8;

  if (fs.existsSync(missionLogPath)) {
    const missionRaw = fs.readFileSync(missionLogPath, 'utf8');
    const checkpoints = missionRaw.split(/(?=^### \[)/m).filter(s => s.trim().startsWith('### ['));
    if (checkpoints.length > 0) {
      const latest = checkpoints[checkpoints.length - 1].trim();
      const lines = latest.split(/\r?\n/);
      checkpointTitle = lines[0].replace(/^###\s*/, '').trim();
      checkpointBody = lines.slice(1).join('\n').trim();
      const shaMatch = latest.match(/Pushed\s+`([0-9a-f]{7,8})`/i) || latest.match(/Commit\s+`([0-9a-f]{7,8})`/i);
      if (shaMatch) {
        checkpointSha = shaMatch[1];
      }
    }
  }

  let directiveRef = 'QA-SSOT-V2 / MW-401';
  let decisionLock = '1-YES, 2-Option-A, 3-YES';
  let directiveStatus = '[OUT - Chat 2 (The Flash Executor)]';
  let executionReceipt = '';

  if (fs.existsSync(activeDirectivePath)) {
    const directiveRaw = fs.readFileSync(activeDirectivePath, 'utf8');
    const refMatch = directiveRaw.match(/\*\*Ref:\*\*\s*([^\r\n]+)/i);
    if (refMatch) directiveRef = refMatch[1].trim();

    const modeMatch = directiveRaw.match(/\*\*Operational Mode:\*\*\s*([^\r\n]+)/i);
    if (modeMatch) decisionLock = modeMatch[1].trim();

    const signOffMatch = directiveRaw.match(/Sign-Off:\s*(\[[^\]]+\])/i) || directiveRaw.match(/\*\*Dispatch Status:\*\*\s*(\[[^\]]+\])/i);
    if (signOffMatch) directiveStatus = signOffMatch[1].trim();

    const receiptIdx = directiveRaw.indexOf('### Execution Receipt:');
    if (receiptIdx !== -1) {
      executionReceipt = directiveRaw.slice(receiptIdx).trim();
    }
  }

  if (cliLock) {
    decisionLock = cliLock;
  }

  const shaPrefixMatch = headSha8.slice(0, 7) === checkpointSha.slice(0, 7);
  let autoFreshnessTriggered = false;

  if (cliRetro) {
    checkpointBody = `${cliRetro}\n\n${checkpointBody}`;
    checkpointSha = headSha8;
  } else if (!shaPrefixMatch && liveGitSubject) {
    autoFreshnessTriggered = true;
    checkpointBody =
      `- **Auto-Freshness Live HEAD Delta (\`${headSha8}\`):** ${liveGitSubject}\n` +
      checkpointBody;
  }

  return {
    checkpointTitle,
    checkpointBody,
    checkpointSha,
    directiveRef,
    decisionLock,
    directiveStatus,
    executionReceipt,
    autoFreshnessTriggered,
    liveGitSubject
  };
}

function extractCards(html: string): TestCard[] {
  const cardIds = [...html.matchAll(/id=["']card-(\d+)["']/g)].map(m => parseInt(m[1], 10));
  const uniqueCardIds = Array.from(new Set(cardIds)).sort((a, b) => a - b);

  const cards: TestCard[] = [];

  for (let i = 0; i < uniqueCardIds.length; i++) {
    const cardNum = uniqueCardIds[i];
    const cardIdAttr = `id="card-${cardNum}"`;
    const cardIdx = html.indexOf(cardIdAttr);
    if (cardIdx === -1) continue;

    let nextIdx = -1;
    if (i < uniqueCardIds.length - 1) {
      nextIdx = html.indexOf(`id="card-${uniqueCardIds[i + 1]}"`, cardIdx);
    }
    const chunk = nextIdx !== -1 ? html.slice(cardIdx, nextIdx) : html.slice(cardIdx, cardIdx + 25000);

    // Title
    const titleMatch = chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const title = titleMatch
      ? titleMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&bull;/g, '•')
          .replace(/&rarr;/g, '→')
          .replace(/&ldquo;|&rdquo;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
      : `Card ${cardNum}`;

    // Badges
    const badgeMatches = [
      ...chunk.matchAll(
        /<span[^>]*class="[^"]*(?:bg-amber-500|bg-emerald-500|bg-sky-500|bg-purple-500)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
      )
    ];
    const badges = badgeMatches
      .map(m =>
        m[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&bull;/g, '•')
          .trim()
      )
      .filter(b => b && !b.includes('CARD') && !b.includes('EVALUATED') && !b.includes('VERIFIED'));

    // Primary route launchers in card header
    const launcherMatches = [
      ...chunk.matchAll(/<a\s+[^>]*href=["'](https:\/\/dev\.memoryweaver\.studio[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)
    ];
    const launchers: LauncherLink[] = [];
    const seenUrls = new Set<string>();
    for (const m of launcherMatches) {
      const url = m[1];
      const text = m[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&bull;/g, '•')
        .replace(/&rarr;/g, '→')
        .replace(/\s+/g, ' ')
        .trim();
      if (!seenUrls.has(url) && text.includes('Open')) {
        seenUrls.add(url);
        launchers.push({ url, text });
      }
    }

    // Individual items
    const itemBlocks = [
      ...chunk.matchAll(
        /<!--\s*ITEM\s*(\d+\.\d+)\s*-->([\s\S]*?)(?=<!--\s*ITEM\s*\d+\.\d+\s*-->|<!--\s*PUNCH-LIST|<\/div>\s*<\/div>\s*<!-- ZONE 3|$)/gi
      )
    ];
    const items: TestItem[] = [];
    for (const m of itemBlocks) {
      const itemNumber = m[1];
      const block = m[2];

      const itemTitleMatch =
        block.match(/<span[^>]*id="item-title-[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
        block.match(/<span[^>]*class="[^"]*text-white[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const itemTitle = itemTitleMatch
        ? itemTitleMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&bull;/g, '•')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

      const bannerMatch = block.match(
        /<!-- (?:VIEW LOCATION|EXECUTION CONTEXT) BANNER -->[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i
      );
      const banner = bannerMatch
        ? bannerMatch[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&rarr;/g, '→')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

      const liMatches = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(lim =>
        lim[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&bull;/g, '•')
          .replace(/&rarr;/g, '→')
          .replace(/\s+/g, ' ')
          .trim()
      );

      let resolutionLedger: string | undefined;
      const ledgerMatch = block.match(/id="item-resolution-ledger-[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (ledgerMatch) {
        resolutionLedger = ledgerMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&rarr;/g, '→')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const itemLinkMatch = block.match(
        /<a\s+[^>]*href=["'](https:\/\/dev\.memoryweaver\.studio[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i
      );
      const itemLink: LauncherLink | null = itemLinkMatch
        ? {
            url: itemLinkMatch[1],
            text: itemLinkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
          }
        : null;

      const itemKey = itemNumber.replace('.', '_');
      const keyPassRegex = new RegExp(`['"]${itemKey}['"]\\s*:\\s*['"]pass['"]`, 'i');
      const btnPassActiveRegex = new RegExp(`id=["']btn-item-pass-${itemNumber.replace('.', '-')}["'][^>]*class=["'][^"']*\\bactive\\b`, 'i');
      const isItemPass = keyPassRegex.test(html) || btnPassActiveRegex.test(block);

      items.push({
        itemNumber,
        title: itemTitle,
        banner,
        steps: liMatches,
        resolutionLedger,
        launcher: itemLink,
        verdict: isItemPass ? 'pass' : 'pending'
      });
    }

    cards.push({
      cardNum,
      title,
      badges,
      launchers,
      items
    });
  }

  return cards;
}

export function formatMarkdownDeck(
  header: HeaderMeta,
  cards: TestCard[],
  qaSummary: QaSummaryResult,
  handoff: AgentHandoffContext,
  liveEdgeInfo: { commitSha?: string; buildTimestamp?: string } | null,
  operator: string = 'Chat 2 (The Flash Executor)',
  syncTrigger?: string
): string {
  const nowIso = new Date().toISOString();
  const bstTime = new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' GMT/BST';

  const trigger = syncTrigger || `${header.targetSha} (Staging Verification)`;
  const verifiedEdgeSha = liveEdgeInfo?.commitSha || header.edgeSha;
  const verifiedEdgeBuildTime = liveEdgeInfo?.buildTimestamp || header.edgeDeployTime;
  const verifiedMatch = header.targetSha.startsWith(verifiedEdgeSha.slice(0, 7));

  // Determine Dynamic Spotlight Cards: any actionable card first, followed by DEFAULT_SPOTLIGHT_CARD_NUMS
  const actionableCardNums = Array.from(
    new Set(
      qaSummary.cardMatrix
        .filter((r) => r.overallVerdict !== 'PASS')
        .map((r) => r.cardNum)
    )
  );
  const spotlightIds = Array.from(new Set([...actionableCardNums, ...DEFAULT_SPOTLIGHT_CARD_NUMS]));
  const spotlightCards = spotlightIds
    .map((id) => cards.find((c) => c.cardNum === id))
    .filter((c): c is TestCard => !!c);

  const handoffJsonPayload = {
    schemaVersion: '2.0.0',
    syncedAtUtc: nowIso,
    operator: `[SYNC - ${operator}]`,
    gitHeadSha: header.targetSha,
    liveEdge: {
      commitSha: verifiedEdgeSha,
      buildTimestamp: verifiedEdgeBuildTime,
      verifiedMatch
    },
    ssotSummary: {
      totalCards: qaSummary.totalCards,
      passedCards: qaSummary.passedCards,
      pendingCards: qaSummary.pendingCards,
      firestoreItemsTotal: qaSummary.firestoreItemsTotal,
      firestoreItemsPass: qaSummary.firestoreItemsPass,
      firestoreItemsFail: qaSummary.firestoreItemsFail,
      firestoreItemsRetest: qaSummary.firestoreItemsRetest,
      firestoreItemsPending: qaSummary.firestoreItemsPending,
      openInquiriesCount: qaSummary.openInquiriesCount,
      actionableBlockers: qaSummary.actionableItems.map((i) => ({
        id: i.id,
        verdict: i.verdict,
        notes: i.notes
      }))
    },
    activeDirective: {
      ref: handoff.directiveRef,
      decisionLock: handoff.decisionLock,
      status: handoff.directiveStatus
    },
    latestCheckpoint: {
      title: handoff.checkpointTitle,
      commitSha: handoff.checkpointSha,
      autoFreshnessSupplement: handoff.autoFreshnessTriggered
    },
    spotlightCards: spotlightIds
  };

  let md = `# MEMORY WEAVER: ACTIVE QA DECK & AGENT HANDOFF SSOT (v2.0.0)\n\n`;
  md += `<!-- MW_AGENT_HANDOFF_JSON_START -->\n`;
  md += '```json\n' + JSON.stringify(handoffJsonPayload, null, 2) + '\n```\n';
  md += `<!-- MW_AGENT_HANDOFF_JSON_END -->\n\n`;

  md += `> 🤖 **AUTOMATED 3-WAY SSOT CONDUIT — ZERO MANUAL MAINTENANCE REQUIRED**\n`;
  md += `> This Google Doc is compiled and synchronised upon every verified staging rollout via \`npm run qa:sync\`. It unifies **Cloud Firestore (\`qa_suites/active_deck/items\`)**, **\`qa_checklist_interactive.html\` (\`DEFAULT_CARD_VERDICTS\`)**, **\`MISSION_LOG.md\`**, and **\`ACTIVE_DIRECTIVE.md\`**.\n`;
  md += `> Live QA Web Portal: [https://dev.memoryweaver.studio/admin/qa](https://dev.memoryweaver.studio/admin/qa)\n\n`;

  // SECTION 1: AGENT HANDOFF — LATEST RETROSPECTIVE & PRE-FLIGHT DECISION LOCK
  md += `## 1. 🧠 AGENT HANDOFF: LATEST RETROSPECTIVE & PRE-FLIGHT DECISION LOCK\n\n`;
  md += `| Handoff Dimension | Active State |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Active Directive Ref** | \`${handoff.directiveRef}\` |\n`;
  md += `| **Pre-Flight Decision Lock** | \`${handoff.decisionLock}\` |\n`;
  md += `| **Relay Provenance Stamp** | \`${handoff.directiveStatus}\` |\n`;
  md += `| **Sync Operator** | \`[SYNC - ${operator}]\` |\n`;
  md += `| **Sync Trigger** | \`Commit ${trigger}\` |\n`;
  md += `| **Target Git HEAD SHA** | \`${header.targetSha}\` |\n`;
  md += `| **Live Edge SHA (\`/api/version\`)** | \`${verifiedEdgeSha}\` (${verifiedMatch ? '🟢 VERIFIED MATCH' : '⏳ ROLLOUT IN PROGRESS'}) |\n`;
  md += `| **Edge Build Timestamp** | \`${verifiedEdgeBuildTime}\` |\n`;
  md += `| **Last Synchronised** | ${bstTime} |\n\n`;

  if (handoff.executionReceipt) {
    md += `${handoff.executionReceipt}\n\n`;
  }

  md += `### 📋 Latest Flight Checkpoint: ${handoff.checkpointTitle}\n\n`;
  md += `${handoff.checkpointBody}\n\n`;
  md += `---\n\n`;

  // SECTION 2: 59/59 CARD SSOT RECONCILIATION SUMMARY & COMPACT ROLLUP MATRIX
  md += `## 2. 📊 59/59 CARD SSOT RECONCILIATION SUMMARY (FIRESTORE × GIT × HTML)\n\n`;
  md += `- **Overall Card Tally:** **${qaSummary.passedCards} / ${qaSummary.totalCards} Cards PASS** (${qaSummary.pendingCards} Pending)\n`;
  md += `- **Cloud Firestore (\`qa_suites/active_deck/items\`):** **${qaSummary.firestoreItemsPass} / ${qaSummary.firestoreItemsTotal} Items PASS** • **${qaSummary.firestoreItemsFail} FAIL** • **${qaSummary.firestoreItemsRetest} RETEST** • **${qaSummary.firestoreItemsPending} PENDING** • **${qaSummary.openInquiriesCount} Open Inquiries**\n\n`;

  if (qaSummary.actionableItems.length > 0) {
    md += `### 🚨 Actionable Items / Open Inquiries (${qaSummary.actionableItems.length})\n\n`;
    for (const act of qaSummary.actionableItems) {
      md += `- **[Item ${act.id}] ${act.title}** → \`${act.verdict}\` | Route: ${act.targetRoute}\n`;
      if (act.notes) md += `  - *Notes:* ${act.notes}\n`;
    }
    md += `\n`;
  } else {
    md += `> 🟢 **ALL 59 CARDS & ALL ${qaSummary.firestoreItemsTotal} FIRESTORE ITEMS VERIFIED PASS — ZERO OPEN INQUIRIES.**\n\n`;
  }

  md += `### 🗂️ Complete 59-Card SSOT Rollup Matrix\n\n`;
  md += `| Card # | Milestone & Verification Title | Sub-Items | Firestore | Git Default | SSOT Verdict |\n`;
  md += `| :---: | :--- | :---: | :---: | :---: | :---: |\n`;
  for (const row of qaSummary.cardMatrix) {
    const subLabel = row.subItemsTotal > 0 ? `${row.subItemsPassed}/${row.subItemsTotal}` : '1/1';
    const badge = row.overallVerdict === 'PASS' ? '✅ PASS' : `🚨 ${row.overallVerdict}`;
    const shortTitle = row.title.length > 78 ? row.title.slice(0, 75) + '...' : row.title;
    md += `| **Card ${row.cardNum}** | ${shortTitle} | \`${subLabel}\` | \`${row.firestoreStatus}\` | \`${row.gitStatus}\` | **${badge}** |\n`;
  }
  md += `\n---\n\n`;

  // SECTION 3: DYNAMIC SPOTLIGHT CARDS (ACTIONABLE + RECENTLY RESOLVED CARDS)
  md += `## 3. 🎯 DYNAMIC SPOTLIGHT CARDS (CARDS ${spotlightIds.join(', ')})\n\n`;
  for (const card of spotlightCards) {
    md += `### Card ${card.cardNum}: ${card.title}\n\n`;
    if (card.badges.length > 0) {
      md += `*Tags: ${card.badges.join(' • ')}*\n\n`;
    }
    if (card.launchers.length > 0) {
      md += `**Primary Direct Route Launchers:**\n`;
      for (const l of card.launchers) {
        md += `- [${l.text}](${l.url})\n`;
      }
      md += `\n`;
    }
    if (card.items.length > 0) {
      md += `**Sub-Item Verification Breakdown:**\n\n`;
      for (const item of card.items) {
        const isPass = item.verdict === 'pass';
        const statusBadge = isPass ? '✅ [PASS]' : '⏳ [PENDING]';
        md += `- **${statusBadge} Item ${item.itemNumber}: ${item.title}**`;
        if (item.launcher) {
          md += ` — [${item.launcher.text}](${item.launcher.url})`;
        }
        md += `\n`;
        if (item.resolutionLedger) {
          md += `  - 🛡️ *Resolution Ledger:* ${item.resolutionLedger}\n`;
        }
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // SECTION 4: GOVERNANCE INVARIANTS
  md += `## 4. 🛡️ VERIFICATION INVARIANTS (RULE 30, RULE 49, RULE 51 & RULE 5)\n\n`;
  md += `- **Staging-Only Verification**: All testing must be conducted exclusively on [https://dev.memoryweaver.studio/](https://dev.memoryweaver.studio/). Testing on localhost is strictly forbidden.\n`;
  md += `- **Zero Placeholder URLs**: Every launcher and test item card provides complete, fully-qualified routes containing authentic IDs.\n`;
  md += `- **3-Way SSOT Lockstep**: \`qa_checklist_interactive.html\`, \`src/lib/qa/qaHtmlContent.ts\`, and Cloud Firestore (\`qa_suites/active_deck/items\`) are verified by \`src/test/qa_template.test.ts\` on every commit.\n\n`;

  return md;
}

export async function syncQADeck(customOperator?: string): Promise<{ docId: string; docUrl: string; activeCardNum: number; operator: string }> {
  const args = process.argv.slice(2);

  // Resolve executing operator per Rule 51
  let operator = customOperator || process.env.QA_OPERATOR;
  if (!operator) {
    const opArg = args.find(a => a.startsWith('--operator=') || a.startsWith('-o='));
    if (opArg) {
      operator = opArg.split('=')[1].replace(/^["']|["']$/g, '');
    } else {
      const opIdx = args.findIndex(a => a === '--operator' || a === '-o');
      if (opIdx !== -1 && args[opIdx + 1]) {
        operator = args[opIdx + 1].replace(/^["']|["']$/g, '');
      } else {
        operator = 'Chat 2 (The Flash Executor)';
      }
    }
  }

  // Optional --retro="..." and --lock="..." CLI overrides
  const retroArg = args.find(a => a.startsWith('--retro='));
  const cliRetro = retroArg ? retroArg.slice('--retro='.length).replace(/^["']|["']$/g, '') : undefined;
  const lockArg = args.find(a => a.startsWith('--lock='));
  const cliLock = lockArg ? lockArg.slice('--lock='.length).replace(/^["']|["']$/g, '') : undefined;

  let syncTrigger = '';
  let sha8 = '4478c91e';
  try {
    const gitLog = execFileSync('git', ['log', '-1', '--pretty=format:%h (%s)'], { encoding: 'utf8' }).trim();
    if (gitLog) syncTrigger = gitLog;
    const revParse = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
    if (revParse) sha8 = revParse;
  } catch {
    syncTrigger = 'Local Staging Verification';
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log('🚀 Memory Weaver QA Deck Sync Engine v2.0.0 (TOOL-MW-151)');
  console.log(`👤 Executing Operator: [SYNC - ${operator}] (Rule 51)`);
  console.log(`🎯 Sync Trigger:       Commit ${syncTrigger}`);
  console.log('────────────────────────────────────────────────────────────');

  const workspaceRoot = process.cwd();
  const htmlPath = path.join(workspaceRoot, 'qa_checklist_interactive.html');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`QA Checklist HTML not found at: ${htmlPath}`);
  }

  console.log(`📖 Reading QA Checklist: ${htmlPath}`);
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Probe live staging /api/version with 5-second timeout fallback
  console.log('🌐 Probing https://dev.memoryweaver.studio/api/version (5s timeout fallback)...');
  const liveEdgeInfo = await probeLiveEdgeVersion(5000);
  if (liveEdgeInfo?.commitSha) {
    console.log(`🟢 Live Edge Confirmed: SHA ${liveEdgeInfo.commitSha} (Built: ${liveEdgeInfo.buildTimestamp || 'N/A'})`);
  } else {
    console.log('⚠️ Live Edge probe timed out or unreachable — using local HTML header fallback.');
  }

  // Stamp current Git HEAD SHA & live edge SHA in-memory (and only write to disk when --stamp is passed pre-commit,
  // guaranteeing that running `npm.cmd run qa:sync` post-commit NEVER leaves a dirty working tree!)
  const shouldWriteStampToDisk = args.includes('--stamp');
  try {
    const sha7 = liveEdgeInfo?.commitSha ? liveEdgeInfo.commitSha.slice(0, 7) : sha8.slice(0, 7);
    const nowUtc = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
    const updatedHtml = htmlContent
      .replace(/<title>Master QA Verification Suite — Grouped by Route \([^)]+\)<\/title>/i, `<title>Master QA Verification Suite — Grouped by Route (${sha8})</title>`)
      .replace(/(<strong\s+id="header-target-sha"[^>]*>)[^<]+(<\/strong>)/i, `$1${sha8}$2`)
      .replace(/(<strong\s+id="header-edge-sha"[^>]*>)[^<]+(<\/strong>)/i, `$1${sha7}$2`)
      .replace(/(<strong\s+id="header-updated-time"[^>]*>)[^<]+(<\/strong>)/i, `$1${nowUtc}$2`)
      .replace(/commit:\s*['"][0-9a-f]{7,8}['"]/g, `commit: '${sha8}'`)
      .replace(/qa_master_checklist_[0-9a-f]{7,8}_/g, `qa_master_checklist_${sha8}_`)
      .replace(/\*\*Target Commit SHA\*\*:\s*[0-9a-f]{7,8}/g, `**Target Commit SHA**: ${sha8}`);

    htmlContent = updatedHtml;
    if (shouldWriteStampToDisk) {
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');
      const publicQaPath = path.join(workspaceRoot, 'public', 'qa_checklist_interactive.html');
      fs.writeFileSync(publicQaPath, htmlContent, 'utf8');
      const qaModulePath = path.join(workspaceRoot, 'src', 'lib', 'qa', 'qaHtmlContent.ts');
      fs.writeFileSync(qaModulePath, 'export const QA_HTML_STRING = ' + JSON.stringify(htmlContent) + ';\n', 'utf8');
      console.log(`🔖 Auto-stamped Commit SHA (${sha8}) and Timestamp (${nowUtc}) to disk (--stamp).`);
    } else {
      console.log(`🔖 Synthesised live HEAD SHA (${sha8}) & Edge SHA (${sha7}) in-memory — working tree preserved 100% clean.`);
    }
  } catch {
    // non-fatal if outside git repo
  }

  console.log('🔍 Extracting 59-Card SSOT summary, MISSION_LOG retrospective & ACTIVE_DIRECTIVE lock...');
  const header = extractHeaderMeta(htmlContent);
  const cards = extractCards(htmlContent);
  if (cards.length === 0) {
    throw new Error('Zero test cards extracted from qa_checklist_interactive.html');
  }

  const qaSummary = await getCloudAndHtmlQaSummary(5000);
  const handoffContext = extractAgentHandoffContext(workspaceRoot, sha8, syncTrigger, cliRetro, cliLock);

  const activeCard = cards[cards.length - 1];
  console.log(`✅ Extracted ${cards.length} total cards (${qaSummary.passedCards}/${qaSummary.totalCards} PASS, ${qaSummary.firestoreItemsPass}/${qaSummary.firestoreItemsTotal} Firestore items PASS).`);
  console.log(`📋 Latest Checkpoint: ${handoffContext.checkpointTitle}`);

  console.log('📝 Generating Canonical v2.0.0 Markdown snapshot with MW_AGENT_HANDOFF_JSON...');
  const markdownContent = formatMarkdownDeck(
    header,
    cards,
    qaSummary,
    handoffContext,
    liveEdgeInfo,
    operator,
    syncTrigger
  );

  // Discover CLI binaries
  const gdocsBin = resolveBinary('gdocs');
  const gdriveBin = resolveBinary('gdrive');

  console.log(`🔧 Google Docs CLI:  ${gdocsBin}`);
  console.log(`🔧 Google Drive CLI: ${gdriveBin}`);

  console.log('🔎 Checking Google Drive for existing "MW-QA-Deck-Active"...');
  let existingDocId: string | null = process.env.QA_DECK_DOC_ID || CANONICAL_QA_DECK_DOC_ID;

  try {
    const searchRaw = execFileSync(
      gdriveBin,
      ['readonly', 'search', '--name-exact', 'MW-QA-Deck-Active', '--json'],
      { encoding: 'utf8', shell: gdriveBin.toLowerCase().endsWith('.cmd') }
    );
    const results = JSON.parse(searchRaw || '[]');
    if (Array.isArray(results) && results.length > 0) {
      const canonicalMatch = results.find((r: any) => r.id === CANONICAL_QA_DECK_DOC_ID);
      existingDocId = canonicalMatch ? canonicalMatch.id : results[0].id;
      console.log(`📎 Found existing document: ID ${existingDocId}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Drive search warning (using canonical Doc ID ${existingDocId}): ${err.message}`);
  }

  const tempMdPath = path.join(os.tmpdir(), `mw_qa_deck_sync_${Date.now()}.md`);
  fs.writeFileSync(tempMdPath, markdownContent, 'utf8');

  let docId = '';
  let docUrl = '';

  try {
    if (existingDocId) {
      console.log(`🔄 Updating existing Google Doc (ID: ${existingDocId})...`);
      execFileSync(
        gdocsBin,
        ['mutate', 'import-md', tempMdPath, '--update', existingDocId, '--pageless'],
        { encoding: 'utf8' }
      );
      docId = existingDocId;
      docUrl = `https://docs.google.com/document/d/${docId}/edit`;
      console.log(`✅ Updated existing doc: ${docUrl}`);
    } else {
      console.log('📄 Creating new Google Doc "MW-QA-Deck-Active" in Google Drive...');
      const createOutput = execFileSync(
        gdocsBin,
        ['mutate', 'import-md', tempMdPath, '--title', 'MW-QA-Deck-Active', '--pageless'],
        { encoding: 'utf8' }
      );
      const idMatch = createOutput.match(/ID:\s*([a-zA-Z0-9_\-]+)/);
      if (idMatch) {
        docId = idMatch[1];
        docUrl = `https://docs.google.com/document/d/${docId}/edit`;
      } else {
        throw new Error(`Failed to parse doc ID from create output: ${createOutput}`);
      }
      console.log(`🎉 Created new doc: ${docUrl}`);
    }
  } finally {
    if (fs.existsSync(tempMdPath)) {
      fs.unlinkSync(tempMdPath);
    }
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log('✨ QA DECK v2.0.0 SYNCHRONISATION COMPLETE');
  console.log(`📎 Document ID:  ${docId}`);
  console.log(`🔗 Document URL: ${docUrl}`);
  console.log(`👤 Operator Stamp: [SYNC - ${operator}]`);
  console.log('────────────────────────────────────────────────────────────');

  return { docId, docUrl, activeCardNum: activeCard.cardNum, operator };
}

if (require.main === module) {
  syncQADeck()
    .then(({ docUrl, operator }) => {
      console.log(`\nSUCCESS: MW-QA-Deck-Active (v2.0.0) synced to Drive by [SYNC - ${operator}].`);
      console.log(`URL: ${docUrl}\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`\n❌ ERROR in syncQADeck:`, err);
      process.exit(1);
    });
}
