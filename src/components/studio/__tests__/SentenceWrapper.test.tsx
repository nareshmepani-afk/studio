import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SentenceWrapper } from '../Scriptorium/SentenceWrapper';
import React from 'react';

// Mock dependencies
vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => ({
    actions: {
      setAppliedCatalysts: vi.fn(),
    },
  }),
}));

vi.mock('@/hooks/studio/useDirectorInk', () => ({
  detectAnchors: vi.fn(() => []), filterDominantSensoryAnchors: vi.fn((a: any) => a || []),
}));

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
};

describe('SentenceWrapper Cursor Stability', () => {
  const mockBlock = {
    id: 'test-block',
    text: 'Hello world',
    type: 'hook' as const,
    catalysts: [],
  };

  it('Stops click propagation to prevent parent container from jumping cursor', () => {
    const onUpdate = vi.fn();
    const parentOnClick = vi.fn();

    render(
      <div onClick={parentOnClick}>
        <SentenceWrapper
          block={mockBlock}
          onUpdate={onUpdate}
          onFocus={vi.fn()}
          onBlur={vi.fn()}
          actions={{} as any}
        />
      </div>
    );

    // The textarea is the interaction layer
    const textarea = screen.getByRole('textbox');
    
    // Simulate a click on the textarea
    fireEvent.click(textarea);

    // Assert: parentOnClick should NOT have been called because of e.stopPropagation()
    expect(parentOnClick).not.toHaveBeenCalled();
  });

  it('Allows parent click when clicking outside textarea', () => {
    const parentOnClick = vi.fn();

    render(
      <div onClick={parentOnClick} data-testid="parent-container">
        <div style={{ padding: '20px' }}>
          <SentenceWrapper
            block={mockBlock}
            onUpdate={vi.fn()}
            onFocus={vi.fn()}
            onBlur={vi.fn()}
            actions={{} as any}
          />
        </div>
      </div>
    );

    const parent = screen.getByTestId('parent-container');
    
    // Click the parent container itself (outside the textarea)
    fireEvent.click(parent);

    // Assert: parentOnClick SHOULD have been called
    expect(parentOnClick).toHaveBeenCalled();
  });

  it('Stops click propagation when clicking SentenceWrapper wrapper element', () => {
    const onUpdate = vi.fn();
    const parentOnClick = vi.fn();

    const { container } = render(
      <div onClick={parentOnClick}>
        <SentenceWrapper
          block={mockBlock}
          onUpdate={onUpdate}
          onFocus={vi.fn()}
          onBlur={vi.fn()}
          actions={{} as any}
        />
      </div>
    );

    // Find the SentenceWrapper element (the motion.div container)
    const wrapper = container.querySelector('[data-blueprint="SentenceWrapper"]');
    expect(wrapper).not.toBeNull();
    
    // Simulate a click on the wrapper (padding/margins area)
    fireEvent.click(wrapper!);

    // Assert: parentOnClick should NOT have been called because of e.stopPropagation() on SentenceWrapper
    expect(parentOnClick).not.toHaveBeenCalled();
  });

  it('Focuses the textarea and moves cursor to end when clicking SentenceWrapper wrapper element', () => {
    const { container } = render(
      <SentenceWrapper
        block={mockBlock}
        onUpdate={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        actions={{} as any}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const wrapper = container.querySelector('[data-blueprint="SentenceWrapper"]');
    
    // Spy on the focus method of textarea
    const focusSpy = vi.spyOn(textarea, 'focus');

    // Click the wrapper
    fireEvent.click(wrapper!);

    // Assert: focus should have been called on the textarea and cursor moved to the end
    expect(focusSpy).toHaveBeenCalled();
    expect(textarea.selectionStart).toBe(mockBlock.text.length);
    expect(textarea.selectionEnd).toBe(mockBlock.text.length);
  });

  it('Double Defense: parent container click handler does not jump cursor if click is inside SentenceWrapper', () => {
    const textareaMock = {
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
    };

    const parentOnClick = vi.fn((e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-blueprint="SentenceWrapper"]')) {
        return;
      }
      // Simulate the cursor jump behavior
      const len = 11; // 'Hello world'.length
      textareaMock.setSelectionRange(len, len);
    });

    const { container } = render(
      <div onClick={parentOnClick} data-testid="story-hook-container">
        <SentenceWrapper
          block={mockBlock}
          onUpdate={vi.fn()}
          onFocus={vi.fn()}
          onBlur={vi.fn()}
          actions={{} as any}
        />
      </div>
    );

    const wrapper = container.querySelector('[data-blueprint="SentenceWrapper"]');
    
    // Simulate click bubbling or direct handler call with the wrapper as target
    const mockEvent = {
      target: wrapper,
      currentTarget: screen.getByTestId('story-hook-container'),
    } as unknown as React.MouseEvent<HTMLDivElement>;

    parentOnClick(mockEvent);

    // Since clicked inside SentenceWrapper, parentOnClick returns early and selection is NOT forced
    expect(textareaMock.setSelectionRange).not.toHaveBeenCalled();
  });

  it('Guardrail 1: Snaps caret to end (len) when clicking trailing whitespace inside textarea (selectionStart >= value.trimEnd().length)', () => {
    const trailingBlock = {
      id: 'trailing-block',
      text: 'Hello world   ',
      type: 'hook' as const,
      catalysts: [],
    };

    render(
      <SentenceWrapper
        block={trailingBlock}
        onUpdate={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        actions={{} as any}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const focusSpy = vi.spyOn(textarea, 'focus');
    const selectionSpy = vi.spyOn(textarea, 'setSelectionRange');

    // Place collapsed caret at trimEnd boundary (index 11 of 14)
    textarea.setSelectionRange(11, 11);
    selectionSpy.mockClear();

    fireEvent.click(textarea);

    expect(focusSpy).toHaveBeenCalled();
    expect(selectionSpy).toHaveBeenCalledWith(trailingBlock.text.length, trailingBlock.text.length);
    expect(textarea.selectionStart).toBe(trailingBlock.text.length);
    expect(textarea.selectionEnd).toBe(trailingBlock.text.length);
  });

  it('Guardrail 2: Preserves mid-sentence caret and highlighted text ranges without yanking to len', () => {
    const proseBlock = {
      id: 'prose-block',
      text: 'The history I carry is an epic journey across oceans.',
      type: 'hook' as const,
      catalysts: [],
    };

    render(
      <SentenceWrapper
        block={proseBlock}
        onUpdate={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        actions={{} as any}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const selectionSpy = vi.spyOn(textarea, 'setSelectionRange');

    // Case A: Mid-sentence click (selectionStart < value.trimEnd().length)
    textarea.setSelectionRange(4, 4);
    selectionSpy.mockClear();
    fireEvent.click(textarea);

    expect(selectionSpy).not.toHaveBeenCalled();
    expect(textarea.selectionStart).toBe(4);
    expect(textarea.selectionEnd).toBe(4);

    // Case B: Dragged text selection (selectionStart !== selectionEnd)
    textarea.setSelectionRange(4, 11);
    selectionSpy.mockClear();
    fireEvent.click(textarea);

    expect(selectionSpy).not.toHaveBeenCalled();
    expect(textarea.selectionStart).toBe(4);
    expect(textarea.selectionEnd).toBe(11);
  });

  it('Guardrail 3: Dynamic height sync resets height to auto and matches mirror/scrollHeight reflow with scrollTop locked to 0', () => {
    const multiLineBlock = {
      id: 'multiline-block',
      text: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6',
      type: 'hook' as const,
      catalysts: [],
    };

    const { rerender, container } = render(
      <SentenceWrapper
        block={multiLineBlock}
        onUpdate={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        actions={{} as any}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const mirrorDiv = container.querySelector('[aria-hidden="true"]') as HTMLDivElement;

    // Simulate mirror reflow (e.g. Courier font load expands mirror to 216px)
    Object.defineProperty(mirrorDiv, 'offsetHeight', { value: 216, configurable: true });
    Object.defineProperty(textarea, 'scrollHeight', { value: 216, configurable: true });

    // Trigger input / reflow
    fireEvent.input(textarea);

    expect(textarea.style.height).toBe('216px');
    expect(textarea.scrollTop).toBe(0);

    // Simulate onScroll event locking scrollTop to 0
    textarea.scrollTop = 25;
    fireEvent.scroll(textarea);
    expect(textarea.scrollTop).toBe(0);

    // Simulate deletion shrinking height
    Object.defineProperty(mirrorDiv, 'offsetHeight', { value: 72, configurable: true });
    Object.defineProperty(textarea, 'scrollHeight', { value: 72, configurable: true });

    rerender(
      <SentenceWrapper
        block={{ ...multiLineBlock, text: 'Line 1\nLine 2' }}
        onUpdate={vi.fn()}
        onFocus={vi.fn()}
        onBlur={vi.fn()}
        actions={{} as any}
      />
    );

    expect(textarea.style.height).toBe('72px');
    expect(textarea.scrollTop).toBe(0);
  });
});
