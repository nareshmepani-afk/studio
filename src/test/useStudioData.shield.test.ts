import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

let originalBroadcastChannel: any;
let mockChannels: Map<string, any[]> = new Map();

describe('useStudioData Loading Shield', () => {
  beforeEach(() => {
    mockChannels = new Map();
    originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = class MockBroadcastChannel {
      name: string;
      onmessage: ((e: any) => void) | null = null;
      constructor(name: string) {
        this.name = name;
        const list = mockChannels.get(name) || [];
        list.push(this);
        mockChannels.set(name, list);
      }
      postMessage(data: any) {
        const list = mockChannels.get(this.name) || [];
        list.forEach((target) => {
          if (target !== this && target.onmessage) {
            target.onmessage({ data } as MessageEvent);
          }
        });
      }
      close() {
        const list = mockChannels.get(this.name) || [];
        mockChannels.set(this.name, list.filter((ch) => ch !== this));
      }
    } as any;
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

  it('correlates memory by document id when document has canonical scene id as id without explicit promptId/sceneId (BUG-MW-143 regression shield)', () => {
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };

    const { result } = renderHook(() => useStudioData('user_naresh_123'));

    // Document saved with id: 'part-1-scene-1' but missing promptId / sceneId
    const mockMemories = [
      {
        id: 'part-1-scene-1',
        title: 'A Child of Two Worlds',
        prose: 'The history I carry is an epic journey across oceans and generations...',
        status: 'draft',
        createdAt: '2026-10-12T13:08:00.000Z',
      },
    ];

    act(() => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories.map(m => ({
            id: m.id,
            data: () => m,
          })),
        });
      }
    });

    const p1Chapter = result.current.chapters
      .flatMap(c => c.prompts)
      .find(p => p.id === 'p1');

    expect(p1Chapter).toBeDefined();
    expect(p1Chapter?.memory).toBeDefined();
    expect(p1Chapter?.memory?.id).toBe('part-1-scene-1');
    expect(p1Chapter?.memory?.prose).toContain('epic journey');
  });

  it('preserves documents lacking createdAt and sorts them via updatedAt', () => {
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };

    const { result } = renderHook(() => useStudioData('user_naresh_123'));

    const mockMemories = [
      {
        id: 'part-2-scene-2',
        title: 'The Shape of Loss',
        prose: 'Looking back, what stays with me most...',
        status: 'draft',
        updatedAt: 1793532000000,
      },
      {
        id: 'part-1-scene-1',
        title: 'A Child of Two Worlds',
        prose: 'First journey...',
        status: 'draft',
        createdAt: '2026-06-29T12:00:00.000Z',
      },
    ];

    act(() => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories.map(m => ({
            id: m.id,
            data: () => m,
          })),
        });
      }
    });

    expect(result.current.memories.length).toBe(2);
    expect(result.current.memories[0].id).toBe('part-2-scene-2');
  });

  it('updates memory state in real-time when BroadcastChannel receives mw_script_sync message', () => {
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };

    const { result } = renderHook(() => useStudioData('user_naresh_123'));

    act(() => {
      const channel = new BroadcastChannel('mw_script_sync');
      channel.postMessage({
        sceneId: 'part-2-scene-2',
        prose: 'Live broadcast prose from Fireside companion',
        timestamp: Date.now(),
      });
    });

    const targetMem = result.current.memories.find(m => m.id === 'part-2-scene-2');
    expect(targetMem).toBeDefined();
    expect(targetMem?.prose).toBe('Live broadcast prose from Fireside companion');
    expect(targetMem?.status).toBe('draft');
  });

  it('suppresses memory rehydration and returns unwritten pristine state when ?clean_slate=true is in URL', () => {
    mockAuthLoading = false;
    mockUser = { uid: 'user_naresh_123' };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = new URL('https://dev.memoryweaver.studio/studio?id=part-1-scene-2&clean_slate=true') as any;

    const { result } = renderHook(() => useStudioData('user_naresh_123'));

    const mockMemories = [
      {
        id: 'part-1-scene-2',
        promptId: 'p2',
        title: 'The House I Grew Up In',
        prose: 'Existing draft narrative from earlier test session...',
        status: 'draft',
        createdAt: '2026-10-20T12:00:00.000Z',
      },
    ];

    act(() => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories.map((m) => ({
            id: m.id,
            data: () => m,
          })),
        });
      }
    });

    const p2Prompt = result.current.chapters
      .flatMap((c) => c.prompts)
      .find((p) => p.id === 'p2');

    expect(p2Prompt).toBeDefined();
    // Memory MUST be suppressed by clean_slate=true
    expect(p2Prompt?.memory).toBeUndefined();
    expect(result.current.memories.find((m) => m.id === 'part-1-scene-2')).toBeUndefined();

    (window as any).location = originalLocation;
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });
});
