import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFoldableCanvas } from '@/hooks/useFoldableCanvas';

describe('Smart Viewport & Foldable Device Detection Suite (useFoldableCanvas)', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  it('identifies folded Samsung Galaxy Fold as handheld phone (<600px, aspect ~0.43)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 344 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

    const { result } = renderHook(() => useFoldableCanvas());

    expect(result.current.width).toBe(344);
    expect(result.current.isFoldableOrTabletCanvas).toBe(false);
    expect(result.current.isLargeScreen).toBe(false);
    expect(result.current.aspectRatio).toBeCloseTo(0.43, 2);
  });

  it('identifies standard iPhone/Pixel portrait as handheld phone (<600px, aspect ~0.46)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });

    const { result } = renderHook(() => useFoldableCanvas());

    expect(result.current.width).toBe(390);
    expect(result.current.isFoldableOrTabletCanvas).toBe(false);
    expect(result.current.isLargeScreen).toBe(false);
  });

  it('identifies unfolded Samsung Galaxy Fold in portrait as foldable tablet canvas (>=600px, aspect >=0.85)', () => {
    // Physical: 1845x2048, Viewport: ~673x748 (aspect 0.90)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 673 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 748 });

    const { result } = renderHook(() => useFoldableCanvas());

    expect(result.current.width).toBe(673);
    expect(result.current.aspectRatio).toBeGreaterThanOrEqual(0.85);
    expect(result.current.isFoldableOrTabletCanvas).toBe(true);
    expect(result.current.isLargeScreen).toBe(true);
  });

  it('identifies standard iPad portrait as large screen (>=768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });

    const { result } = renderHook(() => useFoldableCanvas());

    expect(result.current.width).toBe(768);
    expect(result.current.isLargeScreen).toBe(true);
  });

  it('identifies desktop screen as large screen (>=1024px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

    const { result } = renderHook(() => useFoldableCanvas());

    expect(result.current.width).toBe(1440);
    expect(result.current.isLargeScreen).toBe(true);
  });

  it('dynamically responds to window resize events when folding/unfolding', () => {
    // Start folded
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 344 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

    const { result } = renderHook(() => useFoldableCanvas());
    expect(result.current.isLargeScreen).toBe(false);

    // Unfold device
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 700 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 750 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(700);
    expect(result.current.isFoldableOrTabletCanvas).toBe(true);
    expect(result.current.isLargeScreen).toBe(true);
  });
});
