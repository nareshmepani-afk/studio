import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVideoSequencer, EDLTrackSegment } from '@/hooks/studio/useVideoSequencer';

describe('useVideoSequencer Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      // Return a dummy ID
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  const createMockVideo = () => ({
    src: '',
    currentTime: 0,
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    removeAttribute: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
  });

  it('Initializes with default states', () => {
    const edl: EDLTrackSegment[] = [
      { segmentId: 'seg-1', blobUrl: 'url-1', startOffset: 0, endOffset: 5, duration: 5 },
    ];
    const { result } = renderHook(() => useVideoSequencer({ edl }));

    expect(result.current.activeBuffer).toBe('A');
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSegmentIndex).toBe(0);
    expect(result.current.cumulativeTime).toBe(0);
  });

  it('Clamps currentSegmentIndex if EDL shrinks below index bounds', () => {
    const initialEdl: EDLTrackSegment[] = [
      { segmentId: 'seg-1', blobUrl: 'url-1', startOffset: 0, endOffset: 5, duration: 5 },
      { segmentId: 'seg-2', blobUrl: 'url-1', startOffset: 5, endOffset: 10, duration: 5 },
    ];

    const { result, rerender } = renderHook(
      ({ edl }) => useVideoSequencer({ edl }),
      { initialProps: { edl: initialEdl } }
    );

    // Manually set segment index to 1
    act(() => {
      result.current.seekTo(7);
    });
    expect(result.current.currentSegmentIndex).toBe(1);

    // Shrink EDL so only 1 segment remains
    const newEdl = [initialEdl[0]];
    rerender({ edl: newEdl });

    expect(result.current.currentSegmentIndex).toBe(0);
  });

  it('Force syncs playhead to startOffset when EDL segment shifts due to deletion', () => {
    const initialEdl: EDLTrackSegment[] = [
      { segmentId: 'seg-1', blobUrl: 'url-1', startOffset: 0, endOffset: 5, duration: 5 },
      { segmentId: 'seg-2', blobUrl: 'url-1', startOffset: 5, endOffset: 10, duration: 5 },
      { segmentId: 'seg-3', blobUrl: 'url-1', startOffset: 10, endOffset: 15, duration: 5 },
    ];

    const { result, rerender } = renderHook(
      ({ edl }) => useVideoSequencer({ edl }),
      { initialProps: { edl: initialEdl } }
    );

    const mockVideoA = createMockVideo();
    mockVideoA.src = 'url-1';
    mockVideoA.currentTime = 7; // Currently in the middle of seg-2

    result.current.videoARef.current = mockVideoA as any;

    // Set segment index to index 1 (seg-2)
    act(() => {
      result.current.seekTo(7);
    });
    expect(result.current.currentSegmentIndex).toBe(1);

    // Simulate deleting seg-2 (index 1 shifts to seg-3)
    const newEdl = [initialEdl[0], initialEdl[2]];
    rerender({ edl: newEdl });

    // Expect playhead to be forced to seg-3's startOffset (10)
    expect(mockVideoA.currentTime).toBe(10);
    expect(result.current.cumulativeTime).toBe(5); // leadTime = seg-1 duration = 5
  });

  it('Does NOT force sync playhead on split operations (prefix match)', () => {
    const initialEdl: EDLTrackSegment[] = [
      { segmentId: 'seg-1', blobUrl: 'url-1', startOffset: 0, endOffset: 10, duration: 10 },
    ];

    const { result, rerender } = renderHook(
      ({ edl }) => useVideoSequencer({ edl }),
      { initialProps: { edl: initialEdl } }
    );

    const mockVideoA = createMockVideo();
    mockVideoA.src = 'url-1';
    mockVideoA.currentTime = 4;

    result.current.videoARef.current = mockVideoA as any;

    // Set segment index to index 0 (seg-1)
    act(() => {
      result.current.seekTo(4);
    });

    // Simulate split: seg-1 split into seg-1_pt1 and seg-1_pt2
    const newEdl: EDLTrackSegment[] = [
      { segmentId: 'seg-1_pt1', blobUrl: 'url-1', startOffset: 0, endOffset: 4, duration: 4 },
      { segmentId: 'seg-1_pt2', blobUrl: 'url-1', startOffset: 4, endOffset: 10, duration: 6 },
    ];
    rerender({ edl: newEdl });

    // Expect playhead to remain at 4 (not forced back to startOffset 0 of seg-1_pt1)
    expect(mockVideoA.currentTime).toBe(4);
  });
});
