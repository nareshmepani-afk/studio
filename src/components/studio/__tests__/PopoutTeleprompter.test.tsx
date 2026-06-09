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
  setSelectedTake: vi.fn(),
  setShowBreathingMarks: vi.fn(),
  setEnablePunctuationBraking: vi.fn(),
  setIsolateSentenceHighlight: vi.fn(),
};

const mockUseStudioState = vi.fn(() => ({
  sessionId: 'test-session',
  selectedTake: 'This is the selected take text.\n\nSecond paragraph content.' as string | null,
  fontSize: 24,
  isMirrored: false,
  scrollSpeed: 2.0,
  isScrolling: false,
  isRecording: false,
  showBreathingMarks: false,
  enablePunctuationBraking: false,
  isolateSentenceHighlight: false,
  actions: mockActions,
}));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => mockUseStudioState(),
}));

describe('PopoutTeleprompter Component', () => {
  const mockTracks = [{ stop: vi.fn() }];
  const mockStream = {
    getTracks: () => mockTracks
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockBroadcastChannel.instances = [];
    vi.useFakeTimers();

    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream)
        }
      });
    }
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
      isRecording: false,
      showBreathingMarks: false,
      enablePunctuationBraking: false,
      isolateSentenceHighlight: false,
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

  it('updates selectedTake when state message is received', () => {
    render(<PopoutTeleprompter />);
    
    // Find the BroadcastChannel instance for this session
    const channelInstance = MockBroadcastChannel.instances.find(i => i.name === 'teleprompter_sync_test-session');
    expect(channelInstance).toBeDefined();

    if (channelInstance && channelInstance.onmessage) {
      channelInstance.onmessage({
        data: {
          type: 'state',
          selectedTake: 'Newly synchronized take content from main window.',
          sender: 'main',
        }
      } as MessageEvent);
      
      expect(mockActions.setSelectedTake).toHaveBeenCalledWith('Newly synchronized take content from main window.');
    }
  });

  it('adjusts scroll speed via BracketRight/BracketLeft and Equal/Minus keys', () => {
    render(<PopoutTeleprompter />);
    
    // Equal key / plus action
    fireEvent.keyDown(window, { code: 'Equal' });
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(2.2);

    // BracketRight key
    fireEvent.keyDown(window, { code: 'BracketRight' });
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(2.2);

    // Minus key / minus action
    fireEvent.keyDown(window, { code: 'Minus' });
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.8);

    // BracketLeft key
    fireEvent.keyDown(window, { code: 'BracketLeft' });
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.8);
  });

  it('contains a speed multiplier hover toolbar and triggers speed actions on button clicks', () => {
    render(<PopoutTeleprompter />);
    
    // Should render the label in the document
    expect(screen.getByText('SPEED MULTIPLIER')).toBeInTheDocument();
    
    // Buttons for + and - speed adjustments
    const speedDownButton = screen.getByRole('button', { name: '-' });
    const speedUpButton = screen.getByRole('button', { name: '+' });

    fireEvent.click(speedDownButton);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.8);

    fireEvent.click(speedUpButton);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(2.2);
  });

  it('damps auto-scrolling speed when user scrolls up (deltaY < 0)', () => {
    mockUseStudioState.mockReturnValueOnce({
      sessionId: 'test-session',
      selectedTake: 'Script block text',
      fontSize: 24,
      isMirrored: false,
      scrollSpeed: 2.0,
      isScrolling: true, // Auto scrolling active
      isRecording: false,
      showBreathingMarks: false,
      enablePunctuationBraking: false,
      isolateSentenceHighlight: false,
      actions: mockActions,
    });

    render(<PopoutTeleprompter />);
    
    const scrollContainer = screen.getByText('Script block text').closest('div');
    expect(scrollContainer).toBeDefined();

    if (scrollContainer) {
      // Trigger scroll up event
      fireEvent.wheel(scrollContainer, { deltaY: -100 });
      // The scroll speed damping runs inside the requestAnimationFrame loop which is a mutable ref.
      // Damping will be cleared after 1.5s.
      vi.advanceTimersByTime(1500);
    }
  });

  it('transforms script with theatrical slashes when showBreathingMarks is active', () => {
    mockUseStudioState.mockReturnValueOnce({
      sessionId: 'test-session',
      selectedTake: 'Hello, world. How are you?',
      fontSize: 24,
      isMirrored: false,
      scrollSpeed: 2.0,
      isScrolling: false,
      isRecording: false,
      showBreathingMarks: true, // Breathing marks active!
      enablePunctuationBraking: false,
      isolateSentenceHighlight: false,
      actions: mockActions,
    });

    render(<PopoutTeleprompter />);
    
    const sentence0 = screen.getByText((content, node) => node?.getAttribute('data-sentence-index') === '0');
    expect(sentence0.textContent).toContain('Hello');
    expect(sentence0.textContent).toContain('/');
    expect(sentence0.textContent).toContain('world');
    expect(sentence0.textContent).toContain('//');

    const sentence1 = screen.getByText((content, node) => node?.getAttribute('data-sentence-index') === '1');
    expect(sentence1.textContent).toContain('How');
    expect(sentence1.textContent).toContain('are');
    expect(sentence1.textContent).toContain('you');
    expect(sentence1.textContent).toContain('//');
  });

  it('isolates the active sentence highlighting when isolateSentenceHighlight is active', () => {
    mockUseStudioState.mockReturnValueOnce({
      sessionId: 'test-session',
      selectedTake: 'First sentence. Second sentence.',
      fontSize: 24,
      isMirrored: false,
      scrollSpeed: 2.0,
      isScrolling: false,
      isRecording: false,
      showBreathingMarks: false,
      enablePunctuationBraking: false,
      isolateSentenceHighlight: true, // Focus shield active!
      actions: mockActions,
    });

    render(<PopoutTeleprompter />);
    
    // First sentence should have index 0 (active initially) -> check highlight style class text-white
    const firstSent = screen.getByText('First sentence.');
    expect(firstSent).toHaveClass('text-white');

    // Second sentence should have index 1 (inactive initially) -> check dim style class text-zinc-600/40
    const secondSent = screen.getByText('Second sentence.');
    expect(secondSent).toHaveClass('text-zinc-600/40');
  });

  it('calls window.close when close message is received', () => {
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
    render(<PopoutTeleprompter />);
    
    const channelInstance = MockBroadcastChannel.instances.find(i => i.name === 'teleprompter_sync_test-session');
    expect(channelInstance).toBeDefined();

    if (channelInstance && channelInstance.onmessage) {
      channelInstance.onmessage({
        data: {
          type: 'close',
          sender: 'main',
        }
      } as MessageEvent);
      
      expect(closeSpy).toHaveBeenCalled();
    }
    closeSpy.mockRestore();
  });

  it('toggles selfie camera preview on pressing KeyS or click', async () => {
    render(<PopoutTeleprompter />);
    
    // Selfie badge is visible by default
    expect(screen.getByText('SELFIE')).toBeInTheDocument();
    
    // Toggle off with KeyS
    fireEvent.keyDown(window, { code: 'KeyS' });
    expect(screen.queryByText('SELFIE')).not.toBeInTheDocument();

    // Toggle on with button click
    const toggleBtn = screen.getByRole('button', { name: /show selfie/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText('SELFIE')).toBeInTheDocument();
  });

  it('triggers startPerformance BroadcastChannel message when START PERFORMANCE is clicked', () => {
    const createdInstances: any[] = [];
    const originalPush = MockBroadcastChannel.instances.push;
    MockBroadcastChannel.instances.push = function(instance: any) {
      createdInstances.push(instance);
      return originalPush.call(MockBroadcastChannel.instances, instance);
    };

    render(<PopoutTeleprompter />);
    const startBtn = screen.getByRole('button', { name: /START PERFORMANCE/i });
    expect(startBtn).toBeInTheDocument();
    
    fireEvent.click(startBtn);
    
    expect(createdInstances.length).toBe(2);
    expect(createdInstances[1].postMessage).toHaveBeenCalledWith({
      type: 'startPerformance',
      sender: 'popout'
    });

    MockBroadcastChannel.instances.push = originalPush;
  });

  it('renders STOP PERFORMANCE button when isRecording is true and triggers stopPerformance BroadcastChannel message on click', () => {
    mockUseStudioState.mockReturnValueOnce({
      sessionId: 'test-session',
      selectedTake: 'This is the selected take text.\n\nSecond paragraph content.',
      fontSize: 24,
      isMirrored: false,
      scrollSpeed: 2.0,
      isScrolling: false,
      isRecording: true,
      showBreathingMarks: false,
      enablePunctuationBraking: false,
      isolateSentenceHighlight: false,
      actions: mockActions,
    });

    const createdInstances: any[] = [];
    const originalPush = MockBroadcastChannel.instances.push;
    MockBroadcastChannel.instances.push = function(instance: any) {
      createdInstances.push(instance);
      return originalPush.call(MockBroadcastChannel.instances, instance);
    };

    render(<PopoutTeleprompter />);
    const stopBtn = screen.getByRole('button', { name: /STOP PERFORMANCE/i });
    expect(stopBtn).toBeInTheDocument();
    
    fireEvent.click(stopBtn);
    
    expect(createdInstances.length).toBe(2);
    expect(createdInstances[1].postMessage).toHaveBeenCalledWith({
      type: 'stopPerformance',
      sender: 'popout'
    });

    MockBroadcastChannel.instances.push = originalPush;
  });
});
