import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import {
  emailToPrelaunchDocId,
  getPrelaunchMode,
  isValidEmailAddress,
  normalizePrelaunchEmail,
  parseBulkEmailsInput,
  PRELAUNCH_CONFIG_COLLECTION,
  PRELAUNCH_CONFIG_DOC_ID,
  PRELAUNCH_LIST_COLLECTION,
  type PrelaunchEntry,
  type PrelaunchMode,
  type PrelaunchStatus,
} from '@/lib/prelaunch';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }

    const modeInfo = await getPrelaunchMode(adminDb);
    const snap = await adminDb
      .collection(PRELAUNCH_LIST_COLLECTION)
      .orderBy('updatedAt', 'desc')
      .limit(500)
      .get();

    const allEntries: PrelaunchEntry[] = snap.docs.map((docSnap) => {
      const data = docSnap.data() as Partial<PrelaunchEntry>;
      const isTester = Boolean(data.isTester) || data.status === 'TESTER';
      return {
        emailKey: docSnap.id,
        email: data.email || decodeURIComponent(docSnap.id),
        name: data.name || '',
        isTester,
        status: isTester ? 'TESTER' : 'WAITLIST',
        source: data.source || 'ADMIN_ADD',
        createdAt: Number(data.createdAt || 0),
        updatedAt: Number(data.updatedAt || data.createdAt || 0),
        createdAtIso: data.createdAtIso,
        updatedBy: data.updatedBy,
      };
    });

    const testersCount = allEntries.filter((e) => e.isTester).length;
    const counts = {
      total: allEntries.length,
      testers: testersCount,
      waitlist: allEntries.length - testersCount,
    };

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const filterStatus = (searchParams.get('status') || '').trim().toUpperCase();
    const queryText = (searchParams.get('q') || '').trim().toLowerCase();

    let entries = allEntries;
    if (filterStatus === 'TESTER') {
      entries = entries.filter((e) => e.isTester);
    } else if (filterStatus === 'WAITLIST') {
      entries = entries.filter((e) => !e.isTester);
    }

    if (queryText) {
      entries = entries.filter(
        (e) =>
          e.email.toLowerCase().includes(queryText) ||
          e.name.toLowerCase().includes(queryText) ||
          e.source.toLowerCase().includes(queryText)
      );
    }

    return NextResponse.json(
      {
        success: true,
        mode: modeInfo.mode,
        defaultMode: modeInfo.defaultMode,
        isExplicit: modeInfo.isExplicit,
        counts,
        entries,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[GET /api/admin/prelaunch] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const adminEmail = authResult.session.email || 'admin';
    const now = Date.now();

    if (body.mode !== undefined) {
      const nextMode = String(body.mode).toUpperCase() as PrelaunchMode;
      if (nextMode !== 'RESTRICTED' && nextMode !== 'PUBLIC') {
        return NextResponse.json(
          { success: false, error: 'Invalid pre-launch mode specified' },
          { status: 400 }
        );
      }

      await adminDb
        .collection(PRELAUNCH_CONFIG_COLLECTION)
        .doc(PRELAUNCH_CONFIG_DOC_ID)
        .set(
          {
            mode: nextMode,
            updatedAt: now,
            updatedAtIso: new Date(now).toISOString(),
            updatedBy: adminEmail,
          },
          { merge: true }
        );

      return NextResponse.json(
        { success: true, mode: nextMode },
        { headers: NO_STORE_HEADERS }
      );
    }

    if (typeof body.isTester === 'boolean' && (body.emailKey || body.email)) {
      const rawKey = typeof body.emailKey === 'string' ? body.emailKey.trim() : '';
      const normEmail = body.email ? normalizePrelaunchEmail(body.email) : '';
      const docId = rawKey || emailToPrelaunchDocId(normEmail);

      if (!docId || (normEmail && !isValidEmailAddress(normEmail))) {
        return NextResponse.json(
          { success: false, error: 'Valid email or emailKey is required' },
          { status: 400 }
        );
      }

      const ref = adminDb.collection(PRELAUNCH_LIST_COLLECTION).doc(docId);
      const snap = await ref.get();
      if (!snap.exists && !isValidEmailAddress(normEmail)) {
        return NextResponse.json(
          { success: false, error: 'Pre-launch entry not found' },
          { status: 404 }
        );
      }

      const existing = snap.exists ? (snap.data() as Partial<PrelaunchEntry>) : {};
      const nextTester = Boolean(body.isTester);
      const nextStatus: PrelaunchStatus = nextTester ? 'TESTER' : 'WAITLIST';
      const resolvedEmail = existing.email || normEmail || decodeURIComponent(docId);

      const updatedEntry: PrelaunchEntry = {
        emailKey: docId,
        email: resolvedEmail,
        name: typeof body.name === 'string' ? body.name.trim() : existing.name || '',
        isTester: nextTester,
        status: nextStatus,
        source: existing.source || 'ADMIN_ADD',
        createdAt: Number(existing.createdAt || now),
        updatedAt: now,
        createdAtIso: existing.createdAtIso || new Date(now).toISOString(),
        updatedBy: adminEmail,
      };

      await ref.set(updatedEntry, { merge: true });

      return NextResponse.json(
        { success: true, entry: updatedEntry },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported PATCH payload' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[PATCH /api/admin/prelaunch] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const adminEmail = authResult.session.email || 'admin';
    const now = Date.now();
    const listCol = adminDb.collection(PRELAUNCH_LIST_COLLECTION);

    if (typeof body.bulkText === 'string') {
      const parsed = parseBulkEmailsInput(body.bulkText);
      const asTester = body.asTester === true || body.status === 'TESTER';
      const status: PrelaunchStatus = asTester ? 'TESTER' : 'WAITLIST';

      if (parsed.validEntries.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No valid email addresses found in pasted content.',
            invalidTokens: parsed.invalidTokens.slice(0, 20),
          },
          { status: 400 }
        );
      }

      const upsertedEntries: PrelaunchEntry[] = [];
      for (const item of parsed.validEntries) {
        const docId = emailToPrelaunchDocId(item.email);
        const ref = listCol.doc(docId);
        const snap = await ref.get();
        const existing = snap.exists ? (snap.data() as Partial<PrelaunchEntry>) : null;

        const entry: PrelaunchEntry = {
          emailKey: docId,
          email: item.email,
          name: item.name || existing?.name || '',
          isTester: asTester,
          status,
          source: 'SHEET_IMPORT',
          createdAt: Number(existing?.createdAt || now),
          updatedAt: now,
          createdAtIso: existing?.createdAtIso || new Date(now).toISOString(),
          updatedBy: adminEmail,
        };

        await ref.set(entry, { merge: true });
        upsertedEntries.push(entry);
      }

      return NextResponse.json(
        {
          success: true,
          importedCount: upsertedEntries.length,
          duplicateCount: parsed.duplicateCount,
          invalidCount: parsed.invalidTokens.length,
          invalidTokens: parsed.invalidTokens.slice(0, 20),
          status,
          entries: upsertedEntries,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const normEmail = normalizePrelaunchEmail(body.email || '');
    if (!isValidEmailAddress(normEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const asTester =
      body.isTester !== undefined
        ? Boolean(body.isTester)
        : String(body.status || 'TESTER').toUpperCase() === 'TESTER';
    const status: PrelaunchStatus = asTester ? 'TESTER' : 'WAITLIST';
    const docId = emailToPrelaunchDocId(normEmail);
    const ref = listCol.doc(docId);
    const snap = await ref.get();
    const existing = snap.exists ? (snap.data() as Partial<PrelaunchEntry>) : null;

    const entry: PrelaunchEntry = {
      emailKey: docId,
      email: normEmail,
      name: typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : existing?.name || '',
      isTester: asTester,
      status,
      source: existing?.source || 'ADMIN_ADD',
      createdAt: Number(existing?.createdAt || now),
      updatedAt: now,
      createdAtIso: existing?.createdAtIso || new Date(now).toISOString(),
      updatedBy: adminEmail,
    };

    await ref.set(entry, { merge: true });

    return NextResponse.json(
      { success: true, entry },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[POST /api/admin/prelaunch] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialised' },
        { status: 503 }
      );
    }

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    let emailKey = (searchParams.get('emailKey') || '').trim();
    const emailParam = searchParams.get('email');

    if (!emailKey && emailParam) {
      emailKey = emailToPrelaunchDocId(emailParam);
    }

    if (!emailKey) {
      return NextResponse.json(
        { success: false, error: 'emailKey or email is required' },
        { status: 400 }
      );
    }

    await adminDb.collection(PRELAUNCH_LIST_COLLECTION).doc(emailKey).delete();

    return NextResponse.json(
      { success: true, emailKey },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('[DELETE /api/admin/prelaunch] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
