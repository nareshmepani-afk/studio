/**
 * 🧭 Admin Mission Control Knowledge Routing Rules & Classification Engine
 *
 * Grounding Matrix: C:\Users\home\studio\.agents\ROUTING_MATRIX.md
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md (Rule 20 UK English, Rule 7 Non-Degradation)
 *
 * Implements the runtime 5-way knowledge routing protocol between NotebookLM
 * grounding vaults and Antigravity pinned execution chats.
 */

export type VaultId =
  | 'executive-architecture'
  | 'systems-codebase'
  | 'legal-regulatory'
  | 'storytelling-dialects'
  | 'qa-invariants';

export type PinnedChatId =
  | 'chat-1-architect'
  | 'chat-2-executor'
  | 'chat-3-qa'
  | 'chat-4-muse'
  | 'heirloom-design-log';

export type OperationalMode = '[Use Planning]' | '[Use Fast]';

export interface KnowledgeVaultDefinition {
  id: VaultId;
  name: string;
  icon: string;
  scope: string;
  targetChat: PinnedChatId;
  targetChatName: string;
  mandatedMode: OperationalMode;
  targetFiles: string[]; // Fully-qualified Windows paths starting with C:\Users\home\studio\...
  primaryKeywords: string[];
  secondaryKeywords: string[];
}

export interface IntentClassificationResult {
  matchedVault: KnowledgeVaultDefinition;
  confidenceScore: number; // Normalised 0.0 to 1.0
  matchedKeywords: string[];
  suggestedMode: OperationalMode;
  targetChatName: string;
  generatedDispatchPrompt: string;
}

export interface VaultDigestItem {
  relativePath: string;
  absolutePath: string;
  vaultId: VaultId;
  status: 'SYNCED' | 'MODIFIED_LOCAL' | 'RECENTLY_COMMITTED';
  lastCommitHash?: string;
  lastCommitTime?: string;
  sizeBytes: number;
}

export interface VaultDigestResponse {
  timestamp: string;
  environment: string;
  vaults: Array<{
    vault: KnowledgeVaultDefinition;
    documents: VaultDigestItem[];
    syncHealth: 'HEALTHY' | 'NEEDS_INGESTION' | 'DIRTY';
  }>;
  summary: {
    totalDocuments: number;
    readyForIngestion: number;
    dirtyLocal: number;
  };
}

/**
 * Authoritative 5-Way Knowledge Vault Registry
 * Mirroring C:\Users\home\studio\.agents\ROUTING_MATRIX.md
 */
