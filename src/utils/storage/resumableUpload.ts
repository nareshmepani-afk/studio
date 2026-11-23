export interface UploadProgressPayload {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export async function uploadFileInChunks(
  file: Blob,
  sessionUrl: string,
  chunkSize = 2 * 1024 * 1024, // 2MB Default
  onProgress?: (progress: UploadProgressPayload) => void
): Promise<void> {
  const totalSize = file.size;
  if (totalSize === 0) return;

  let currentOffset = 0;
  let consecutiveRetries = 0;
  let totalFailures = 0;
  let zeroOffsetResets = 0;
  const maxConsecutiveRetries = 5;
  const maxTotalFailures = 12;
  const maxZeroResets = 3;

  while (currentOffset < totalSize) {
    const end = Math.min(currentOffset + chunkSize, totalSize);
    const chunk = file.slice(currentOffset, end);

    try {
      // Omit forbidden 'Content-Length' header (browser computes it automatically; setting it triggers CORS/fetch errors)
      const response = await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${currentOffset}-${end - 1}/${totalSize}`,
        },
        body: chunk,
      });

      if (response.status === 200 || response.status === 201) {
        currentOffset = totalSize;
        consecutiveRetries = 0;
        onProgress?.({
          bytesTransferred: totalSize,
          totalBytes: totalSize,
          percentage: 100,
        });
        return;
      }

      if (response.status === 308) {
        currentOffset = end;
        consecutiveRetries = 0;
        onProgress?.({
          bytesTransferred: currentOffset,
          totalBytes: totalSize,
          percentage: Math.round((currentOffset / totalSize) * 100),
        });
        continue;
      }

      if (response.status === 404 || response.status === 410) {
        throw new FatalUploadError(`Resumable upload session expired (HTTP ${response.status}).`);
      }

      throw new Error(`Unexpected GCS Status Code: ${response.status}`);
    } catch (error) {
      if (error instanceof FatalUploadError) {
        throw error;
      }

      consecutiveRetries++;
      totalFailures++;
      console.warn(
        `[Upload:Chunk] Failed at offset ${currentOffset} (retry ${consecutiveRetries}/${maxConsecutiveRetries}, total ${totalFailures}/${maxTotalFailures}).`,
        error
      );

      if (consecutiveRetries > maxConsecutiveRetries || totalFailures > maxTotalFailures) {
        throw new Error('Upload aborted: Maximum recovery limits exceeded.');
      }

      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, consecutiveRetries) * 1000));

      const recoveredOffset = await queryGCSOffset(sessionUrl, totalSize);
      if (recoveredOffset >= totalSize) {
        onProgress?.({
          bytesTransferred: totalSize,
          totalBytes: totalSize,
          percentage: 100,
        });
        return;
      }

      if (recoveredOffset === 0 && currentOffset > 0) {
        zeroOffsetResets++;
        if (zeroOffsetResets >= maxZeroResets) {
          throw new Error('Upload aborted: Upload offset repeatedly reset to 0.');
        }
      }
      currentOffset = recoveredOffset;
    }
  }
}

class FatalUploadError extends Error {}

// Interrogate GCS to discover how many bytes it successfully saved before the failure
async function queryGCSOffset(sessionUrl: string, totalSize: number): Promise<number> {
  const res = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Range': `bytes */${totalSize}` },
  });

  if (res.status === 200 || res.status === 201) {
    return totalSize;
  }

  if (res.status === 404 || res.status === 410) {
    throw new FatalUploadError(`Resumable upload session expired during offset probe (HTTP ${res.status}).`);
  }

  if (res.status === 308) {
    const rangeHeader = res.headers.get('Range');
    if (rangeHeader) {
      const lastByte = parseInt(rangeHeader.split('-')[1], 10);
      if (!Number.isNaN(lastByte)) {
        return lastByte + 1;
      }
    }
  }

  return 0;
}
