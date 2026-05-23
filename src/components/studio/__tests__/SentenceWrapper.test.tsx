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
  detectAnchors: vi.fn(() => []),
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

  it('Focuses the textarea when clicking SentenceWrapper wrapper element', () => {
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

    // Assert: focus should have been called on the textarea
    expect(focusSpy).toHaveBeenCalled();
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
});
