/**
 * Admin-gated client wrapper for QA deck operations (Option A — MW-404).
 *
 * All reads, writes, and evidence uploads route through same-origin `/api/admin/qa/*`
 * endpoints authenticated via the MFA-verified `__session` HttpOnly admin cookie
 * and executed server-side with the Firebase Admin SDK.
 */

export interface QaChecklistItem {
  id: string; // e.g. "56.1"
  cardNumber: number;
  title: string;
  steps: string[];
  targetRoute: string;
  verdict: 'PASS' | 'FAIL' | 'RETEST' | 'PENDING';
  notes: string;
  telemetryTrace: string;
  screenshots: string[];
  updatedAt: number;
  updatedBy: string;
}

export async function fetchQaItems(): Promise<Record<string, QaChecklistItem>> {
  const res = await fetch('/api/admin/qa/items', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch QA items (${res.status})`);
  }
  const data = await res.json();
  const items: Record<string, QaChecklistItem> = {};
  for (const item of data.items || []) {
    if (item?.id) items[item.id] = item as QaChecklistItem;
  }
  return items;
}

export function subscribeToQaItems(
  onUpdate: (items: Record<string, QaChecklistItem>) => void,
  onError?: (err: Error) => void,
  pollIntervalMs = 15000
): () => void {
  let active = true;
  const pull = async () => {
    try {
      const items = await fetchQaItems();
      if (active) onUpdate(items);
    } catch (err: any) {
      if (active) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };
  void pull();
  const timer = setInterval(() => void pull(), pollIntervalMs);
  return () => {
    active = false;
    clearInterval(timer);
  };
}

export async function updateQaItem(
  itemId: string,
  updates: Partial<QaChecklistItem>
): Promise<void> {
  const res = await fetch('/api/admin/qa/items', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: itemId, updates }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update QA item ${itemId} (${res.status})`);
  }
}

export async function uploadQaScreenshot(
  cardId: string,
  itemId: string,
  file: Blob,
  existingScreenshots: string[] = []
): Promise<string> {
  const formData = new FormData();
  formData.append('cardNum', cardId);
  formData.append('itemId', itemId);
  formData.append('file', file);

  const res = await fetch('/api/admin/qa/evidence', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload QA evidence (${res.status})`);
  }
  const data = await res.json();
  const downloadUrl = String(data.url || '');

  await updateQaItem(itemId, {
    screenshots: Array.from(new Set([...existingScreenshots, downloadUrl])),
  });
  return downloadUrl;
}

export async function deleteQaScreenshot(
  itemId: string,
  downloadUrl: string,
  existingScreenshots: string[] = []
): Promise<void> {
  await updateQaItem(itemId, {
    screenshots: existingScreenshots.filter((u) => u !== downloadUrl),
  });
}
