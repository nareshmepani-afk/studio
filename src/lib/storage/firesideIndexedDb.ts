/**
 * 🏺 Fireside Voice Studio Offline-First IndexedDB Vault
 *
 * Milestone: MW-87 (Ticket #248 / MW-247)
 * Governing Rules: Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics
 * Target Route: /studio/fireside
 *
 * Provides a resilient offline persistence shield caching raw WebM audio recordings
 * and compressed heirloom photo attachments locally in IndexedDB before streaming
 * network uploads to Firebase. Prevents data loss from incoming phone calls,
 * app backgrounding, or transient Wi-Fi drops.
 */

import localforage from 'localforage';
import { FiresideLocalVaultRecord } from '@/types/fireside';

// Dedicated IndexedDB store instance isolated from generic application cache
let vaultStore: LocalForage | null = null;

function getVaultStore(): LocalForage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!vaultStore) {
    vaultStore = localforage.createInstance({
      name: 'memory_weaver_fireside',
      storeName: 'draft_vault',
      description: 'Resilient offline storage for spoken memoirs and heirloom photographs',
    });
  }
  return vaultStore;
}

/**
 * Saves or updates a complete Fireside draft record and raw audio blob into the local vault.
 */
export async function saveDraftToVault(record: FiresideLocalVaultRecord): Promise<void> {
  const store = getVaultStore();
  if (!store) return;

  const key = `draft_${record.draftId}`;
  try {
    const recordToSave: FiresideLocalVaultRecord = {
      ...record,
      lastCachedAt: record.lastCachedAt || Date.now(),
    };
    await store.setItem(key, recordToSave);
  } catch (err) {
    console.warn('[FiresideVault] Failed to cache draft in IndexedDB vault:', err);
  }
}

/**
 * Retrieves a cached draft record by its unique draft ID.
 */
export async function getDraftFromVault(draftId: string): Promise<FiresideLocalVaultRecord | null> {
  const store = getVaultStore();
  if (!store) return null;

  const key = `draft_${draftId}`;
  try {
    const item = await store.getItem<FiresideLocalVaultRecord>(key);
    return item || null;
  } catch (err) {
    console.warn(`[FiresideVault] Error retrieving draft ${draftId} from vault:`, err);
    return null;
  }
}

/**
 * Lists all stored memoir drafts, optionally filtered by user ID.
 */
export async function listVaultDrafts(userId?: string): Promise<FiresideLocalVaultRecord[]> {
  const store = getVaultStore();
  if (!store) return [];

  const results: FiresideLocalVaultRecord[] = [];
  try {
    await store.iterate<FiresideLocalVaultRecord, void>((value, key) => {
      if (key.startsWith('draft_') && value) {
        if (!userId || value.userId === userId) {
          results.push(value);
        }
      }
    });
    // Sort descending by lastCachedAt
    return results.sort((a, b) => b.lastCachedAt - a.lastCachedAt);
  } catch (err) {
    console.warn('[FiresideVault] Error listing drafts from vault:', err);
    return [];
  }
}

/**
 * Saves a compressed photograph Blob into the local vault keyed by draft and photo ID.
 */
export async function saveVaultPhotoBlob(
  draftId: string,
  photoId: string,
  blob: Blob
): Promise<void> {
  const store = getVaultStore();
  if (!store) return;

  const key = `photo_${draftId}_${photoId}`;
  try {
    await store.setItem(key, blob);
  } catch (err) {
    console.warn(`[FiresideVault] Error saving photo blob ${photoId} to vault:`, err);
  }
}

/**
 * Retrieves a photograph Blob from the vault.
 */
export async function getVaultPhotoBlob(
  draftId: string,
  photoId: string
): Promise<Blob | null> {
  const store = getVaultStore();
  if (!store) return null;

  const key = `photo_${draftId}_${photoId}`;
  try {
    const blob = await store.getItem<Blob>(key);
    return blob || null;
  } catch (err) {
    console.warn(`[FiresideVault] Error retrieving photo blob ${photoId}:`, err);
    return null;
  }
}

/**
 * Deletes a draft and all associated photo blobs from the local vault upon explicit discard or sync acknowledgment.
 */
export async function deleteDraftFromVault(draftId: string): Promise<void> {
  const store = getVaultStore();
  if (!store) return;

  try {
    const keysToDelete: string[] = [];
    const photoPrefix = `photo_${draftId}_`;
    const draftKey = `draft_${draftId}`;

    await store.iterate((_, key) => {
      if (key === draftKey || key.startsWith(photoPrefix)) {
        keysToDelete.push(key);
      }
    });

    await Promise.all(keysToDelete.map((key) => store.removeItem(key)));
  } catch (err) {
    console.warn(`[FiresideVault] Error deleting draft ${draftId} from vault:`, err);
  }
}
