import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { videoStitchTrigger } from "./videoStitchTrigger";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as crypto from "crypto";
import { execFile } from "child_process";
import ffmpegStaticPath from "ffmpeg-static";
import { User } from "./types";
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from "./constants";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,80}$/;
const SAFE_MEMORY_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

interface EdlSegment {
  segmentId: string;
  sourceId?: string;
  existingStoragePath?: string;
  startOffset?: number;
  endOffset?: number;
  duration?: number;
  sourceDuration?: number;
}

interface MediaProbeResult {
  hasVideo: boolean;
  hasAudio: boolean;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  isMp4: boolean;
}

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const userProfile: User = {
    id: user.uid,
    email: user.email!,
    name: user.displayName!,
    createdAt: new Date().toISOString(),
    hostPassStatus: "free_host_pass_active",
    freeHostPassActivatedDate: new Date().toISOString(),
    sharedAccessStatus: "no_pass_initiated",
    storageUsedBytes: 0,
    storageQuota: { total: STANDARD_HOST_STORAGE_QUOTA_BYTES, used: 0 },
  };

  await admin.firestore().collection("users").doc(user.uid).set(userProfile);
});

function resolveFfmpegBin(): string {
  if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) {
    return ffmpegStaticPath;
  }
  return "ffmpeg";
}

