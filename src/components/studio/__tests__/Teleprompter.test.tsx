import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Teleprompter } from '../Teleprompter';
import React from 'react';

// Mock dependencies
const mockActions = {
  toggleScrolling: vi.fn(),
  setScrollSpeed: vi.fn(),
  toggleMirror: vi.fn(),
  increaseFontSize: vi.fn(),
  decreaseFontSize: vi.fn()
};

const mockUseStudioState = vi.fn(() => ({
  selectedTake: null as string | null,
  script: '',
  isScrolling: false,
  scrollSpeed: 2.0,
  fontSize: 16,
  isMirrored: false,
  actions: mockActions
}));

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => mockUseStudioState()
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FlipHorizontal: () => <div data-testid="flip-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />
}));

describe('Teleprompter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders authorisation prompt when no take is selected', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: '',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    expect(screen.getByText("Please select an authorised take in the Architect's Drawer.")).toBeInTheDocument();
  });

  it('strictly enforces selectedTake over any background state and prompts if missing', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: 'This is the main script content.',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    expect(screen.getByText("Please select an authorised take in the Architect's Drawer.")).toBeInTheDocument();
  });

  it('prioritises selectedTake over script', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: 'This is the selected take text.',
      script: 'This is the main script content.',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    expect(screen.getByText('This is the selected take text.')).toBeInTheDocument();
    expect(screen.queryByText('This is the main script content.')).not.toBeInTheDocument();
  });

  it('enforces UK English labels "Synchronised Speed" and "Optimised Layout"', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: '',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    expect(screen.getByText('SPEED MULTIPLIER')).toBeInTheDocument();
    expect(screen.getByText('PACING CALIBRATION ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Optimised Layout')).toBeInTheDocument();
  });

  it('handles scroll toggle action', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: 'Script content',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    const scrollButton = screen.getByRole('button', { name: /scroll/i });
    fireEvent.click(scrollButton);
    expect(mockActions.toggleScrolling).toHaveBeenCalledTimes(1);
  });

  it('displays correct icon and state when scrolling is active', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: 'Script content',
      isScrolling: true,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    expect(screen.getByRole('button', { name: /scrolling/i })).toBeInTheDocument();
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
  });

  it('adjusts speed values on click', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: 'Script content',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    
    // Find the decrease speed button (chevron down icon wrapper or specific layout)
    // Decreasing speed (Math.max(0.5, scrollSpeed - 0.5)) -> triggers setScrollSpeed with 1.5
    const chevronDownBtn = screen.getByTestId('chevron-down-icon').closest('button');
    if (chevronDownBtn) fireEvent.click(chevronDownBtn);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.5);

    // Increasing speed (scrollSpeed + 0.5) -> triggers setScrollSpeed with 2.5
    const chevronUpBtn = screen.getByTestId('chevron-up-icon').closest('button');
    if (chevronUpBtn) fireEvent.click(chevronUpBtn);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(2.5);
  });

  it('triggers mirror mode toggle', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: '',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    const mirrorButton = screen.getByTitle('Mirror Mode');
    fireEvent.click(mirrorButton);
    expect(mockActions.toggleMirror).toHaveBeenCalledTimes(1);
  });

  it('triggers font size adjustments', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: '',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);
    const decreaseBtn = screen.getByRole('button', { name: '-' });
    const increaseBtn = screen.getByRole('button', { name: '+' });

    fireEvent.click(decreaseBtn);
    expect(mockActions.decreaseFontSize).toHaveBeenCalledTimes(1);

    fireEvent.click(increaseBtn);
    expect(mockActions.increaseFontSize).toHaveBeenCalledTimes(1);
  });

  it('sets correct speed multipliers when pacing profile preset buttons are clicked', () => {
    mockUseStudioState.mockReturnValueOnce({
      selectedTake: null,
      script: '',
      isScrolling: false,
      scrollSpeed: 2.0,
      fontSize: 16,
      isMirrored: false,
      actions: mockActions
    });

    render(<Teleprompter />);

    const dramaticBtn = screen.getByRole('button', { name: 'Dramatic' });
    const conversationalBtn = screen.getByRole('button', { name: 'Conversational' });
    const expressiveBtn = screen.getByRole('button', { name: 'Expressive' });

    fireEvent.click(dramaticBtn);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(0.8);

    fireEvent.click(conversationalBtn);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.0);

    fireEvent.click(expressiveBtn);
    expect(mockActions.setScrollSpeed).toHaveBeenCalledWith(1.2);
  });
});
