/**
 * 🛡️ Memory Persistence Guard & Storage Integrity Sentinel (AUDIT-MW-147 / MW-378)
 *
 * Enforces strict database integrity barriers against ephemeral browser state leaking
 * into persistent Firestore storage. Specifically prohibits temporary `blob:` URLs
 * from ever being written into `audioUrl`, `videoUrl`, `mediaUrl`, `imageUrl`,
 * `takes[]` (`mediaUrl`, `url`), `photos[]` (`url`, `storageUrl`, `voiceNoteUrl`),
 * or `bonusMemories[]` (`audioUrl`, `photoUrl`, `mediaUrl`).
 *
 * Supports dual-chamber collection parameterisation:
 * - 'memories' (default): v1.0 Heirloom Folio memoirs
 * - 'chronicles': v2.0 Living Chronicles Diary Studio (RFC-MW-156)
 */

export type VaultCollectionTarget = 'memories' | 'chronicles';

export class IllegalBlobPersistenceError extends Error {
  public readonly field: string;
  public readonly docId: string;
  public readonly url: string;
  public readonly targetCollection: VaultCollectionTarget;

  constructor(
    field: string,
    docId: string,
    url: string,
    targetCollection: VaultCollectionTarget = 'memories'
  ) {
    const prefix = targetCollection === 'memories' ? '[ILLEGAL_BLOB_PERSISTENCE]' : `[ILLEGAL_BLOB_PERSISTENCE:${targetCollection}]`;
    super(
      `${prefix} Attempted to persist ephemeral blob URL in field "${field}" for document "${docId}": ${url}. Permanent Cloud Storage URL required before database commit.`
    );
    this.name = 'IllegalBlobPersistenceError';
    this.field = field;
    this.docId = docId;
    this.url = url;
    this.targetCollection = targetCollection;
  }
}

function isEphemeralBlobUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().startsWith('blob:');
}

/**
 * Asserts that a memory or chronicle payload contains zero ephemeral `blob:` URLs
 * across root media fields and nested `takes[]`, `photos[]`, and `bonusMemories[]` arrays.
 * Throws `IllegalBlobPersistenceError` if any `blob:` pointer is detected.
 */
export function assertMemoryWriteIntegrity(
  docId: string,
  payload: Record<string, any>,
  targetCollection: VaultCollectionTarget = 'memories'
): void {
  if (!payload || typeof payload !== 'object') return;

  // 1. Root media URL fields
  const rootMediaFields = ['audioUrl', 'videoUrl', 'mediaUrl', 'imageUrl'] as const;
  for (const field of rootMediaFields) {
    if (isEphemeralBlobUrl(payload[field])) {
      throw new IllegalBlobPersistenceError(field, docId, payload[field], targetCollection);
    }
  }

  // 2. Takes array
  if (Array.isArray(payload.takes)) {
    payload.takes.forEach((take: any, idx: number) => {
      if (!take || typeof take !== 'object') return;
      if (isEphemeralBlobUrl(take.mediaUrl)) {
        throw new IllegalBlobPersistenceError(`takes[${idx}].mediaUrl`, docId, take.mediaUrl, targetCollection);
      }
      if (isEphemeralBlobUrl(take.url)) {
        throw new IllegalBlobPersistenceError(`takes[${idx}].url`, docId, take.url, targetCollection);
      }
    });
  }

  // 3. Photos array (HeirloomPhotoAttachment: url, storageUrl, voiceNoteUrl)
  if (Array.isArray(payload.photos)) {
    payload.photos.forEach((photo: any, idx: number) => {
      if (!photo || typeof photo !== 'object') return;
      const photoUrlFields = ['url', 'storageUrl', 'voiceNoteUrl'] as const;
      for (const field of photoUrlFields) {
        if (isEphemeralBlobUrl(photo[field])) {
          throw new IllegalBlobPersistenceError(`photos[${idx}].${field}`, docId, photo[field], targetCollection);
        }
      }
    });
  }

  // 4. Bonus Memories array (audioUrl, photoUrl, mediaUrl)
  if (Array.isArray(payload.bonusMemories)) {
    payload.bonusMemories.forEach((bonus: any, idx: number) => {
      if (!bonus || typeof bonus !== 'object') return;
      const bonusUrlFields = ['audioUrl', 'photoUrl', 'mediaUrl'] as const;
      for (const field of bonusUrlFields) {
        if (isEphemeralBlobUrl(bonus[field])) {
          throw new IllegalBlobPersistenceError(`bonusMemories[${idx}].${field}`, docId, bonus[field], targetCollection);
        }
      }
    });
  }
}

/**
 * Shared Zero-Blob Persistence Guard (RFC-MW-156 Section 6.2).
 * Validates payloads destined for either users/{uid}/memories/{id} or users/{uid}/chronicles/{logId}.
 */
export function assertZeroBlobUrls(
  payload: Record<string, unknown>,
  targetCollection: VaultCollectionTarget = 'memories'
): void {
  assertMemoryWriteIntegrity('payload', payload as Record<string, any>, targetCollection);
}

/**
 * Sanitises an outgoing memory or chronicle payload by stripping or nullifying any ephemeral `blob:` URLs
 * across root media fields and nested `takes[]`, `photos[]`, and `bonusMemories[]`.
 */
export function sanitizeMemoryPayloadForStorage<T extends Record<string, any>>(
  payload: T,
  _targetCollection: VaultCollectionTarget = 'memories'
): T {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized: Record<string, any> = { ...payload };

  const rootMediaFields = ['audioUrl', 'videoUrl', 'mediaUrl', 'imageUrl'] as const;
  for (const field of rootMediaFields) {
    if (isEphemeralBlobUrl(sanitized[field])) {
      sanitized[field] = null;
    }
  }

  if (Array.isArray(sanitized.takes)) {
    sanitized.takes = sanitized.takes.map((take: any) => {
      if (!take || typeof take !== 'object') return take;
      const cleanTake = { ...take };
      if (isEphemeralBlobUrl(cleanTake.mediaUrl)) cleanTake.mediaUrl = null;
      if (isEphemeralBlobUrl(cleanTake.url)) cleanTake.url = null;
      return cleanTake;
    });
  }

  if (Array.isArray(sanitized.photos)) {
    sanitized.photos = sanitized.photos.map((photo: any) => {
      if (!photo || typeof photo !== 'object') return photo;
      const cleanPhoto = { ...photo };
      for (const field of ['url', 'storageUrl', 'voiceNoteUrl'] as const) {
        if (isEphemeralBlobUrl(cleanPhoto[field])) {
          cleanPhoto[field] = null;
        }
      }
      return cleanPhoto;
    });
  }

  if (Array.isArray(sanitized.bonusMemories)) {
    sanitized.bonusMemories = sanitized.bonusMemories.map((bonus: any) => {
      if (!bonus || typeof bonus !== 'object') return bonus;
      const cleanBonus = { ...bonus };
      for (const field of ['audioUrl', 'photoUrl', 'mediaUrl'] as const) {
        if (isEphemeralBlobUrl(cleanBonus[field])) {
          cleanBonus[field] = null;
        }
      }
      return cleanBonus;
    });
  }

  return sanitized as T;
}
