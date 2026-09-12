import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { PublicPageShell } from '@/components/public/PublicPageShell';

describe('Viewport Integrity & Obsidian Theme Guardrails (Rule 9 Regression Shield)', () => {
  it('ensures globals.css has zero diagnostic red borders or cache buster border styles', () => {
    const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Assert red cache buster border is stripped
    expect(cssContent).not.toContain('CACHE BUSTER RED BORDER');
    expect(cssContent).not.toContain('border: 10px solid #ef4444 !important;');
    expect(cssContent).not.toMatch(/html,\s*body\s*\{[^}]*border:\s*[^;}]*red/i);
    expect(cssContent).not.toMatch(/html,\s*body\s*\{[^}]*border:\s*10px/i);

    // Assert root background stability is pure obsidian #0A0A0A
    expect(cssContent).toContain('background-color: #0A0A0A;');
  });

  it('ensures RootLayout enforces dark mode and obsidian body background', () => {
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    expect(layoutContent).toContain('className="dark"');
    expect(layoutContent).toContain('bg-[#0A0A0A]');
  });

  it('renders PublicPageShell with obsidian background container extending to viewport edges', () => {
    const { container } = render(
      <PublicPageShell>
        <div data-testid="test-content">Gift Content</div>
      </PublicPageShell>
    );

    const rootContainer = container.firstElementChild as HTMLElement;
    expect(rootContainer).toBeTruthy();
    expect(rootContainer.className).toContain('bg-[#0A0A0A]');
    expect(rootContainer.className).toContain('min-h-screen');
    expect(screen.getByTestId('test-content')).toBeDefined();
  });
});
