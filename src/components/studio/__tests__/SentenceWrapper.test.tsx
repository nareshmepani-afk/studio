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
});
