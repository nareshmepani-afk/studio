import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/admin/migrate-status
 * MW-186: One-off migration endpoint to update memory status.
 * Protected by a migration key to prevent abuse.
 * 
 * Body: { userId: string, memoryId: string, fromStatus: string, toStatus: string, migrationKey: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, memoryId, fromStatus, toStatus, migrationKey } = body;

    // Simple protection — requires knowing the migration key
    if (migrationKey !== process.env.GUEST_SESSION_SECRET) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });
    }

    if (!userId || !memoryId || !fromStatus || !toStatus) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialised.' }, { status: 503 });
    }

    const docRef = adminDb.doc(`users/${userId}/memories/${memoryId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const currentStatus = doc.data()?.status;
    if (currentStatus !== fromStatus) {
      return NextResponse.json({ 
        error: `Status mismatch. Expected '${fromStatus}', found '${currentStatus}'.`,
        currentStatus 
      }, { status: 409 });
    }

    await docRef.update({ status: toStatus });

    return NextResponse.json({ 
      success: true, 
      message: `Status updated: ${fromStatus} → ${toStatus}`,
      memoryId,
      previousStatus: fromStatus,
      newStatus: toStatus
    });
  } catch (error: any) {
    console.error('[POST /api/admin/migrate-status] Error:', error);
    return NextResponse.json({ error: error?.message || 'Migration failed.' }, { status: 500 });
  }
}
