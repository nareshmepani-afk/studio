/**
 * 🛡️ Memory Persistence Guard & Storage Integrity Sentinel (AUDIT-MW-147)
 *
 * Enforces strict database integrity barriers against ephemeral browser state leaking
 * into persistent Firestore storage. Specifically prohibits temporary `blob:` URLs
 * from ever being written into `audioUrl`, `videoUrl`, or `takes[].mediaUrl`.
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

/**
 * Asserts that a memory payload contains zero ephemeral `blob:` URLs in media fields.
 * Throws `IllegalBlobPersistenceError` if any `blob:` pointer is detected.
 */
export function assertMemoryWriteIntegrity(
  docId: string,
  payload: Record<string, any>,
  targetCollection: VaultCollectionTarget = 'memories'
): void {
  if (!payload || typeof payload !== 'object') return;

  // Check audioUrl
  if (typeof payload.audioUrl === 'string' && payload.audioUrl.trim().startsWith('blob:')) {
    throw new IllegalBlobPersistenceError('audioUrl', docId, payload.audioUrl, targetCollection);
  }

  // Check videoUrl
  if (typeof payload.videoUrl === 'string' && payload.videoUrl.trim().startsWith('blob:')) {
    throw new IllegalBlobPersistenceError('videoUrl', docId, payload.videoUrl, targetCollection);
  }

  // Check mediaUrl at root
  if (typeof payload.mediaUrl === 'string' && payload.mediaUrl.trim().startsWith('blob:')) {
    throw new IllegalBlobPersistenceError('mediaUrl', docId, payload.mediaUrl, targetCollection);
  }

  // Check takes array
  if (Array.isArray(payload.takes)) {
    payload.takes.forEach((take: any, idx: number) => {
      if (!take || typeof take !== 'object') return;
      if (typeof take.mediaUrl === 'string' && take.mediaUrl.trim().startsWith('blob:')) {
        throw new IllegalBlobPersistenceError(`takes[${idx}].mediaUrl`, docId, take.mediaUrl, targetCollection);
      }
      if (typeof take.url === 'string' && take.url.trim().startsWith('blob:')) {
        throw new IllegalBlobPersistenceError(`takes[${idx}].url`, docId, take.url, targetCollection);
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
 * Sanitises an outgoing memory payload by stripping or nullifying any ephemeral `blob:` URLs.
 * Ensures that if an upload has not completed yet, the database does not receive stale pointers.
 */
export function sanitizeMemoryPayloadForStorage<T extends Record<string, any>>(
  payload: T,
   
  _targetCollection: VaultCollectionTarget = 'memories'
): T {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized: Record<string, any> = { ...payload };

  if (typeof sanitized.audioUrl === 'string' && sanitized.audioUrl.trim().startsWith('blob:')) {
    sanitized.audioUrl = null;
  }

  if (typeof sanitized.videoUrl === 'string' && sanitized.videoUrl.trim().startsWith('blob:')) {
    sanitized.videoUrl = null;
  }

  if (typeof sanitized.mediaUrl === 'string' && sanitized.mediaUrl.trim().startsWith('blob:')) {
    sanitized.mediaUrl = null;
  }

  if (Array.isArray(sanitized.takes)) {
    sanitized.takes = sanitized.takes.map((take: any) => {
      if (!take || typeof take !== 'object') return take;
      const cleanTake = { ...take };
      if (typeof cleanTake.mediaUrl === 'string' && cleanTake.mediaUrl.trim().startsWith('blob:')) {
        cleanTake.mediaUrl = null;
      }
      if (typeof cleanTake.url === 'string' && cleanTake.url.trim().startsWith('blob:')) {
        cleanTake.url = null;
      }
      return cleanTake;
    });
  }

  return sanitized as T;
}
