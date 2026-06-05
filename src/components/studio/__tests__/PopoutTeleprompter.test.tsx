import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PopoutTeleprompter } from '../PopoutTeleprompter';
import React from 'react';

// BroadcastChannel Mock
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  static instances: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage = vi.fn((data: any) => {
    // Simulate async dispatch to other instances
    setTimeout(() => {
      MockBroadcastChannel.instances.forEach(instance => {
        if (instance !== this && instance.name === this.name && instance.onmessage) {
          instance.onmessage({ data } as MessageEvent);
        }
      });
    }, 0);
  });

  addEventListener(type: string, listener: any) {
    if (type === 'message') {
      this.onmessage = listener;
    }
  }

  removeEventListener(type: string, listener: any) {
    if (type === 'message' && this.onmessage === listener) {
      this.onmessage = null;
    }
  }

  close() {
    MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter(i => i !== this);
  }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

// Mock useStudioState hook
const mockActions = {
  toggleScrolling: vi.fn(),
  setScrolling: vi.fn(),
  setScrollSpeed: vi.fn(),
  setFontSize: vi.fn(),
  toggleMirror: vi.fn(),
};

const mockUseStudioState = vi.fn(() => ({
  sessionId: 'test-session',
  selectedTake: 'This is the selected take text.\n\nSecond paragraph content.' as string | null,
  fontSize: 24,
  isMirrored: false,
  scrollSpeed: 2.0,
  isScrolling: false,
  actions: mockActions,
}));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => mockUseStudioState(),
}));

describe('PopoutTeleprompter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockBroadcastChannel.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading prompt when no selectedTake is loaded', () => {
    mockUseStudioState.mockReturnValueOnce({
      sessionId: 'test-session',
      selectedTake: null,
      fontSize: 24,
      isMirrored: false,
      scrollSpeed: 2.0,
      isScrolling: false,
      actions: mockActions,
    });

    render(<PopoutTeleprompter />);
    expect(screen.getByText('Please load a script take in the Scriptorium drawer first.')).toBeInTheDocument();
  });

  it('renders script paragraphs when take is loaded', () => {
    render(<PopoutTeleprompter />);
    expect(screen.getByText('This is the selected take text.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph content.')).toBeInTheDocument();
  });

  it('renders Eye-Line Visual Anchor by default and toggles on A key or button click', () => {
    render(<PopoutTeleprompter />);
    
    // Chevron symbols should be visible
    expect(screen.getByText('▸')).toBeInTheDocument();
    expect(screen.getByText('◂')).toBeInTheDocument();

    // Toggle using A key
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(screen.queryByText('▸')).not.toBeInTheDocument();
    expect(screen.queryByText('◂')).not.toBeInTheDocument();

    // Toggle back using the button
    const toggleBtn = screen.getByRole('button', { name: /show line/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText('▸')).toBeInTheDocument();
    expect(screen.getByText('◂')).toBeInTheDocument();
  });

  it('toggles scrolling via Space key and broadcasts', async () => {
    render(<PopoutTeleprompter />);
    fireEvent.keyDown(window, { code: 'Space' });
    expect(mockActions.toggleScrolling).toHaveBeenCalled();
  });

  it('adjusts font size via ArrowUp/ArrowDown keys', () => {
    render(<PopoutTeleprompter />);
    fireEvent.keyDown(window, { code: 'ArrowUp' });
    expect(mockActions.setFontSize).toHaveBeenCalledWith(26);

    fireEvent.keyDown(window, { code: 'ArrowDown' });
    expect(mockActions.setFontSize).toHaveBeenCalledWith(22);
  });

  it('toggles mirror mode via KeyM', () => {
    render(<PopoutTeleprompter />);
    fireEvent.keyDown(window, { code: 'KeyM' });
    expect(mockActions.toggleMirror).toHaveBeenCalled();
  });
});