export const KNOWLEDGE_VAULTS: Record<VaultId, KnowledgeVaultDefinition> = {
  'executive-architecture': {
    id: 'executive-architecture',
    name: 'Executive Board & Architecture',
    icon: '🏛️',
    scope:
      'Financial models, £195 heirloom / £12.99 monthly pricing, Sprint roadmaps, Architecture Decision Records (ADRs), multi-generational commercial thesis.',
    targetChat: 'chat-1-architect',
    targetChatName: 'Chat 1: The Lead Architect',
    mandatedMode: '[Use Planning]',
    targetFiles: [
      'C:\\Users\\home\\studio\\docs\\*.md',
      'C:\\Users\\home\\studio\\MISSION_LOG.md',
      'C:\\Users\\home\\studio\\.agents\\AGENTS.md',
    ],
    primaryKeywords: [
      'pricing',
      'commercial thesis',
      'roadmap',
      'sprint',
      'adr',
      'tier',
      'revenue',
      'mw- spec',
      'architecture design',
      'architecture',
      'spec',
    ],
    secondaryKeywords: [
      'business model',
      'heirloom pass',
      'unboxing ceremony spec',
      'financial projection',
      'gift voucher economics',
      'governance',
      'decision record',
      'board',
      'strategy',
    ],
  },
  'systems-codebase': {
    id: 'systems-codebase',
    name: 'Systems, Tech & Codebase',
    icon: '📐',
    scope:
      'Next.js 15 App Router, Firestore rules & schemas, Cloud Run, App Hosting, Edge Middleware, React components, Tailwind styling, Web Audio synthesis, builds.',
    targetChat: 'chat-2-executor',
    targetChatName: 'Chat 2: The Flash Executor',
    mandatedMode: '[Use Fast]',
    targetFiles: [
      'C:\\Users\\home\\studio\\src\\app\\*',
      'C:\\Users\\home\\studio\\src\\components\\*',
      'C:\\Users\\home\\studio\\src\\lib\\*',
      'C:\\Users\\home\\studio\\src\\hooks\\*',
    ],
    primaryKeywords: [
      'component',
      'hook',
      'page',
      'route',
      'api',
      'firestore schema',
      'tailwind',
      'build',
      'compilation',
      'refactor',
      'bug fix',
      'css',
    ],
    secondaryKeywords: [
      'next.js app router',
      'cloud run',
      'app hosting',
      'react state',
      'typescript compilation',
      'edge routing',
      'csp',
      'state machine',
      'render',
      'layout',
    ],
  },
  'legal-regulatory': {
    id: 'legal-regulatory',
    name: 'Legal, Regulatory & SCA',
    icon: '⚖️',
    scope:
      'Section 6 Hardware & Technical Terms, UK Consumer Rights Act 2015, Stripe Strong Customer Authentication (SCA), GDPR / Data Protection, refund & cancellation covenants.',
    targetChat: 'chat-1-architect',
    targetChatName: 'Chat 1: The Lead Architect',
    mandatedMode: '[Use Planning]',
    targetFiles: [
      'C:\\Users\\home\\studio\\src\\app\\legal\\terms\\page.tsx',
      'C:\\Users\\home\\studio\\src\\app\\legal\\privacy\\page.tsx',
      'C:\\Users\\home\\studio\\firestore.rules',
    ],
    primaryKeywords: [
      'section 6',
      'hardware terms',
      'consumer rights',
      'gdpr',
      'stripe sca',
      'refund',
      'cancellation',
      'liability',
      'statutory',
      'legal',
    ],
    secondaryKeywords: [
      'privacy policy',
      'cookie consent',
      'terms of service',
      'cooling-off period',
      'data retention',
      'regulatory compliance',
      'dpa',
      'terms',
      'compliance',
    ],
  },
  'storytelling-dialects': {
    id: 'storytelling-dialects',
    name: 'Storytelling, Indic Dialects & Prompts',
    icon: '🎧',
    scope:
      'Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), and Hindi (हिन्दी) cultural dedications & salutations, Web Audio wax-seal crack SFX, prompt spark engine, British English orthography standards.',
    targetChat: 'chat-4-muse',
    targetChatName: 'Chat 4: The Dedication Muse & Copy Critic',
    mandatedMode: '[Use Fast]',
    targetFiles: [
      'C:\\Users\\home\\studio\\src\\config\\businessRules.ts',
      'C:\\Users\\home\\studio\\src\\lib\\audio\\*',
      'C:\\Users\\home\\studio\\src\\lib\\dedicationMuse.ts',
    ],
    primaryKeywords: [
      'gujarati',
      'punjabi',
      'hindi',
      'indic script',
      'dedication',
      'muse',
      'wax seal audio',
      'crack sfx',
      'soundtrack',
      'copy',
      'tone',
      'dialect',
    ],
    secondaryKeywords: [
      'prompt spark',
      'monologue',
      'orthography',
      'salutation',
      'noto sans indic',
      'audio context',
      'procedural audio',
      'bilingual',
      'cultural',
      'audio',
    ],
  },
  'qa-invariants': {
    id: 'qa-invariants',
    name: 'QA, Invariants & Verification',
    icon: '🛡️',
    scope:
      'Vitest automated regression shields, Native Playwright staging smoke tests, /api/version edge deployment polling, interactive QA verification artifacts (qa_checklist_interactive.html).',
    targetChat: 'chat-3-qa',
    targetChatName: 'Chat 3: The QA Gatekeeper',
    mandatedMode: '[Use Fast]',
    targetFiles: [
      'C:\\Users\\home\\studio\\src\\test\\*',
      'C:\\Users\\home\\studio\\qa_checklist_interactive.html',
      'C:\\Users\\home\\studio\\scripts\\generate_qa_checklist.js',
    ],
    primaryKeywords: [
      'test',
      'vitest',
      'playwright',
      'regression',
      'invariant',
      'qa checklist',
      'verification',
      'edge poll',
      '/api/version',
      'audit',
    ],
    secondaryKeywords: [
      'smoke test',
      'visual diff',
      'headless browser',
      'staging gate',
      'test coverage',
      'mobile viewport assertion',
      'qa report',
      'assertion',
    ],
  },
};

