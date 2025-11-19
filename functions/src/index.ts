
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as ffmpeg from "fluent-ffmpeg";
import {path as ffmpegPath} from "@ffmpeg-installer/ffmpeg";

admin.initializeApp();
ffmpeg.setFfmpegPath(ffmpegPath);

export const processVideoUpload = functions.storage.object()
  .onFinalize(async (object) => {
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath || !contentType) {
      functions.logger.log("Exiting function: Missing filePath or contentType.");
      return null;
    }

    // We are only interested in files in the 'temp-uploads' directory
    if (!filePath.startsWith("temp-uploads/")) {
      functions.logger.log(`File ${filePath} is not in temp-uploads. Exiting.`);
      return null;
    }

    // Prevent infinite loops from triggering the function on its own output
    if (object.metadata?.processed) {
      functions.logger.log("File is already processed. Exiting.");
      return null;
    }

    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const finalFileName = path.basename(filePath).replace(/\.[^/.]+$/, "") +
      ".mp4";
    const finalFilePath = path.join(os.tmpdir(), finalFileName);

    try {
      // 1. Download file from Cloud Storage to the Functions' temp directory.
      functions.logger.log(`Downloading ${filePath} to ${tempFilePath}...`);
      await bucket.file(filePath).download({destination: tempFilePath});
      functions.logger.log("Download complete.");

      // 2. Convert video to MP4 using fluent-ffmpeg.
      await new Promise<void>((resolve, reject) => {
        functions.logger.log(`Starting FFmpeg conversion to ${finalFilePath}.`);
        ffmpeg(tempFilePath)
          .outputOptions("-c:v", "libx264")
          .outputOptions("-preset", "ultrafast")
          .outputOptions("-c:a", "aac")
          .output(finalFilePath)
          .on("end", () => {
            functions.logger.log("FFmpeg conversion finished.");
            resolve();
          })
          .on("error", (err) => {
            functions.logger.error("FFmpeg error:", err);
            reject(err);
          })
          .run();
      });

      // 3. Upload the converted file back to a permanent location.
      const userId = filePath.split("/")[1];
      const permanentPath = `users/${userId}/memories/${finalFileName}`;
      functions.logger.log(`Uploading converted file to ${permanentPath}...`);
      const [file] = await bucket.upload(finalFilePath, {
        destination: permanentPath,
        metadata: {
          contentType: "video/mp4",
          // Correctly set the custom metadata at the top level
          metadata: {
            processed: "true",
          },
        },
      });
      functions.logger.log("Upload of converted file complete.");


      // 4. Get the public URL.
      const publicUrl = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // Far-future expiration date
      }).then((urls) => urls[0]);
      functions.logger.log("Public URL generated:", publicUrl);

      // 5. Update Firestore.
      const db = admin.firestore();
      // Find the memory document that contains the original temp path.
      const snapshot = await db.collectionGroup("memories")
        .where("mediaAttachments.url", "==", filePath).get();

      if (snapshot.empty) {
        functions.logger.warn("No memory document found for temp path:",
          filePath);
        return null;
      }

      const memoryDoc = snapshot.docs[0];
      functions.logger.log("Found memory document:", memoryDoc.id);
      const memoryData = memoryDoc.data();
      const newMediaAttachments = memoryData.mediaAttachments
        .map((att: any) => {
          if (att.url === filePath) {
            return {...att, url: publicUrl, processingStatus: "complete"};
          }
          return att;
        });

      await memoryDoc.ref.update({mediaAttachments: newMediaAttachments});
      functions.logger.log("Firestore document updated successfully.");

      // 6. Clean up temporary files.
      await bucket.file(filePath).delete();
      functions.logger.log(`Deleted temporary storage file: ${filePath}`);
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(finalFilePath);
      functions.logger.log("Cleaned up local temporary files.");
    } catch (error) {
      functions.logger.error("Error during processing:", error);
      // Clean up local files on error
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
      return null;
    }

    return null;
  });
