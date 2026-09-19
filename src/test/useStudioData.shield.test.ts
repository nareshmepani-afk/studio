import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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

let memoriesCallback: any = null;
let requestsCallback: any = null;

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    if (!memoriesCallback) {
      memoriesCallback = callback;
    } else {
      requestsCallback = callback;
    }
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
    memoriesCallback = null;
    requestsCallback = null;
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

  it('prioritises authentic completed/mastered memories over stage-0 test fixture drafts matching the same promptId', () => {
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };

    const { result } = renderHook(() => useStudioData('user_naresh_123'));

    // Simulate Firestore delivering a test fixture draft created AFTER an authentic recorded memory
    const mockMemories = [
      { 
        id: 'tech_scout_draft_test', 
        promptId: 'p1', 
        title: 'The First Journey (Draft Pre-Flight)', 
        status: 'draft', 
        productionStage: 0,
        createdAt: '2026-09-17T20:00:00.000Z' 
      },
      { 
        id: 'ey96djU6qR1BrDGnvZwp', 
        promptId: 'p1', 
        title: 'A Child of Two Worlds', 
        status: 'pre-release', 
        productionStage: 4,
        createdAt: '2026-06-29T17:20:53.139Z' 
      },
    ];

    act(() => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories.map(m => ({
            id: m.id,
            data: () => m
          }))
        });
      }
    });

    const p1Chapter = result.current.chapters
      .flatMap(c => c.prompts)
      .find(p => p.id === 'p1');

    expect(p1Chapter).toBeDefined();
    expect(p1Chapter?.memory).toBeDefined();
    // Shield must select authentic pre-release memory 'ey96djU6qR1BrDGnvZwp' over 'tech_scout_draft_test'
    expect(p1Chapter?.memory?.id).toBe('ey96djU6qR1BrDGnvZwp');
    expect(p1Chapter?.memory?.title).toBe('A Child of Two Worlds');
    expect(p1Chapter?.memory?.status).toBe('pre-release');
  });
});
