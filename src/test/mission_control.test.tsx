import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MissionControlConsole } from '@/components/admin/MissionControlConsole';
import { parseMissionLogMarkdown } from '@/lib/missionLog';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const sampleMarkdown = `# 🏛️ MEMORY WEAVER: EXECUTIVE MISSION LOG & FLIGHT RECORDER
*Single Source of Truth across Director, Gemini, Antigravity, and NotebookLM.*

---

## 📌 Active Platform Coordinates
- **Active Sprint:** Sprint 3 — MW-86 Act V Heirloom Unboxing & Keepsake Engine
- **Target Edge Environment:** \`https://dev.memoryweaver.studio\` (Serving Commit: \`6059e0d1\`)
- **Active Governance Document:** \`C:\\Users\\home\\studio\\.agents\\AGENTS.md\` (Rule 37.3 Codified)
- **Executive Knowledge Vault:** NotebookLM \`🏛️ Memory Weaver: Executive Board & Architecture Vault\`
- **Current Invariant Test Baseline:** 357 / 357 Vitest Tests Passing (29 Test Files)

---

## 📋 Flight Checkpoints

### [2026-09-12 16:30 BST] • Checkpoint #002 — Theatrical Unboxing Stage Complete (Commit \`6059e0d1\`)
- **Partner Disciplines:**
  - 👤 **Creative Director**: Supervised the autonomous verification timer and validated Crockford Base32 staging unlock probes.
  - 🧠 **Gemini Strategic Brain**: Synchronised active flight logs to NotebookLM and triaged post-unboxing audio suggestions.
  - ⚡ **Antigravity Execution**: Commit \`6059e0d1\` pushed and verified live on staging.
  - 🛡️ **QA Gatekeeper**: Vitest suite expanded from 350 to 357 passed tests.
- **Target Files Impacted:**
  - \`C:\\Users\\home\\studio\\src\\app\\unboxing\\[code]\\page.tsx\`
  - \`C:\\Users\\home\\studio\\MISSION_LOG.md\`
- **Active Ticket Queue (Plane.so):**
  - [x] **MW-229 (Ticket #229)**: The \`/unboxing/[code]\` Theatrical Stage *(Complete & Live on Staging)*
  - [ ] **MW-230 (Ticket #230)**: 5"×7" Keepsake Vector PDF Generator
- **Next Unblocked Directive:** Verify live unboxing URLs on staging or dispatch Ticket #230 to Antigravity.

---
`;

describe('Sprint 3 / Ticket #233: Mission Control & Flight Recorder Invariant Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Mission Log Markdown Parser Invariants', () => {
    it('correctly extracts platform coordinates from markdown', () => {
      const { coordinates } = parseMissionLogMarkdown(sampleMarkdown);

      expect(coordinates.activeSprint).toContain('Sprint 3');
      expect(coordinates.targetEdge).toContain('dev.memoryweaver.studio');
      expect(coordinates.targetEdge).toContain('6059e0d1');
      expect(coordinates.baselineTests).toContain('357 / 357');
    });

    it('correctly extracts checkpoints and partner discipline allocations', () => {
      const { checkpoints } = parseMissionLogMarkdown(sampleMarkdown);

      expect(checkpoints.length).toBe(1);
      const cp = checkpoints[0];
      expect(cp.checkpointId).toBe('Checkpoint #002');
      expect(cp.timestamp).toBe('2026-09-12 16:30 BST');
      expect(cp.partnerDisciplines.director).toContain('Supervised the autonomous verification timer');
      expect(cp.partnerDisciplines.gemini).toContain('NotebookLM');
      expect(cp.partnerDisciplines.antigravity).toContain('6059e0d1');
      expect(cp.partnerDisciplines.qa).toContain('357');
      expect(cp.filesImpacted.length).toBe(2);
      expect(cp.activeTickets.length).toBe(2);
      expect(cp.activeTickets[0].completed).toBe(true);
      expect(cp.activeTickets[1].completed).toBe(false);
      expect(cp.nextDirective).toContain('Ticket #230');
    });
  });

  describe('2. MissionControlConsole UI Component Invariants', () => {
    beforeEach(() => {
      const { coordinates, checkpoints } = parseMissionLogMarkdown(sampleMarkdown);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          coordinates,
          checkpoints,
          lastUpdated: new Date().toISOString(),
        }),
      });
    });

    it('renders the top HUD cards with sprint, edge, and test count', async () => {
      render(<MissionControlConsole />);

      await waitFor(() => {
        expect(screen.getByText(/Active Sprint/i)).toBeInTheDocument();
        expect(screen.getByText(/dev\.memoryweaver\.studio/i)).toBeInTheDocument();
        expect(screen.getByText(/357 \/ 357 Vitest Tests Passing/i)).toBeInTheDocument();
      });
    });

    it('renders checkpoints with partner discipline badges and 1-click copy button', async () => {
      render(<MissionControlConsole />);

      await waitFor(() => {
        expect(screen.getByText('Checkpoint #002')).toBeInTheDocument();
        expect(screen.getByText('Creative Director')).toBeInTheDocument();
        expect(screen.getByText('Gemini Strategic Brain')).toBeInTheDocument();
        expect(screen.getByText('Antigravity Execution')).toBeInTheDocument();
        expect(screen.getByText('QA Gatekeeper')).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole('button', { name: /Copy for Chat/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.getByText('Copied Checkpoint!')).toBeInTheDocument();
      });
    });

    it('expands impacted files list upon user toggle', async () => {
      render(<MissionControlConsole />);

      await waitFor(() => {
        expect(screen.getByText(/Target Files Impacted \(2\)/i)).toBeInTheDocument();
      });

      const filesToggleBtn = screen.getByText(/Target Files Impacted \(2\)/i);
      fireEvent.click(filesToggleBtn);

      await waitFor(() => {
        expect(screen.getByText(/page\.tsx/i)).toBeInTheDocument();
        expect(screen.getByText(/MISSION_LOG\.md/i)).toBeInTheDocument();
      });
    });

    it('filters checkpoints when partner chips are clicked', async () => {
      render(<MissionControlConsole />);

      await waitFor(() => {
        expect(screen.getByText('Checkpoint #002')).toBeInTheDocument();
      });

      const directorChip = screen.getByRole('button', { name: /👤 Director/i });
      fireEvent.click(directorChip);

      expect(screen.getByText('Checkpoint #002')).toBeInTheDocument();
    });
  });
});
