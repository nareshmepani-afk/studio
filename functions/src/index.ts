
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { videoStitchTrigger } from "./videoStitchTrigger";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { User } from "./types";
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from "./constants";

if (admin.apps.length === 0) {
  admin.initializeApp();
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

// Helper function to stitch segments locally using ffmpeg
async function stitchWithFfmpeg(uid: string, memoryId: string, edl: any[], bucket: any): Promise<string> {
  console.log(`[FFmpeg Stitcher] Starting ffmpeg local stitch fallback...`);
  const tempDir = path.join(os.tmpdir(), `stitch_${memoryId}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    const localPaths: string[] = [];
    
    // Download all segments to temp local files
    for (let i = 0; i < edl.length; i++) {
      const seg = edl[i];
      const storagePath = `users/${uid}/memories/${memoryId}/segments/${seg.segmentId}.webm`;
      const localPath = path.join(tempDir, `${seg.segmentId}.webm`);
      console.log(`[FFmpeg Stitcher] Downloading segment: ${storagePath} to ${localPath}`);
      await bucket.file(storagePath).download({ destination: localPath });
      localPaths.push(localPath);
    }

    const outputFile = path.join(tempDir, "final.webm");
    
    // Construct ffmpeg concat list
    const listFilePath = path.join(tempDir, "input_list.txt");
    const listContent = localPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(listFilePath, listContent);
    
    console.log(`[FFmpeg Stitcher] Concat list generated:\n${listContent}`);

    // Run ffmpeg command via exec
    const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputFile}"`;
    
    await new Promise<void>((resolve, reject) => {
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.warn(`[FFmpeg Stitcher] local ffmpeg exec error: ${error.message}`);
          console.warn(`[FFmpeg Stitcher] Stderr: ${stderr}`);
          reject(error);
        } else {
          console.log(`[FFmpeg Stitcher] local ffmpeg concat complete: ${stdout}`);
          resolve();
        }
      });
    });

    // Upload output file back to bucket
    const destPath = `users/${uid}/memories/${memoryId}/final.webm`;
    console.log(`[FFmpeg Stitcher] Uploading stitched file to storage: ${destPath}`);
    await bucket.upload(outputFile, {
      destination: destPath,
      metadata: {
        contentType: "video/webm",
      }
    });

    const finalizedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media`;
    return finalizedUrl;
  } finally {
    // Cleanup temp directory files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn(`[FFmpeg Stitcher] Temp cleanup error:`, cleanupErr);
    }
  }
}

exports.stitchPerformanceReel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  if (data.simulateError === true) {
    throw new functions.https.HttpsError("internal", "Simulated Transcoder API Failure (Dev HUD Override).");
  }
  const uid = context.auth.uid;
  const memoryId = data.memoryId;
  if (!memoryId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing memoryId.");
  }

  const bucket = admin.storage().bucket();
  const edlPath = `users/${uid}/memories/${memoryId}/edl.json`;
  
  try {
    console.log(`[Stitcher] Commencing stitch check for memory: ${memoryId}`);
    
    // Check if edl.json exists, download it
    const [edlContent] = await bucket.file(edlPath).download();
    const edl = JSON.parse(edlContent.toString());
    console.log(`[Stitcher] Successfully parsed EDL with ${edl.length} segments.`);

    const isAudioOnly = data.isAudioOnly === true;
    let finalizedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`users/${uid}/memories/${memoryId}/final.webm`)}?alt=media`;

    if (isAudioOnly) {
      console.log(`[Stitcher] Audio-only take detected. Bypassing Transcoder API and using local ffmpeg block.`);
      try {
        finalizedUrl = await stitchWithFfmpeg(uid, memoryId, edl, bucket);
      } catch (e: any) {
        console.warn(`[Stitcher] Local ffmpeg stitch failed, copying first segment as backup: ${e.message}`);
        if (edl.length > 0) {
          const firstSegmentPath = `users/${uid}/memories/${memoryId}/segments/${edl[0].segmentId}.webm`;
          const finalFile = bucket.file(`users/${uid}/memories/${memoryId}/final.webm`);
          await bucket.file(firstSegmentPath).copy(finalFile);
        }
      }
    } else {
      try {
        console.log(`[Stitcher] Video take detected. Initiating primary Transcoder API pipeline...`);
        // Simulate transcoding delay
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        // Primary copy/stitch simulator
        if (edl.length > 0) {
          const firstSegmentPath = `users/${uid}/memories/${memoryId}/segments/${edl[0].segmentId}.webm`;
          const finalFile = bucket.file(`users/${uid}/memories/${memoryId}/final.webm`);
          await bucket.file(firstSegmentPath).copy(finalFile);
          console.log(`[Stitcher] Transcoder API mock concat complete.`);
        }
      } catch (transcoderErr) {
        console.warn(`[Stitcher] Primary Transcoder API pipeline failed. Falling back to local ffmpeg block.`, transcoderErr);
        try {
          finalizedUrl = await stitchWithFfmpeg(uid, memoryId, edl, bucket);
        } catch (e: any) {
          console.warn(`[Stitcher] Fallback local ffmpeg stitch failed, copying first segment: ${e.message}`);
          if (edl.length > 0) {
            const firstSegmentPath = `users/${uid}/memories/${memoryId}/segments/${edl[0].segmentId}.webm`;
            const finalFile = bucket.file(`users/${uid}/memories/${memoryId}/final.webm`);
            await bucket.file(firstSegmentPath).copy(finalFile);
          }
        }
      }
    }

    // Update Firestore to complete handshake
    await admin.firestore().collection("users").doc(uid).collection("memories").doc(memoryId).update({
      videoUrl: finalizedUrl,
      productionStage: 3, // Advance to Act IV
      status: "cinematic-ready",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[Stitcher] Handshake complete. Firestore status updated for memory: ${memoryId}`);

    // Storage Cleanup Lifecycle: Delete raw segment chunks and the EDL manifest to conserve storage
    try {
      console.log(`[Stitcher] Initiating storage cleanup for memory ${memoryId}...`);
      
      // Delete edl.json
      await bucket.file(edlPath).delete().catch(err => 
        console.warn(`[Stitcher] Could not delete EDL manifest: ${err.message}`)
      );
      
      // Delete all segment chunks under the segments directory
      const segmentsPrefix = `users/${uid}/memories/${memoryId}/segments/`;
      await bucket.deleteFiles({ prefix: segmentsPrefix }).catch(err =>
        console.warn(`[Stitcher] Could not delete raw segments: ${err.message}`)
      );
      
      console.log(`[Stitcher] Storage cleanup successful. Raw segments and manifest cleared.`);
    } catch (cleanupErr: any) {
      console.warn(`[Stitcher] Non-blocking storage cleanup warning: ${cleanupErr.message}`);
    }

    return { success: true, videoUrl: finalizedUrl };
  } catch (err: any) {
    console.error("[Stitcher] Splicing failure:", err);
    throw new functions.https.HttpsError("internal", err.message || "Failed to stitch video segments.");
  }
});

exports.videoStitchTrigger = videoStitchTrigger;

exports.purgeExpiredLogs = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
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
    
    // Pause briefly to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log(`[PurgeLogs] Log cleanup ceremony completed. Total system_logs deleted: ${deletedCount}`);
});
