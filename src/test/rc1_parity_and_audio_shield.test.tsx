import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { mapAmplitudeToBroadcastPercent } from '@/hooks/useAudioMonitor';
import { resolvePreferredScriptTake } from '@/lib/studioStageResolver';
import { PromptCard } from '@/components/prompts/PromptCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/studio',
  useSearchParams: () => new URLSearchParams(),
}));

describe('RC1 Visual Parity, Broadcast dBFS Audio & Fireside Rescue Shield', () => {
  it('calibrates time-domain voice amplitude onto a logarithmic broadcast dBFS meter (-54..0 dBFS)', () => {
    expect(mapAmplitudeToBroadcastPercent(0)).toBe(0);
    expect(mapAmplitudeToBroadcastPercent(0.001)).toBe(0); // -60 dBFS -> floor 0%
    // -12 dBFS (~0.251 linear) should read healthy speech (~76–80%, NOT crushed to 15%)
    const speechPercent = mapAmplitudeToBroadcastPercent(0.251);
    expect(speechPercent).toBeGreaterThanOrEqual(75);
    expect(speechPercent).toBeLessThanOrEqual(82);
    // -3 dBFS (~0.708 linear) -> ~94–95%
    const loudPercent = mapAmplitudeToBroadcastPercent(0.708);
    expect(loudPercent).toBeGreaterThanOrEqual(93);
    expect(loudPercent).toBeLessThanOrEqual(96);
  });

  it('rejects default prompt placeholder copy in resolvePreferredScriptTake while keeping authentic prose', () => {
    expect(
      resolvePreferredScriptTake({
        prose: 'Enter the core of your memory here...',
        description: 'Your birthplace, family roots and early memories',
      })
    ).toBeNull();

    expect(
      resolvePreferredScriptTake({
        prose: 'Enter the core of your memory',
        description: 'We travelled from Nairobi to London in August 1965.',
      })
    ).toBe('We travelled from Nairobi to London in August 1965.');
  });

  it('renders PromptCard IN CINEMA badge with Watch in Cinema primary link and quiet Edit sibling link', () => {
    const { container } = render(
      <PromptCard
        promptId="p_roots_1"
        memoryId="mem_pub_123"
        promptText="A Child of Two Worlds"
        storyScript=""
        isCompleted={true}
        isFlaggedForReuse={false}
        onStartChapter={vi.fn()}
        onToggleFlagPrompt={vi.fn()}
        canAccess={true}
        status="published"
        memoryDescription="Held close in my parents' arms."
      />
    );

    expect(screen.getByTestId('prompt-card-in-cinema-badge-p_roots_1').textContent).toContain('In Cinema');
    const editLink = screen.getByTestId('prompt-card-edit-secondary-p_roots_1') as HTMLAnchorElement;
    expect(editLink.getAttribute('href')).toBe('/studio/production/mem_pub_123?act=1');

    const links = Array.from(container.querySelectorAll('a'));
    expect(links.some((a) => a.getAttribute('href') === '/cinema/tv?id=mem_pub_123')).toBe(true);
    // Zero nested anchors
    expect(container.querySelector('a a')).toBeNull();
  });

  it('guarantees FiresideStudioClient never auto-starts recording on prompt select and defaults autoBreath to false', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'src/app/studio/fireside/FiresideStudioClient.tsx'),
      'utf8'
    );
    expect(src).toContain('const [autoBreath, setAutoBreath] = useState(false);');
    expect(src).toContain('className="md:sticky md:top-0 z-30 w-full"');

    const selectBlockMatch = src.match(/const handleSelectPrompt[\s\S]*?const scrollToActiveStudio/);
    expect(selectBlockMatch).toBeTruthy();
    const selectBlock = selectBlockMatch![0];
    expect(selectBlock).not.toContain('.startRecording()');
    expect(selectBlock).toContain('enableCameraPreview()');
  });
});
