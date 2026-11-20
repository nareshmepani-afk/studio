import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { assertSameOriginMutation } from '@/lib/adminOriginGuard';
import { normalisePlaneIssueKey, type PlaneIssueApiResponse } from '@/lib/planeTypes';
import {
  addPlaneIssueComment,
  getPlaneIssueWithComments,
  loadPlaneEnv,
  updatePlaneIssueState,
} from '@/lib/planeClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

interface RouteContext {
  params: Promise<{ key: string }>;
}

function buildUnconfiguredResponse(key: string): NextResponse<PlaneIssueApiResponse> {
  return NextResponse.json(
    {
      success: true,
      configured: false,
      key,
      reason:
        'PLANE_API_KEY is not bound in Secret Manager on this runtime yet. Rotate MW-405 and bind PLANE_API_KEY to enable live in-app Plane sync.',
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, configured: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const { key: rawKey } = await context.params;
    const key = normalisePlaneIssueKey(rawKey);
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: `Invalid Plane issue key "${String(rawKey || '')}". Expected MW-<number>.`,
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cfg = loadPlaneEnv({ allowDotEnvLocal: false });
    if (!cfg) {
      return buildUnconfiguredResponse(key);
    }

    const { issue, comments, states } = await getPlaneIssueWithComments(cfg, key);
    return NextResponse.json(
      {
        success: true,
        configured: true,
        key,
        issue,
        comments,
        states,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    const message = err?.message || 'Failed to load Plane issue.';
    const status = /not found/i.test(message) ? 404 : /another project/i.test(message) ? 403 : 502;
    return NextResponse.json(
      { success: false, configured: true, error: message },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const originBlocked = assertSameOriginMutation(req, NO_STORE_HEADERS);
    if (originBlocked) return originBlocked;

    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, configured: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const { key: rawKey } = await context.params;
    const key = normalisePlaneIssueKey(rawKey);
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: `Invalid Plane issue key "${String(rawKey || '')}". Expected MW-<number>.`,
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, configured: false, error: 'Invalid JSON body.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const targetState = typeof body.state === 'string' ? body.state.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : '';
    if (!targetState) {
      return NextResponse.json(
        { success: false, configured: false, error: 'Target state (UUID, name, or group) is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cfg = loadPlaneEnv({ allowDotEnvLocal: false });
    if (!cfg) {
      return buildUnconfiguredResponse(key);
    }

    const updated = await updatePlaneIssueState(cfg, key, targetState);
    if (note) {
      const actor = authResult.session?.email || 'founder-admin';
      await addPlaneIssueComment(cfg, updated.issueId, `[Admin Hub • ${actor}] ${note}`).catch(() => null);
    }

    const refreshed = await getPlaneIssueWithComments(cfg, key);
    return NextResponse.json(
      {
        success: true,
        configured: true,
        key,
        ...refreshed,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    const message = err?.message || 'Failed to update Plane issue state.';
    const status = /not found/i.test(message) ? 404 : /another project/i.test(message) ? 403 : 502;
    return NextResponse.json(
      { success: false, configured: true, error: message },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const originBlocked = assertSameOriginMutation(req, NO_STORE_HEADERS);
    if (originBlocked) return originBlocked;

    const authResult = await requireAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, configured: false, error: authResult.error },
        { status: authResult.status, headers: NO_STORE_HEADERS }
      );
    }

    const { key: rawKey } = await context.params;
    const key = normalisePlaneIssueKey(rawKey);
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: `Invalid Plane issue key "${String(rawKey || '')}". Expected MW-<number>.`,
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const body = await req.json().catch(() => null);
    const commentText = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 2000) : '';
    if (!commentText) {
      return NextResponse.json(
        { success: false, configured: false, error: 'Comment text is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cfg = loadPlaneEnv({ allowDotEnvLocal: false });
    if (!cfg) {
      return buildUnconfiguredResponse(key);
    }

    const actor = authResult.session?.email || 'founder-admin';
    await addPlaneIssueComment(cfg, key, `[Admin Hub • ${actor}] ${commentText}`);
    const refreshed = await getPlaneIssueWithComments(cfg, key);

    return NextResponse.json(
      {
        success: true,
        configured: true,
        key,
        ...refreshed,
      },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    const message = err?.message || 'Failed to post Plane comment.';
    const status = /not found/i.test(message) ? 404 : /another project/i.test(message) ? 403 : 502;
    return NextResponse.json(
      { success: false, configured: true, error: message },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
