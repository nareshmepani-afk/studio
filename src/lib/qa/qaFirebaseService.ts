import { db, storage, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

const ITEMS_COLLECTION = 'qa_suites/active_deck/items';

export function subscribeToQaItems(
  onUpdate: (items: Record<string, QaChecklistItem>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ITEMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Record<string, QaChecklistItem> = {};
      snapshot.forEach((d) => {
        items[d.id] = d.data() as QaChecklistItem;
      });
      onUpdate(items);
    },
    (err) => {
      console.error('[QA Cloud Service] onSnapshot subscription failure:', err);
      onError?.(err);
    }
  );
}

export async function updateQaItem(
  itemId: string,
  updates: Partial<QaChecklistItem>
): Promise<void> {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  const payload: Partial<QaChecklistItem> = {
    ...updates,
    updatedAt: Date.now(),
    updatedBy: auth.currentUser?.email || 'admin@memoryweaver.studio',
  };
  await setDoc(itemRef, payload, { merge: true });
}

export async function uploadQaScreenshot(
  cardId: string,
  itemId: string,
  file: Blob
): Promise<string> {
  const filename = `${itemId}_${Date.now()}.png`;
  const storageRef = ref(storage, `qa-evidence/${cardId}/${filename}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/png',
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);

  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  await updateDoc(itemRef, {
    screenshots: arrayUnion(downloadUrl),
    updatedAt: Date.now(),
    updatedBy: auth.currentUser?.email || 'admin@memoryweaver.studio',
  });

  return downloadUrl;
}

export async function deleteQaScreenshot(
  itemId: string,
  downloadUrl: string
): Promise<void> {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  await updateDoc(itemRef, {
    screenshots: arrayRemove(downloadUrl),
    updatedAt: Date.now(),
    updatedBy: auth.currentUser?.email || 'admin@memoryweaver.studio',
  });
}