export interface ForgeDispatchPromptParams {
  intent: Omit<IntentClassificationResult, 'generatedDispatchPrompt'> | IntentClassificationResult;
  taskTitle?: string;
  ticketId?: string;
  objective?: string;
  customSteps?: string[];
  targetFilesOverride?: string[];
}

/**
 * Generates the canonical Markdown dispatch block adhering to
 * C:\Users\home\studio\.agents\chat_0_dispatch_brain_system_prompt.md
 */
export function forgeDispatchPrompt(params: ForgeDispatchPromptParams): string {
  const { intent, taskTitle, ticketId, objective, customSteps, targetFilesOverride } = params;
  const vault = intent.matchedVault;
  const targetFiles = targetFilesOverride || vault.targetFiles;
  const displayTitle = taskTitle || 'Autonomous Platform Task';
  const displayTicket = ticketId || 'MW-TASK';
  const displayObjective =
    objective ||
    'Execute precision engineering task adhering to constitutional platform invariants and grounding rules.';

  const defaultSteps =
    vault.mandatedMode === '[Use Planning]'
      ? [
          'Inspect referenced target files and explore existing architectural invariants.',
          'Formulate and output implementation_plan.md for user ratification.',
          'Execute file mutations and verify with npx tsc --noEmit (exit code 0).',
        ]
      : [
          'Inspect referenced target files and isolate specific line-bounded mutations.',
          'Execute targeted code modifications adhering strictly to Rule 7 Non-Degradation.',
          'Verify compilation with npx tsc --noEmit and execute local Vitest suite.',
        ];

  const steps = customSteps && customSteps.length > 0 ? customSteps : defaultSteps;

  return `### 🛰️ DISPATCH ORDER: [${displayTicket}] ${displayTitle}

**Authoritative Grounding Vault:** ${vault.icon} ${vault.name}  
**Target Pinned Thread:** \`${vault.targetChatName}\`  
**Mandated Operational Mode:** \`${intent.suggestedMode}\`  
**Workspace Root:** \`C:\\Users\\home\\studio\`  

---

#### 🎯 Mission Objective & Scope
${displayObjective}

#### 📁 Target Files (Absolute Paths)
${targetFiles.map((f) => `- \`${f}\``).join('\n')}

#### 📜 Mandatory Invariant Rules
- **Rule 20 (UK English):** Strict British English orthography across all labels, comments, and strings.
- **Rule 5 (Staging Gate):** Must compile cleanly with \`npm.cmd run build\` (exit code 0). No localhost testing.
- **Rule 7 (Non-Degradation):** Zero removal or degradation of existing user controls or visual feedback loops.
- **Rule 26 (Model Triage & Token Economy):** Concise context, line-bounded inspections (≤30 lines), zero token waste.
- **Rule 34 & 36 (Testing Rigour):** Invariant unit testing in Vitest and headless visual regression in Playwright.

#### 📋 Step-by-Step Execution Plan
${steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}`;
}

/**
 * Deterministic Intent Classifier
 * Scans raw user input, calculates weighted keyword scores, resolves ties in favour
 * of executive architecture planning, and returns the classification result with a ready-to-paste prompt.
 */
