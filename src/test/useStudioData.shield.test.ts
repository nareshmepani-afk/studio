import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStudioData } from '@/hooks/studio/useStudioData';

// Mock dependencies
let mockAuthLoading = true;
let mockUser: any = null;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    mode: 'en',
  }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    return () => {};
  }),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('useStudioData Loading Shield', () => {
  beforeEach(() => {
    mockAuthLoading = true;
    mockUser = null;
  });

  it('initializes with isLoading: true while auth is loading', () => {
    const { result } = renderHook(() => useStudioData('guest'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.memories).toEqual([]);
  });

  it('keeps isLoading: true if auth is in flight even with guest string', () => {
    mockAuthLoading = true;
    mockUser = null;
    const { result, rerender } = renderHook(() => useStudioData(mockUser?.uid || 'guest'));
    expect(result.current.isLoading).toBe(true);

    // Auth resolves as authenticated user
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };
    rerender();
    expect(result.current.isLoading).toBe(true);
  });
});
