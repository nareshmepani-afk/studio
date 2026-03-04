import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getStudioState(sessionId: string) {
  const studioStateRef = doc(db, 'studio', sessionId);
  const docSnap = await getDoc(studioStateRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}
