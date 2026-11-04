import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { isSafeQaFixtureForCleanup } from '@/lib/qa/qaFixtureSeeder';

export const dynamic = 'force-dynamic';

/**
 * 🧹 QA Sandbox Scene Fixture Cleanup Engine (GOV-MW-163)
 *
 * Safely purges temporary QA test fixtures from Firestore while strictly preserving authentic memoirs.
 * ENFORCES GUARD 2:
 * 1. doc.id.startsWith('qa_fixture_')
 * 2. doc.data().isQATestFixture === true
 */
export async function POST(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin Database not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId || null;
    const targetDocId = body.targetDocId || null;
    const purgedDocIds: string[] = [];

    // Surgical single fixture reset
    if (targetDocId) {
      if (targetUserId) {
        const userDocRef = adminDb.collection('users').doc(targetUserId).collection('memories').doc(targetDocId);
        const snap = await userDocRef.get();
        if (snap.exists && isSafeQaFixtureForCleanup(snap.id, snap.data())) {
          await userDocRef.delete();
          purgedDocIds.push(`users/${targetUserId}/memories/${targetDocId}`);
        }
      }
      const rootDocRef = adminDb.collection('memories').doc(targetDocId);
      const rootSnap = await rootDocRef.get();
      if (rootSnap.exists && isSafeQaFixtureForCleanup(rootSnap.id, rootSnap.data())) {
        await rootDocRef.delete();
        purgedDocIds.push(`memories/${targetDocId}`);
      }

      return NextResponse.json({
        success: true,
        message: `Surgically reset QA fixture ${targetDocId} under strict Guard 2 verification.`,
        purgedCount: purgedDocIds.length,
        purgedDocIds,
      });
    }

    // Query collections where fixtures may reside:
    // 1. Root memories collection
    const rootSnapshot = await adminDb.collection('memories').get();
    for (const doc of rootSnapshot.docs) {
      if (isSafeQaFixtureForCleanup(doc.id, doc.data())) {
        await doc.ref.delete();
        purgedDocIds.push(`memories/${doc.id}`);
      }
    }

    // 2. User memories subcollections
    if (targetUserId) {
      const userMemsSnap = await adminDb.collection('users').doc(targetUserId).collection('memories').get();
      for (const doc of userMemsSnap.docs) {
        if (isSafeQaFixtureForCleanup(doc.id, doc.data())) {
          await doc.ref.delete();
          purgedDocIds.push(`users/${targetUserId}/memories/${doc.id}`);
        }
      }
    } else {
      // Sweep across all users
      const usersSnap = await adminDb.collection('users').get();
      for (const userDoc of usersSnap.docs) {
        const userMemsSnap = await userDoc.ref.collection('memories').get();
        for (const doc of userMemsSnap.docs) {
          if (isSafeQaFixtureForCleanup(doc.id, doc.data())) {
            await doc.ref.delete();
            purgedDocIds.push(`users/${userDoc.id}/memories/${doc.id}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${purgedDocIds.length} QA test fixtures under strict Guard 2 verification.`,
      purgedCount: purgedDocIds.length,
      purgedDocIds,
    });
  } catch (err: any) {
    console.error('[QA Cleanup Fixtures] Execution failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
