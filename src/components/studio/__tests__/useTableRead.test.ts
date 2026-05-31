import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTableRead } from '@/hooks/studio/useTableRead';

describe('useTableRead Calibration & Snapshot Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Initializes with correct default rehearsal states', () => {
    const { result } = renderHook(() => useTableRead());

    expect(result.current.isTableReadActive).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.rehearsalSpeed).toBe(1.5);
  });

  it('Successfully captures the pre-rehearsal layout coordinates', () => {
    const { result } = renderHook(() => useTableRead());

    act(() => {
      result.current.captureLayoutSnapshot('side', 'md', 24);
    });

    expect(result.current.snapshot).toEqual({
      layout: 'side',
      size: 'md',
      fontSize: 24
    });
  });

  it('Successfully delivers and restores the snapshot parameters during handshake', () => {
    const { result } = renderHook(() => useTableRead());

    act(() => {
      result.current.captureLayoutSnapshot('center', 'lg', 32);
    });

    let restored = null;
    act(() => {
      restored = result.current.restoreLayoutSnapshot();
    });

    expect(restored).toEqual({
      layout: 'center',
      size: 'lg',
      fontSize: 32
    });
  });

  it('Allows independent pacing speed multiplier adjustments', () => {
    const { result } = renderHook(() => useTableRead());

    act(() => {
      result.current.setRehearsalSpeed(2.2);
    });

    expect(result.current.rehearsalSpeed).toBe(2.2);
  });
});
