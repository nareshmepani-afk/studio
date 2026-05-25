import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInterviewMode } from '@/hooks/studio/useInterviewMode';

describe('useInterviewMode Step-Through Controller Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Initializes with default scripted mode and zero index', () => {
    const { result } = renderHook(() => useInterviewMode());

    expect(result.current.modalityMode).toBe('scripted');
    expect(result.current.activeBeatIndex).toBe(0);
  });

  it('Successfully toggles modalityMode between scripted and interview', () => {
    const { result } = renderHook(() => useInterviewMode());

    act(() => {
      result.current.toggleModalityMode();
    });
    expect(result.current.modalityMode).toBe('interview');

    act(() => {
      result.current.toggleModalityMode();
    });
    expect(result.current.modalityMode).toBe('scripted');
  });

  it('Smoothly slides and centers the next beat block inside the prompter scroll container', () => {
    const { result } = renderHook(() => useInterviewMode());

    // Mock HTML Elements and Query Selector
    const mockBlock1 = { offsetTop: 100, clientHeight: 50 } as any;
    const mockBlock2 = { offsetTop: 300, clientHeight: 50 } as any;
    const mockBlock3 = { offsetTop: 500, clientHeight: 50 } as any;

    const querySelectorAllMock = vi.fn().mockReturnValue([mockBlock1, mockBlock2, mockBlock3]);
    const scrollToMock = vi.fn();

    const mockContainer = {
      scrollTop: 0,
      clientHeight: 400,
      querySelectorAll: querySelectorAllMock,
      scrollTo: scrollToMock
    } as any;

    // Trigger next cue to advance from start (center is container.scrollTop + clientHeight/2 = 200)
    // First block is offsetTop 100 (above center 200). Second block is 300 (below center 200), so next block is Block 2 (index 1).
    act(() => {
      result.current.triggerNextCue(mockContainer);
    });

    expect(querySelectorAllMock).toHaveBeenCalled();
    // Calculated scrollTop for Block 2 (index 1): nextBlock.offsetTop (300) - clientHeight/2 (200) + clientHeight/2 (25) = 125
    expect(scrollToMock).toHaveBeenCalledWith({
      top: 125,
      behavior: 'smooth'
    });
    expect(result.current.activeBeatIndex).toBe(1);
  });
});
