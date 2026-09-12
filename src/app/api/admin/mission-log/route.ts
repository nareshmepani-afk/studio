import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession, verifyAdminWhitelist } from '@/lib/session';

export const dynamic = 'force-dynamic';

import { parseMissionLogMarkdown, MissionLogPayload } from '@/lib/missionLog';

export async function GET(request: NextRequest) {
  try {
    // 1. Rule 22.2 Backstage Portal Protection
    const internalKey = request.headers.get('x-internal-key');
    let isAuthorized = false;

    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      isAuthorized = true;
    } else if (process.env.NODE_ENV === 'development' || process.env.VITEST) {
      isAuthorized = true;
    } else {
      const session = await getSession();
      if (session?.email) {
        const adminCheck = await verifyAdminWhitelist(session.email);
        if (adminCheck.isValid) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // 2. Resolve MISSION_LOG.md
    const filePath = path.join(process.cwd(), 'MISSION_LOG.md');
    let content = '';

    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (fsErr) {
      console.warn('MISSION_LOG.md not found at cwd, attempting fallback resolution...');
      const fallbackPath = path.resolve(__dirname, '../../../../../../MISSION_LOG.md');
      content = await fs.readFile(fallbackPath, 'utf8');
    }

    const { coordinates, checkpoints } = parseMissionLogMarkdown(content);

    const payload: MissionLogPayload = {
      coordinates,
      checkpoints,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/admin/mission-log:', error);
    return NextResponse.json(
      { error: 'Failed to read mission log', message: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
