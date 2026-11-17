import type { Firestore } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isProductionProject, resolveProjectId } from '@/config/environment';
import {
  PRELAUNCH_CONFIG_COLLECTION,
  PRELAUNCH_CONFIG_DOC_ID,
  PRELAUNCH_LIST_COLLECTION,
  type PrelaunchMode,
  type PrelaunchStatus,
  type PrelaunchSource,
  type PrelaunchEntry,
  type PrelaunchAccessCheckResult,
  normalizePrelaunchEmail,
  isValidEmailAddress,
  emailToPrelaunchDocId,
  extractUnboxingVoucherCode,
  parseBulkEmailsInput,
} from '@/lib/prelaunch-shared';

export {
  PRELAUNCH_CONFIG_COLLECTION,
  PRELAUNCH_CONFIG_DOC_ID,
  PRELAUNCH_LIST_COLLECTION,
  type PrelaunchMode,
  type PrelaunchStatus,
  type PrelaunchSource,
  type PrelaunchEntry,
  type PrelaunchAccessCheckResult,
  normalizePrelaunchEmail,
  isValidEmailAddress,
  emailToPrelaunchDocId,
  extractUnboxingVoucherCode,
  parseBulkEmailsInput,
};

export function getDefaultPrelaunchMode(): PrelaunchMode {
  return isProductionProject(resolveProjectId()) ? 'RESTRICTED' : 'PUBLIC';
}

export async function getPrelaunchMode(db: Firestore | null = adminDb): Promise<{
  mode: PrelaunchMode;
  defaultMode: PrelaunchMode;
  isExplicit: boolean;
}> {
  const defaultMode = getDefaultPrelaunchMode();
  if (!db) {
    return { mode: defaultMode, defaultMode, isExplicit: false };
  }

  try {
    const snap = await db
      .collection(PRELAUNCH_CONFIG_COLLECTION)
      .doc(PRELAUNCH_CONFIG_DOC_ID)
      .get();

    if (snap.exists) {
      const modeVal = snap.data()?.mode;
      if (modeVal === 'RESTRICTED' || modeVal === 'PUBLIC') {
        return { mode: modeVal, defaultMode, isExplicit: true };
      }
    }
  } catch (err) {
    console.warn('[Prelaunch] Failed to read prelaunch_config/settings, using environment default:', err);
  }

  return { mode: defaultMode, defaultMode, isExplicit: false };
}

async function isEmailAdmin(email: string): Promise<boolean> {
  const norm = normalizePrelaunchEmail(email);
  if (!norm) return false;
  if (!adminAuth) return false;
  try {
    const userRecord = await adminAuth.getUserByEmail(norm);
    return userRecord.customClaims?.isAdmin === true;
  } catch {
    return false;
  }
}

export async function upsertPrelaunchTesterForGift(
  db: Firestore | null,
  params: { email: string; name?: string | null }
): Promise<void> {
  if (!db || !isValidEmailAddress(params.email)) return;
  const email = normalizePrelaunchEmail(params.email);
  const docId = emailToPrelaunchDocId(email);
  const now = Date.now();
  const ref = db.collection(PRELAUNCH_LIST_COLLECTION).doc(docId);
  const existing = await ref.get();

  if (existing.exists) {
    const data = existing.data() as Partial<PrelaunchEntry>;
    await ref.set(
      {
        email,
        name: (data.name || params.name || '').trim(),
        isTester: true,
        status: 'TESTER',
        updatedAt: now,
      },
      { merge: true }
    );
    return;
  }

  const record: PrelaunchEntry = {
    emailKey: docId,
    email,
    name: (params.name || '').trim(),
    isTester: true,
    status: 'TESTER',
    source: 'GIFT_VOUCHER',
    createdAt: now,
    updatedAt: now,
    createdAtIso: new Date(now).toISOString(),
  };
  await ref.set(record);
}

