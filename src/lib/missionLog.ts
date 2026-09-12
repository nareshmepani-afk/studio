export interface MissionLogCoordinates {
  activeSprint: string;
  targetEdge: string;
  governanceDoc: string;
  knowledgeVault: string;
  baselineTests: string;
}

export interface MissionLogPartnerDisciplines {
  director: string;
  gemini: string;
  antigravity: string;
  qa: string;
}

export interface MissionLogTicket {
  raw: string;
  completed: boolean;
  text: string;
}

export interface MissionLogCheckpoint {
  checkpointId: string;
  timestamp: string;
  title: string;
  partnerDisciplines: MissionLogPartnerDisciplines;
  filesImpacted: string[];
  activeTickets: MissionLogTicket[];
  nextDirective: string;
  rawMarkdown: string;
}

export interface MissionLogPayload {
  coordinates: MissionLogCoordinates;
  checkpoints: MissionLogCheckpoint[];
  lastUpdated: string;
}

export function parseMissionLogMarkdown(content: string): { coordinates: MissionLogCoordinates; checkpoints: MissionLogCheckpoint[] } {
  // 1. Unescape markdown syntax artifacts if present
  const unescaped = content
    .replace(/\\([*#\-_`\[\]&])/g, '$1')
    .replace(/&#x20;/g, ' ');

  // 2. Extract Active Platform Coordinates
  const activeSprintMatch = unescaped.match(/-\s+\*\*Active Sprint:\*\*\s+(.+)/i);
  const targetEdgeMatch = unescaped.match(/-\s+\*\*Target Edge Environment:\*\*\s+(.+)/i);
  const governanceDocMatch = unescaped.match(/-\s+\*\*Active Governance Document:\*\*\s+(.+)/i);
  const knowledgeVaultMatch = unescaped.match(/-\s+\*\*Executive Knowledge Vault:\*\*\s+(.+)/i);
  const baselineTestsMatch = unescaped.match(/-\s+\*\*Current Invariant Test Baseline:\*\*\s+(.+)/i);

  const coordinates: MissionLogCoordinates = {
    activeSprint: activeSprintMatch ? activeSprintMatch[1].trim() : 'Sprint 3 — MW-86 Act V Heirloom Unboxing & Keepsake Engine',
    targetEdge: targetEdgeMatch ? targetEdgeMatch[1].trim().replace(/`/g, '') : 'https://dev.memoryweaver.studio',
    governanceDoc: governanceDocMatch ? governanceDocMatch[1].trim().replace(/`/g, '') : '.agents/AGENTS.md',
    knowledgeVault: knowledgeVaultMatch ? knowledgeVaultMatch[1].trim().replace(/`/g, '') : 'NotebookLM Executive Board Vault',
    baselineTests: baselineTestsMatch ? baselineTestsMatch[1].trim() : '357 / 357 Vitest Tests Passing',
  };

  // 3. Extract Checkpoints
  const checkpointRegex = /###\s+\[([^\]]+)\]\s+•\s+(Checkpoint\s+#\d+)\s+—\s+([^\n\r]+)([\s\S]*?)(?=(?:###\s+\[|$))/gi;
  const checkpoints: MissionLogCheckpoint[] = [];

  let match: RegExpExecArray | null;
  while ((match = checkpointRegex.exec(unescaped)) !== null) {
    const timestamp = match[1].trim();
    const checkpointId = match[2].trim();
    const title = match[3].trim().replace(/`/g, '');
    const body = match[4].trim();

    // Parse Partner Disciplines
    const directorMatch = body.match(/👤\s+\*\*Creative Director\*\*:\s*([^\n\r]+(?:\n\s{4,}[^\n\r]+)*)/i);
    const geminiMatch = body.match(/🧠\s+\*\*Gemini Strategic Brain\*\*:\s*([^\n\r]+(?:\n\s{4,}[^\n\r]+)*)/i);
    const antigravityMatch = body.match(/⚡\s+\*\*Antigravity Execution\*\*:\s*([^\n\r]+(?:\n\s{4,}[^\n\r]+)*)/i);
    const qaMatch = body.match(/🛡️\s+\*\*QA Gatekeeper\*\*:\s*([^\n\r]+(?:\n\s{4,}[^\n\r]+)*)/i);

    // Parse Target Files
    const filesSectionMatch = body.match(/-\s+\*\*Target Files Impacted:\*\*([\s\S]*?)(?=-\s+\*\*(?:Active Ticket|Next Unblocked)|$)/i);
    const filesImpacted: string[] = [];
    if (filesSectionMatch) {
      const fileLines = filesSectionMatch[1].match(/-\s+`([^`]+)`/g) || [];
      fileLines.forEach(l => {
        const m = l.match(/`([^`]+)`/);
        if (m) filesImpacted.push(m[1]);
      });
    }

    // Parse Active Ticket Queue
    const ticketsSectionMatch = body.match(/-\s+\*\*Active Ticket Queue[^\n]*\*\*([\s\S]*?)(?=-\s+\*\*Next Unblocked|$)/i);
    const activeTickets: MissionLogTicket[] = [];
    if (ticketsSectionMatch) {
      const ticketLines = ticketsSectionMatch[1].split('\n');
      ticketLines.forEach(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith('- [')) {
          const completed = trimmed.startsWith('- [x]');
          activeTickets.push({
            raw: trimmed,
            completed,
            text: trimmed.replace(/^-\s+\[[ x]\]\s+/, '')
          });
        }
      });
    }

    // Parse Next Directive
    const nextMatch = body.match(/-\s+\*\*Next Unblocked Directive:\*\*\s*([^\n\r]+)/i);
    const nextDirective = nextMatch ? nextMatch[1].trim() : '';

    checkpoints.push({
      checkpointId,
      timestamp,
      title,
      partnerDisciplines: {
        director: directorMatch ? directorMatch[1].trim() : '',
        gemini: geminiMatch ? geminiMatch[1].trim() : '',
        antigravity: antigravityMatch ? antigravityMatch[1].trim() : '',
        qa: qaMatch ? qaMatch[1].trim() : '',
      },
      filesImpacted,
      activeTickets,
      nextDirective,
      rawMarkdown: `### [${timestamp}] • ${checkpointId} — ${title}\n${body}`
    });
  }

  // Reverse so newest checkpoint is first
  checkpoints.reverse();

  return { coordinates, checkpoints };
}