function runFfmpeg(binPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      binPath,
      args,
      { maxBuffer: 25 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const err = new Error(`FFmpeg failed (${error.message}): ${stderr.slice(-1200)}`);
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

async function probeMediaWithFfmpeg(binPath: string, inputPath: string): Promise<MediaProbeResult> {
  const stderr = await new Promise<string>((resolve) => {
    execFile(binPath, ["-hide_banner", "-i", inputPath], { maxBuffer: 10 * 1024 * 1024 }, (_err, _out, errOutput) => {
      resolve(errOutput || "");
    });
  });

  const hasVideo = /Stream #\d+:\d+.*Video:/i.test(stderr);
  const hasAudio = /Stream #\d+:\d+.*Audio:/i.test(stderr);
  const resMatch = stderr.match(/Stream #\d+:\d+.*Video:.*?,\s*(\d{2,5})x(\d{2,5})/i);
  const width = resMatch ? parseInt(resMatch[1], 10) : null;
  const height = resMatch ? parseInt(resMatch[2], 10) : null;

  let durationSeconds: number | null = null;
  const durMatch = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
  if (durMatch) {
    durationSeconds =
      parseInt(durMatch[1], 10) * 3600 +
      parseInt(durMatch[2], 10) * 60 +
      parseFloat(durMatch[3]);
  }

  const isMp4 =
    inputPath.toLowerCase().endsWith(".mp4") ||
    /Input #0,\s*mov,mp4/i.test(stderr);

  return { hasVideo, hasAudio, width, height, durationSeconds, isMp4 };
}

function computeTargetDimensions(width: number | null, height: number | null): { w: number; h: number } {
  const srcW = width && width > 0 ? width : 1280;
  const srcH = height && height > 0 ? height : 720;
  const maxW = 1920;
  const maxH = 1080;
  const scale = Math.min(1, maxW / srcW, maxH / srcH);
  const evenW = Math.max(2, Math.floor((srcW * scale) / 2) * 2);
  const evenH = Math.max(2, Math.floor((srcH * scale) / 2) * 2);
  return { w: evenW, h: evenH };
}

function validateAndResolveSegmentSource(
  uid: string,
  memoryId: string,
  seg: EdlSegment
): { storagePath: string; cacheKey: string } {
  if (!seg || typeof seg.segmentId !== "string" || !SAFE_ID_REGEX.test(seg.segmentId)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid segmentId in EDL.");
  }

  const expectedPrefix = `users/${uid}/memories/${memoryId}/`;

  if (seg.existingStoragePath) {
    const cleanPath = String(seg.existingStoragePath);
    if (
      !cleanPath.startsWith(expectedPrefix) ||
      cleanPath.includes("..") ||
      cleanPath.includes("\\")
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "existingStoragePath outside authorised memory boundary."
      );
    }
    return { storagePath: cleanPath, cacheKey: `existing_${cleanPath}` };
  }

  const rawSourceId = seg.sourceId || seg.segmentId;
  if (typeof rawSourceId !== "string" || !SAFE_ID_REGEX.test(rawSourceId)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid sourceId in EDL.");
  }

  const storagePath = `users/${uid}/memories/${memoryId}/segments/${rawSourceId}.webm`;
  return { storagePath, cacheKey: `seg_${rawSourceId}` };
}

function buildFirebaseDownloadUrl(bucketName: string, destPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
}

function isSegmentUncut(seg: EdlSegment, probe: MediaProbeResult): boolean {
  const start = Math.max(0, Number(seg.startOffset ?? 0));
  if (start > 0.05) return false;
  const refDuration = probe.durationSeconds ?? seg.sourceDuration ?? null;
  const end = Number(seg.endOffset ?? seg.duration ?? 0);
  if (refDuration && end > 0 && end < refDuration - 0.15) {
    return false;
  }
  return true;
}

exports.stitchPerformanceReel = functions
  .runWith({ memory: "4GB", timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    if (data?.simulateError === true) {
      throw new functions.https.HttpsError(
        "internal",
        "Simulated Transcoder API Failure (Dev HUD Override)."
      );
    }

    const uid = context.auth.uid;
    const memoryId = data?.memoryId;
    if (!memoryId || typeof memoryId !== "string" || !SAFE_MEMORY_ID_REGEX.test(memoryId)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid or missing memoryId.");
    }

    const bucket = admin.storage().bucket();
    const edlPath = `users/${uid}/memories/${memoryId}/edl.json`;
    const isAudioOnly = data?.isAudioOnly === true;
    const ffmpegBin = resolveFfmpegBin();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mw-stitch-"));

    try {
      console.log(`[Stitcher] Commencing Choice-A MP4 stitch for memory: ${memoryId} (audioOnly=${isAudioOnly})`);

      const [edlContent] = await bucket.file(edlPath).download();
      const edl: EdlSegment[] = JSON.parse(edlContent.toString());

      if (!Array.isArray(edl) || edl.length < 1 || edl.length > 20) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "EDL must contain between 1 and 20 segments."
        );
      }

      // Download each unique source file once (deduplicated by sourceId / existingStoragePath)
      const downloadedMap = new Map<string, { localPath: string; storagePath: string; probe: MediaProbeResult }>();
      const resolvedSlices: Array<{
        seg: EdlSegment;
        localPath: string;
        storagePath: string;
        probe: MediaProbeResult;
        start: number;
        sliceDuration: number | null;
      }> = [];

      for (let i = 0; i < edl.length; i++) {
        const seg = edl[i];
        const { storagePath, cacheKey } = validateAndResolveSegmentSource(uid, memoryId, seg);
        let cached = downloadedMap.get(cacheKey);
        if (!cached) {
          const ext = path.extname(storagePath) || ".webm";
          const localPath = path.join(tempDir, `src_${downloadedMap.size}${ext}`);
          console.log(`[Stitcher] Downloading unique source: ${storagePath}`);
          await bucket.file(storagePath).download({ destination: localPath });
          const probe = await probeMediaWithFfmpeg(ffmpegBin, localPath);
          cached = { localPath, storagePath, probe };
          downloadedMap.set(cacheKey, cached);
        }

        const start = Math.max(0, Number(seg.startOffset ?? 0));
        const rawEnd = seg.endOffset !== undefined ? Number(seg.endOffset) : null;
        const rawDur = seg.duration !== undefined ? Number(seg.duration) : null;
        let sliceDuration: number | null = null;
        if (rawEnd !== null && rawEnd > start) {
          sliceDuration = rawEnd - start;
        } else if (rawDur !== null && rawDur > 0) {
          sliceDuration = rawDur;
        } else if (cached.probe.durationSeconds && cached.probe.durationSeconds > start) {
          sliceDuration = cached.probe.durationSeconds - start;
        }

        resolvedSlices.push({
          seg,
          localPath: cached.localPath,
          storagePath: cached.storagePath,
          probe: cached.probe,
          start,
          sliceDuration,
        });
      }

      const destPath = `users/${uid}/memories/${memoryId}/final.mp4`;
      const finalFile = bucket.file(destPath);
      const downloadToken = crypto.randomUUID();
      let finalDurationSeconds = 0;

      // Instant zero-transcode GCS copy ONLY when single uncut slice is ALREADY an .mp4
      const singleSlice = resolvedSlices.length === 1 ? resolvedSlices[0] : null;
      const canInstantCopy =
        singleSlice !== null &&
        !isAudioOnly &&
        singleSlice.probe.isMp4 &&
        isSegmentUncut(singleSlice.seg, singleSlice.probe);

      if (canInstantCopy && singleSlice) {
        console.log(`[Stitcher] Single uncut MP4 detected — performing instant GCS copy.`);
        if (singleSlice.storagePath !== destPath) {
          await bucket.file(singleSlice.storagePath).copy(finalFile);
        }
        await finalFile.setMetadata({
          contentType: "video/mp4",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        });
        finalDurationSeconds = singleSlice.probe.durationSeconds ?? singleSlice.sliceDuration ?? 0;
      } else {
        const finalOutputPath = path.join(tempDir, "final.mp4");
        const firstVideoProbe = resolvedSlices.find((s) => s.probe.hasVideo)?.probe || resolvedSlices[0].probe;
        const { w: targetW, h: targetH } = computeTargetDimensions(
          firstVideoProbe.width,
          firstVideoProbe.height
        );
        const vfGraph = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

        const buildSliceArgs = (
          slice: (typeof resolvedSlices)[number],
          outPath: string,
          withFaststart: boolean
        ): string[] => {
          const args: string[] = ["-y", "-hide_banner", "-loglevel", "warning"];
          if (slice.start > 0.01) {
            args.push("-ss", slice.start.toFixed(3));
          }
          args.push("-i", slice.localPath);

          const needsSilentAudio = !isAudioOnly && !slice.probe.hasAudio;
          if (needsSilentAudio) {
            args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");
          }

          if (slice.sliceDuration !== null && slice.sliceDuration > 0.05) {
            args.push("-t", slice.sliceDuration.toFixed(3));
          }

          if (isAudioOnly) {
            args.push(
              "-vn",
              "-c:a", "aac",
              "-b:a", "128k",
              "-ar", "48000",
              "-ac", "2",
              "-af", "aresample=async=1:first_pts=0",
              "-avoid_negative_ts", "make_zero"
            );
          } else {
            if (needsSilentAudio) {
              args.push("-map", "0:v:0", "-map", "1:a:0", "-shortest");
            }
            args.push(
              "-vf", vfGraph,
              "-c:v", "libx264",
              "-preset", "superfast",
              "-crf", "23",
              "-threads", "0",
              "-pix_fmt", "yuv420p",
              "-r", "30",
              "-vsync", "cfr",
              "-video_track_timescale", "30000",
              "-c:a", "aac",
              "-b:a", "128k",
              "-ar", "48000",
              "-ac", "2",
              "-af", "aresample=async=1:first_pts=0",
              "-avoid_negative_ts", "make_zero"
            );
          }

          if (withFaststart) {
            args.push("-movflags", "+faststart");
          }
          args.push(outPath);
          return args;
        };

        if (resolvedSlices.length === 1) {
          console.log(`[Stitcher] Running single-pass FFmpeg transcode (${targetW}x${targetH})...`);
          await runFfmpeg(ffmpegBin, buildSliceArgs(resolvedSlices[0], finalOutputPath, true));
        } else {
          const sliceOutputPaths: string[] = [];
          for (let i = 0; i < resolvedSlices.length; i++) {
            const sliceOut = path.join(tempDir, `slice_${i}.mp4`);
            console.log(
              `[Stitcher] Transcoding slice ${i + 1}/${resolvedSlices.length} (start=${resolvedSlices[i].start}s, dur=${resolvedSlices[i].sliceDuration ?? "full"}s)...`
            );
            await runFfmpeg(ffmpegBin, buildSliceArgs(resolvedSlices[i], sliceOut, false));
            sliceOutputPaths.push(sliceOut);
          }

          const concatListPath = path.join(tempDir, "concat_list.txt");
          const listContent = sliceOutputPaths
            .map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
            .join("\n");
          fs.writeFileSync(concatListPath, listContent, "utf8");

          console.log(`[Stitcher] Concatenating ${sliceOutputPaths.length} normalised MP4 slices...`);
          await runFfmpeg(ffmpegBin, [
            "-y",
            "-hide_banner",
            "-loglevel", "warning",
            "-f", "concat",
            "-safe", "0",
            "-i", concatListPath,
            "-c", "copy",
            "-movflags", "+faststart",
            finalOutputPath,
          ]);
        }

        const outProbe = await probeMediaWithFfmpeg(ffmpegBin, finalOutputPath);
        finalDurationSeconds =
          outProbe.durationSeconds ??
          resolvedSlices.reduce((acc, s) => acc + (s.sliceDuration ?? 0), 0);

        console.log(`[Stitcher] Uploading stitched MP4 to ${destPath} (duration=${finalDurationSeconds.toFixed(2)}s)...`);
        await bucket.upload(finalOutputPath, {
          destination: destPath,
          metadata: {
            contentType: isAudioOnly ? "audio/mp4" : "video/mp4",
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });
      }

      const finalizedUrl = buildFirebaseDownloadUrl(bucket.name, destPath, downloadToken);
      const roundedDuration = Math.max(1, Math.round(finalDurationSeconds));

      // Commit verified MP4 URL and duration to Firestore BEFORE removing superseded files
      await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("memories")
        .doc(memoryId)
        .update({
          videoUrl: finalizedUrl,
          videoDuration: roundedDuration,
          productionStage: 3, // Advance to Act IV
          status: "cinematic-ready",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`[Stitcher] Handshake complete. Firestore updated for memory ${memoryId} (${roundedDuration}s).`);

      // Non-blocking storage cleanup: remove superseded final.webm, edl.json, and raw segments
      try {
        await bucket.file(edlPath).delete().catch(() => undefined);
        await bucket.file(`users/${uid}/memories/${memoryId}/final.webm`).delete().catch(() => undefined);
        await bucket
          .deleteFiles({ prefix: `users/${uid}/memories/${memoryId}/segments/` })
          .catch(() => undefined);
      } catch (cleanupErr: any) {
        console.warn(`[Stitcher] Non-blocking cleanup warning: ${cleanupErr.message}`);
      }

      return { success: true, videoUrl: finalizedUrl, durationSeconds: roundedDuration };
    } catch (err: any) {
      console.error("[Stitcher] Splicing failure:", err);
      if (err instanceof functions.https.HttpsError) {
        throw err;
      }
      throw new functions.https.HttpsError(
        "internal",
        err?.message || "Failed to stitch video segments."
      );
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        console.warn("[Stitcher] Temp dir cleanup warning:", cleanupErr);
      }
    }
  });

exports.videoStitchTrigger = videoStitchTrigger;

exports.purgeExpiredLogs = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  const RETENTION_DAYS = 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  console.log(`[PurgeLogs] Initiating log cleanup. Deleting system_logs older than: ${cutoff.toISOString()}`);

  const db = admin.firestore();
  const logsRef = db.collection("system_logs");

  let deletedCount = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await logsRef
      .where("timestamp", "<", cutoff)
      .limit(400)
      .get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.size;
    console.log(`[PurgeLogs] Batched deleted ${snapshot.size} logs. Total deleted: ${deletedCount}`);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[PurgeLogs] Log cleanup ceremony completed. Total system_logs deleted: ${deletedCount}`);
});