export function classifyUserIntent(rawInput: string): IntentClassificationResult {
  const trimmed = (rawInput || '').trim();
  const normalised = trimmed.toLowerCase();

  // Edge case: Empty input defaults to Executive Architecture with 0 confidence
  if (!normalised) {
    const defaultVault = KNOWLEDGE_VAULTS['executive-architecture'];
    const partialResult = {
      matchedVault: defaultVault,
      confidenceScore: 0,
      matchedKeywords: [],
      suggestedMode: defaultVault.mandatedMode,
      targetChatName: defaultVault.targetChatName,
    };
    return {
      ...partialResult,
      generatedDispatchPrompt: forgeDispatchPrompt({
        intent: partialResult,
        taskTitle: 'Strategic Architecture Planning',
        objective: 'Awaiting user input to define mission objectives and scope.',
      }),
    };
  }

  const PRIMARY_WEIGHT = 3.0;
  const SECONDARY_WEIGHT = 1.0;

  const scores: Record<
    VaultId,
    {
      totalScore: number;
      matchedKeywords: string[];
    }
  > = {
    'executive-architecture': { totalScore: 0, matchedKeywords: [] },
    'systems-codebase': { totalScore: 0, matchedKeywords: [] },
    'legal-regulatory': { totalScore: 0, matchedKeywords: [] },
    'storytelling-dialects': { totalScore: 0, matchedKeywords: [] },
    'qa-invariants': { totalScore: 0, matchedKeywords: [] },
  };

  // Helper: word boundary / substring matching
  const matchKeyword = (text: string, kw: string): boolean => {
    // If keyword contains non-word characters (e.g. /api/version, mw- spec), use includes
    if (/[^a-z0-9]/i.test(kw)) {
      return text.includes(kw.toLowerCase());
    }
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
    return regex.test(text);
  };

  (Object.keys(KNOWLEDGE_VAULTS) as VaultId[]).forEach((vaultId) => {
    const vault = KNOWLEDGE_VAULTS[vaultId];

    vault.primaryKeywords.forEach((kw) => {
      if (matchKeyword(normalised, kw)) {
        scores[vaultId].totalScore += PRIMARY_WEIGHT;
        if (!scores[vaultId].matchedKeywords.includes(kw)) {
          scores[vaultId].matchedKeywords.push(kw);
        }
      }
    });

    vault.secondaryKeywords.forEach((kw) => {
      if (matchKeyword(normalised, kw)) {
        scores[vaultId].totalScore += SECONDARY_WEIGHT;
        if (!scores[vaultId].matchedKeywords.includes(kw)) {
          scores[vaultId].matchedKeywords.push(kw);
        }
      }
    });
  });

  // Rank vaults by score descending
  const sortedVaults = (Object.keys(scores) as VaultId[]).sort((a, b) => {
    const scoreDiff = scores[b].totalScore - scores[a].totalScore;
    if (scoreDiff !== 0) return scoreDiff;

    // Tie-breaking priority:
    // 1. Prefer 'executive-architecture' (Planning-First invariant)
    if (a === 'executive-architecture') return -1;
    if (b === 'executive-architecture') return 1;

    // 2. Prefer vaults with [Use Planning] mode
    const aPlanning = KNOWLEDGE_VAULTS[a].mandatedMode === '[Use Planning]';
    const bPlanning = KNOWLEDGE_VAULTS[b].mandatedMode === '[Use Planning]';
    if (aPlanning && !bPlanning) return -1;
    if (!aPlanning && bPlanning) return 1;

    return 0;
  });

  const bestVaultId = sortedVaults[0];
  const bestScoreData = scores[bestVaultId];
  const matchedVault = KNOWLEDGE_VAULTS[bestVaultId];

  // If no keywords matched at all
  if (bestScoreData.totalScore === 0) {
    const defaultVault = KNOWLEDGE_VAULTS['executive-architecture'];
    const partialResult = {
      matchedVault: defaultVault,
      confidenceScore: 0.1, // Minimal baseline for non-empty text without direct keyword hits
      matchedKeywords: [],
      suggestedMode: defaultVault.mandatedMode,
      targetChatName: defaultVault.targetChatName,
    };
    return {
      ...partialResult,
      generatedDispatchPrompt: forgeDispatchPrompt({
        intent: partialResult,
        taskTitle: 'Triage & Architectural Scoping',
        objective: trimmed,
      }),
    };
  }

  // Calculate confidence score (bounded between 0.15 and 1.0)
  // Single primary hit (3.0) -> ~0.50, two primary hits (6.0) -> ~0.67, 3 primary hits (9.0) -> ~0.75
  const rawConfidence = bestScoreData.totalScore / (bestScoreData.totalScore + 3.0);
  const confidenceScore = Math.min(1.0, Math.max(0.15, Number(rawConfidence.toFixed(2))));

  const partialResult = {
    matchedVault,
    confidenceScore,
    matchedKeywords: bestScoreData.matchedKeywords,
    suggestedMode: matchedVault.mandatedMode,
    targetChatName: matchedVault.targetChatName,
  };

  const generatedDispatchPrompt = forgeDispatchPrompt({
    intent: partialResult,
    taskTitle: trimmed.length > 50 ? `${trimmed.slice(0, 47)}...` : trimmed,
    objective: trimmed,
  });

  return {
    ...partialResult,
    generatedDispatchPrompt,
  };
}
