'use server';

import { getSession } from '@/lib/session';
import { adminStorage } from '@/lib/firebase-admin';

export interface VideoSegmentPayload {
  segmentId: string;
  startOffset: number;
  endOffset: number;
  duration: number;
}

export interface VideoManifestPayload {
  segments: VideoSegmentPayload[];
  inviteId: string;
  outputName: string;
}

export async function authorizeVideoProcessingSession(manifest: VideoManifestPayload) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, reason: 'UNAUTHENTICATED', message: 'No valid session.' };
    }

    const isAdmin = session.isAdmin === true;
    const mfaVerified = session.mfaVerified === true;

    if (!isAdmin || !mfaVerified) {
      return { success: false, reason: 'UNAUTHORIZED', message: 'Missing required security claims.' };
    }

    if (!manifest.segments || manifest.segments.length === 0 || !manifest.inviteId) {
      return { success: false, reason: 'BAD_REQUEST', message: 'Invalid manifest structure.' };
    }

    // Server-side bounds checks: reject negative offsets or segment durations > 600s (10 min safety cap)
    for (const seg of manifest.segments) {
      if (seg.startOffset < 0 || seg.endOffset < 0 || seg.duration <= 0 || seg.duration > 600) {
        return { success: false, reason: 'BAD_REQUEST', message: 'Segment duration boundary violation detected.' };
      }
    }

    if (!adminStorage) {
      return { success: false, reason: 'SERVER_ERROR', message: 'Storage service offline.' };
    }

    const bucket = adminStorage.bucket();
    
    // Generate secure pre-signed URLs for staging video segments
    const uploadTokens = await Promise.all(
      manifest.segments.map(async (seg) => {
        const filePath = `staging/video-processing/${manifest.inviteId}/${seg.segmentId}.webm`;
        const file = bucket.file(filePath);
        
        const [uploadUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType: 'video/webm',
        });

        return {
          segmentId: seg.segmentId,
          uploadUrl,
          filePath,
        };
      })
    );

    return {
      success: true,
      uploadTokens,
    };
  } catch (error) {
    console.error('SECURITY: Video processing authorization failure:', error);
    return { success: false, reason: 'SERVER_ERROR', message: 'Internal security envelope verification failure.' };
  }
}
