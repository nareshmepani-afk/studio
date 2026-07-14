import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductionDeckContainer } from '../ProductionDeckContainer';
import { useStudioData } from '@/hooks/studio/useStudioData';
import React from 'react';

// Mock language hook
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ mode: 'en' }),
}));

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user-123' },
    loading: false,
  }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/studio/production',
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
}));

// Mock the child components for ProductionDeckContainer
vi.mock('../ProductionDeck', () => {
  return {
    __esModule: true,
    default: ({ memoryData }: any) => {
      return (
        <div 
          data-testid="production-deck" 
          data-prompt-id={memoryData?.promptId} 
          data-memory-id={memoryData?.id}
        >
          Deck Loaded
        </div>
      );
    }
  };
});

// Mock firebase/firestore
let memoriesCallback: any = null;
let requestsCallback: any = null;

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((db, ...paths) => {
      return { id: paths[paths.length - 1] };
    }),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    onSnapshot: vi.fn((q, callback) => {
      if (q && q.id === 'memories') {
        memoriesCallback = callback;
      } else if (q && q.id === 'requests') {
        requestsCallback = callback;
      }
      return vi.fn(); // unsubscribe
    }),
  };
});

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('State Machine: Memory Chain Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoriesCallback = null;
    requestsCallback = null;
  });

  it('ProductionDeckContainer resolves a document ID with recursive trace backward', async () => {
    // 1. Render ProductionDeckContainer with a leaf document ID in the URL
    // URL ID = 'docC'. The chain is: p1 <- docA <- docB <- docC
    render(
      <ProductionDeckContainer promptId="docC" />
    );

    // Initial state: loading (Preparing Stage...) because memories are not yet loaded
    expect(screen.queryByTestId('production-deck')).toBeNull();
    expect(screen.getByText('Preparing Stage...')).toBeDefined();

    // 2. Simulate Firestore returning the memories chain
    const mockMemories = [
      { id: 'docA', data: () => ({ promptId: 'p1', title: 'Doc A title' }) },
      { id: 'docB', data: () => ({ promptId: 'docA', title: 'Doc B title' }) },
      { id: 'docC', data: () => ({ promptId: 'docB', title: 'Doc C title' }) },
    ];

    await act(async () => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories
        });
      }
      if (requestsCallback) {
        requestsCallback({
          docs: []
        });
      }
    });

    // 3. Verify that the deck successfully loaded
    const deck = screen.getByTestId('production-deck');
    expect(deck).toBeDefined();
    
    // 4. Verify the Clean State Enforcer: promptId must be resolved to the root template ID 'p1'
    expect(deck.getAttribute('data-prompt-id')).toBe('p1');
    expect(deck.getAttribute('data-memory-id')).toBe('docC');
  });

  it('useStudioData correlates prompt template to the latest leaf in a nested memory chain (trace forward)', async () => {
    // Render the hook
    const { result } = renderHook(() => useStudioData('user-123'));

    // Initially, memories is empty
    expect(result.current.memories).toEqual([]);

    // Simulate Firestore snapshot update for memories
    const mockMemories = [
      { id: 'docA', data: () => ({ promptId: 'p1', title: 'Doc A title' }) },
      { id: 'docB', data: () => ({ promptId: 'docA', title: 'Doc B title' }) },
      { id: 'docC', data: () => ({ promptId: 'docB', title: 'Doc C title' }) },
    ];

    await act(async () => {
      if (memoriesCallback) {
        memoriesCallback({
          docs: mockMemories
        });
      }
      if (requestsCallback) {
        requestsCallback({
          docs: []
        });
      }
    });

    // Check mapped memory for prompt 'p1'
    const p1Chapter = result.current.chapters
      .flatMap(c => c.prompts)
      .find(p => p.id === 'p1');

    expect(p1Chapter).toBeDefined();
    expect(p1Chapter?.memory).toBeDefined();
    // It must trace forward to the leaf: 'docC'
    expect(p1Chapter?.memory?.id).toBe('docC');
    expect(p1Chapter?.memory?.title).toBe('Doc C title');
  });
});
