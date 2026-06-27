import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

// Initialize Firebase Admin if not already initialized in function scope
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

export const videoStitchTrigger = onDocumentUpdated('video_jobs/{jobId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const dataAfter = change.after.data();
  const dataBefore = change.before.data();

  // Guard: Only react when status changes to 'queued'
  if (dataAfter.status !== 'queued' || dataBefore.status === 'queued') {
    return;
  }

  const jobId = event.params.jobId;
  const docRef = db.collection('video_jobs').doc(jobId);
  const jobDir = path.join('/tmp', jobId);

  try {
    // 1. Mark status as processing and record initial telemetry log
    await docRef.update({
      status: 'processing',
      logs: admin.firestore.FieldValue.arrayUnion('[SYSTEM]: Initializing FFmpeg workspace...')
    });

    const inviteId = dataAfter.inviteId;
    const segments = dataAfter.segments || [];

    // Create job-specific staging directory in ephemeral /tmp
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }

    await docRef.update({
      logs: admin.firestore.FieldValue.arrayUnion(`[SYSTEM]: Resolving GCS bucket and downloading ${segments.length} segment files...`)
    });

    const bucket = storage.bucket();

    // 2. Download files from staging directory in bucket
    const localPaths: string[] = [];
    for (const seg of segments) {
      const gcsPath = `staging/video-processing/${inviteId}/${seg.segmentId}.webm`;
      const localPath = path.join(jobDir, `${seg.segmentId}.webm`);
      
      await bucket.file(gcsPath).download({ destination: localPath });
      localPaths.push(localPath);
    }

    // 3. Pass 1: Conditionally index / fix timestamps for every segment file
    const indexedPaths: string[] = [];
    for (let i = 0; i < localPaths.length; i++) {
      const inputPath = localPaths[i];
      const outputPath = path.join(jobDir, `indexed_${i}.webm`);
      
      await docRef.update({
        logs: admin.firestore.FieldValue.arrayUnion(`[FFMPEG]: Indexing segment ${i} to resolve VFR timestamp cues...`)
      });

      // Run FFmpeg to regenerate timestamps and fix WebM header
      const indexCmd = `ffmpeg -y -i "${inputPath}" -c copy -fflags +genpts "${outputPath}"`;
      await new Promise<void>((resolve, reject) => {
        exec(indexCmd, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Failed to index segment ${i}: ${error.message}. Stderr: ${stderr}`));
          } else {
            resolve();
          }
        });
      });
      indexedPaths.push(outputPath);
    }

    // 4. Pass 2: Generate input text list file
    const listFilePath = path.join(jobDir, 'input_list.txt');
    const listContent = indexedPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join('\n');
    fs.writeFileSync(listFilePath, listContent);

    await docRef.update({
      logs: admin.firestore.FieldValue.arrayUnion(`[FFMPEG]: Demuxer file manifest compiled. Executing final merge...`)
    });

    const finalPath = path.join(jobDir, `${jobId}-output.webm`);
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${finalPath}"`;

    await new Promise<void>((resolve, reject) => {
      exec(concatCmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`FFmpeg concat failed: ${error.message}. Stderr: ${stderr}`));
        } else {
          resolve();
        }
      });
    });

    // 5. Upload assembled output back to GCS bucket destination
    const destPath = `users-reels/${inviteId}/${jobId}-complete.webm`;
    await bucket.upload(finalPath, {
      destination: destPath,
      metadata: { contentType: 'video/webm' }
    });

    const finalizedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media`;

    await docRef.update({
      logs: admin.firestore.FieldValue.arrayUnion('[SYSTEM]: Final assembly successfully staged and uploaded.'),
      videoUrl: finalizedUrl,
      status: 'completed'
    });

  } catch (error: any) {
    console.error(`[Stitch Job Error] Job: ${jobId}`, error);
    await docRef.update({
      status: 'failed',
      logs: admin.firestore.FieldValue.arrayUnion(`[ERROR]: Stitch processing failed: ${error.message}`)
    });
  } finally {
    // 6. Memory/Storage Hygiene: Ensure strict removal of all files in /tmp to prevent container RAM leakage
    try {
      if (fs.existsSync(jobDir)) {
        const files = fs.readdirSync(jobDir);
        for (const file of files) {
          fs.unlinkSync(path.join(jobDir, file));
        }
        fs.rmdirSync(jobDir);
        console.log(`[Stitch Job Cleanup] Successfully cleared staging directory for job: ${jobId}`);
      }
    } catch (cleanupError) {
      console.error('[Stitch Job Cleanup] Error clearing staging directory:', cleanupError);
    }
  }
});
