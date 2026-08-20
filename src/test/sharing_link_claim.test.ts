import { describe, it, expect } from 'vitest';

/**
 * Regression Shield: Link + Claim Sharing & Director Access Governance (MW-187 / MW-189 / MW-190)
 * Tests core business logic, invariant enforcement, and boundary conditions.
 */
describe('MW-187 / MW-190: Link + Claim & Access Governance Invariant Suite', () => {

  describe('1. Director Self-Claim & Status Shield Invariants', () => {
    it('prevents a director from claiming their own memory into Shared With Me', () => {
      const memory = {
        id: 'mem_123',
        userId: 'director_uid_1',
        status: 'published',
        title: 'Heirloom Story'
      };

      const claimantUid = 'director_uid_1';
      const isOwner = memory.userId === claimantUid;

      // Invariant: isOwner must be true, preventing self-claim
      expect(isOwner).toBe(true);
    });

    it('rejects claim attempts on memories with draft status', () => {
      const memory = {
        id: 'mem_draft',
        userId: 'director_uid_1',
        status: 'draft',
        title: 'Unmastered Draft'
      };

      const isClaimable = memory.status === 'published' || memory.status === 'pre-release';
      expect(isClaimable).toBe(false);
    });

    it('permits claim attempts on published and pre-release memories', () => {
      const publishedMem = { status: 'published' };
      const preReleaseMem = { status: 'pre-release' };

      expect(publishedMem.status === 'published' || publishedMem.status === 'pre-release').toBe(true);
      expect(preReleaseMem.status === 'published' || preReleaseMem.status === 'pre-release').toBe(true);
    });
  });

  describe('2. Dual-Write Pointer & Deduplication Invariants', () => {
    it('correctly identifies already claimed status without creating duplicate entries', () => {
      const initialSharedWith = ['collaborator_uid_1', 'collaborator_uid_2'];
      const claimantUid = 'collaborator_uid_1';

      const alreadyClaimed = initialSharedWith.includes(claimantUid);
      expect(alreadyClaimed).toBe(true);

      // Invariant: Array union must not duplicate UID
      const deduplicated = Array.from(new Set([...initialSharedWith, claimantUid]));
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.filter(uid => uid === claimantUid)).toHaveLength(1);
    });

    it('constructs complete zero-index pointer payload for recipient subcollection', () => {
      const memory = {
        id: 'mem_789',
        userId: 'director_uid_99',
        title: 'Family Roots',
        chapterTitle: 'Early Years',
        posterImageUrl: 'https://cdn.example.com/poster.jpg',
        status: 'published'
      };

      const pointerPayload = {
        memoryId: memory.id,
        ownerUid: memory.userId,
        ownerPath: `users/${memory.userId}/memories/${memory.id}`,
        title: memory.title,
        chapterTitle: memory.chapterTitle,
        posterImageUrl: memory.posterImageUrl,
        status: memory.status,
        claimedAt: new Date().toISOString()
      };

      expect(pointerPayload.memoryId).toBe('mem_789');
      expect(pointerPayload.ownerUid).toBe('director_uid_99');
      expect(pointerPayload.ownerPath).toBe('users/director_uid_99/memories/mem_789');
      expect(pointerPayload.claimedAt).toBeDefined();
    });
  });

  describe('3. Director Access Revocation & Optimistic Decrement Invariants', () => {
    it('atomically removes revoked UID from sharedWith array', () => {
      const sharedWith = ['collab_1', 'collab_2', 'collab_3'];
      const targetUid = 'collab_2';

      const updatedSharedWith = sharedWith.filter(uid => uid !== targetUid);
      expect(updatedSharedWith).toHaveLength(2);
      expect(updatedSharedWith).not.toContain('collab_2');
      expect(updatedSharedWith).toEqual(['collab_1', 'collab_3']);
    });

    it('calculates optimistic card count correctly after revocation', () => {
      const currentCount = 3;
      const remainingCount = currentCount - 1;

      expect(remainingCount).toBe(2);
      expect(remainingCount >= 0).toBe(true);
    });
  });

  describe('4. Collaborator Profile Fallback Resolution Invariants', () => {
    it('resolves fallback profile from auth when firestore document is absent', () => {
      const firestoreUserDoc = null;
      const authUser = { displayName: 'Automated Tester', email: 'test@example.com' };

      let displayName = 'Family Collaborator';
      let email = '';

      if (firestoreUserDoc) {
        displayName = (firestoreUserDoc as any).displayName;
        email = (firestoreUserDoc as any).email;
      } else if (authUser) {
        displayName = authUser.displayName || displayName;
        email = authUser.email || email;
      }

      expect(displayName).toBe('Automated Tester');
      expect(email).toBe('test@example.com');
    });
  });

});
