import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import { requireAdminSession } from '@/lib/session';
import { resolveStorageBucket } from '@/config/environment';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const SAFE_EVIDENCE_PATH = /^qa-evidence\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;

function resolveAdminBucket() {
  if (!adminStorage) return null;
  const configured = adminStorage.app.options.storageBucket || resolveStorageBucket();
  return configured ? adminStorage.bucket(configured) : adminStorage.bucket();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const objectPath = request.nextUrl.searchParams.get('path') || '';
    if (!objectPath || objectPath.includes('..') || !SAFE_EVIDENCE_PATH.test(objectPath)) {
      return NextResponse.json({ success: false, error: 'Invalid evidence path' }, { status: 400 });
    }

    const bucket = resolveAdminBucket();
    if (!bucket) {
      return NextResponse.json({ success: false, error: 'Storage not initialised' }, { status: 503 });
    }

    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Evidence object not found' }, { status: 404 });
    }

    const [[metadata], [bytes]] = await Promise.all([file.getMetadata(), file.download()]);
    const contentType =
      typeof metadata?.contentType === 'string' && metadata.contentType.startsWith('image/')
        ? metadata.contentType
        : 'image/png';

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/qa/evidence] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to read evidence' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const bucket = resolveAdminBucket();
    if (!bucket) {
      return NextResponse.json({ success: false, error: 'Storage not initialised' }, { status: 503 });
    }

    const formData = await request.formData();
    const cardNum = String(formData.get('cardNum') || '').trim();
    const itemId = String(formData.get('itemId') || '').trim();
    const file = formData.get('file');

    if (!/^\d+$/.test(cardNum) || !/^\d+(\.\d+)?$/.test(itemId)) {
      return NextResponse.json({ success: false, error: 'Invalid cardNum or itemId' }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: 'Image file must be between 1 byte and 10 MB' }, { status: 400 });
    }

    const contentType = file.type || 'image/png';
    const ext = MIME_TO_EXT[contentType];
    if (!ext) {
      return NextResponse.json({ success: false, error: `Unsupported image type: ${contentType}` }, { status: 400 });
    }

    const safeItemId = itemId.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `qa-evidence/${cardNum}/${safeItemId}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectPath).save(buffer, {
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          uploadedBy: authResult.session.email || 'admin@memoryweaver.studio',
          uploadedByUid: authResult.session.uid,
        },
      },
    });

    const url = `/api/admin/qa/evidence?path=${encodeURIComponent(objectPath)}`;
    return NextResponse.json({ success: true, path: objectPath, url });
  } catch (err: any) {
    console.error('[POST /api/admin/qa/evidence] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Evidence upload failed' }, { status: 500 });
  }
}