/**
 * Evaluates whether an email is permitted to proceed during Pre-Launch RESTRICTED mode.
 * If blocked and `recordIfBlocked` is true, upserts the visitor onto `prelaunch_list/{emailKey}`
 * with `isTester: false, status: 'WAITLIST'` (never downgrading an existing `isTester: true` row).
 */
export async function evaluatePrelaunchAccess(params: {
  email?: string | null;
  name?: string | null;
  voucherCode?: string | null;
  source?: PrelaunchSource;
  recordIfBlocked?: boolean;
  isAdminTokenClaim?: boolean;
  db?: Firestore | null;
}): Promise<PrelaunchAccessCheckResult> {
  const db = params.db !== undefined ? params.db : adminDb;
  const { mode } = await getPrelaunchMode(db);

  if (mode === 'PUBLIC') {
    return { allowed: true, mode: 'PUBLIC', reason: 'PUBLIC_MODE' };
  }

  if (params.isAdminTokenClaim) {
    return { allowed: true, mode: 'RESTRICTED', reason: 'ADMIN' };
  }

  const email = normalizePrelaunchEmail(params.email || '');
  if (!isValidEmailAddress(email)) {
    return {
      allowed: false,
      mode: 'RESTRICTED',
      code: 'PRELAUNCH_RESTRICTED',
      message: 'Please enter a valid email address to join the Founding Pre-Launch List.',
    };
  }

  if (await isEmailAdmin(email)) {
    return { allowed: true, mode: 'RESTRICTED', reason: 'ADMIN' };
  }

  if (!db) {
    return {
      allowed: false,
      mode: 'RESTRICTED',
      code: 'PRELAUNCH_RESTRICTED',
      message: 'Pre-launch access verification service is temporarily unavailable.',
    };
  }

  const docId = emailToPrelaunchDocId(email);
  const entryRef = db.collection(PRELAUNCH_LIST_COLLECTION).doc(docId);
  const entrySnap = await entryRef.get();

  if (entrySnap.exists) {
    const data = entrySnap.data() as Partial<PrelaunchEntry>;
    if (data.isTester === true || data.status === 'TESTER') {
      return { allowed: true, mode: 'RESTRICTED', reason: 'TESTER' };
    }
  }

  // Valid unredeemed gift voucher bypass: allow onboarding & mark as TESTER
  const cleanVoucher = (params.voucherCode || '').trim().toUpperCase();
  if (cleanVoucher) {
    const voucherSnap = await db.collection('gift_vouchers').doc(cleanVoucher).get();
    if (voucherSnap.exists && voucherSnap.data()?.status === 'unredeemed') {
      await upsertPrelaunchTesterForGift(db, { email, name: params.name });
      return { allowed: true, mode: 'RESTRICTED', reason: 'GIFT_VOUCHER' };
    }
  }

  let addedToList = false;
  let alreadyListed = false;

  if (params.recordIfBlocked !== false) {
    const now = Date.now();
    const cleanName = (params.name || '').trim().slice(0, 120);

    if (entrySnap.exists) {
      alreadyListed = true;
      const existingData = entrySnap.data() as Partial<PrelaunchEntry>;
      await entryRef.set(
        {
          email,
          name: existingData.name || cleanName,
          updatedAt: now,
        },
        { merge: true }
      );
    } else {
      addedToList = true;
      const newEntry: PrelaunchEntry = {
        emailKey: docId,
        email,
        name: cleanName,
        isTester: false,
        status: 'WAITLIST',
        source: params.source || 'SELF_SIGNUP',
        createdAt: now,
        updatedAt: now,
        createdAtIso: new Date(now).toISOString(),
      };
      await entryRef.set(newEntry);
    }
  } else {
    alreadyListed = entrySnap.exists;
  }

  return {
    allowed: false,
    mode: 'RESTRICTED',
    code: 'PRELAUNCH_RESTRICTED',
    addedToList,
    alreadyListed,
    message:
      'Memory Weaver Studio is currently in Private Founding Access. Your email has been recorded on our Pre-Launch List — we will notify you as soon as your Tester pass is activated or public doors open.',
  };
}
