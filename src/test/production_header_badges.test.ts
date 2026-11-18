import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('MW-411: Desktop Soundstage Authority Detection, Passive Status Tags & Hover Tooltips', () => {
  const deckPath = path.resolve(process.cwd(), 'src/components/studio/ProductionDeck.tsx');
  const containerPath = path.resolve(process.cwd(), 'src/components/studio/ProductionDeckContainer.tsx');
  const deckSource = fs.readFileSync(deckPath, 'utf-8');
  const containerSource = fs.readFileSync(containerPath, 'utf-8');

  it('stamps new Desktop Soundstage drafts with desktop_locked authority in ProductionDeckContainer.tsx', () => {
    const matches = containerSource.match(/originSurface:\s*'soundstage_desktop'/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(containerSource).toContain("surfaceOrigin: 'desktop_soundstage'");
    expect(containerSource).toContain("editingAuthority: 'desktop_locked'");
  });

  it('requires genuine mobile provenance (ignoring synthetic memoir_ vault skeletons) before showing Mobile Recording • Flexible', () => {
    expect(deckSource).toContain('hasPersistedVaultMobileRecord');
    expect(deckSource).toContain("!vaultSceneMemory.id.startsWith('memoir_')");
    expect(deckSource).toContain('hasGenuineMobileOrigin');
    expect(deckSource).toContain("return 'desktop_locked';");
  });

  it('reserves Pre-Flight Rehearsal badge exclusively for isRehearsalFlight (no Pre-Flight pill on normal chapters)', () => {
    expect(deckSource).not.toContain('isPreFlightAct');
    expect(deckSource).not.toContain("? '✈️ Pre-Flight'");
    expect(deckSource).toContain("? '✈️ Pre-Flight Rehearsal'");
  });

  it('styles passive status badges as quiet recessed metadata tags and provides Tooltip + title on all header badges', () => {
    expect(deckSource).toContain('data-testid="production-status-tag"');
    expect(deckSource).toContain('data-testid="mobile-flexible-badge"');
    expect(deckSource).toContain('data-testid="elevate-studio-master-btn"');
    expect(deckSource).toContain('data-testid="desktop-studio-master-badge"');
    expect(deckSource).toContain('bg-white/[0.04] border border-white/10');
    expect(deckSource).toContain('cursor-default');
    expect(deckSource).toContain('Studio Master Mode — Authoring directly on the Desktop Soundstage');
    expect(deckSource).toContain('Originated on Fireside Mobile — Currently in flexible mobile-capture status.');
    expect(deckSource).toContain('Promote this mobile recording to a 5-Act Desktop Studio Master');
    expect(deckSource).toContain('Practice Sandbox — Rehearse scripting, AI weaving, and teleprompter recording');
  });
});
