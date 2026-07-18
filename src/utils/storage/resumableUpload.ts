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
  let currentOffset = 0;
  let retryCount = 0;
  const maxRetries = 5;

  while (currentOffset < totalSize) {
    const end = Math.min(currentOffset + chunkSize, totalSize);
    const chunk = file.slice(currentOffset, end);
    const chunkLength = chunk.size;

    try {
      const response = await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunkLength.toString(),
          'Content-Range': `bytes ${currentOffset}-${end - 1}/${totalSize}`,
        },
        body: chunk,
      });

      // 308 Resume Incomplete or 200/201 Success
      if (response.status === 200 || response.status === 201 || response.status === 308) {
        currentOffset = end; // Move window forward
        retryCount = 0; // Reset backoff counter

        if (onProgress) {
          onProgress({
            bytesTransferred: currentOffset,
            totalBytes: totalSize,
            percentage: Math.round((currentOffset / totalSize) * 100),
          });
        }
      } else {
        throw new Error(`Unexpected GCS Status Code: ${response.status}`);
      }
    } catch (error) {
      console.warn(`[Upload:Chunk] Failed at offset ${currentOffset}. Retrying...`, error);
      
      if (retryCount >= maxRetries) {
        throw new Error('Upload aborted: Maximum recovery limits exceeded.');
      }
      
      retryCount++;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

      // Self-Healing Status Query to GCS to find exactly where the pipeline left off
      currentOffset = await queryGCSOffset(sessionUrl, totalSize);
    }
  }
}

// Interrogate GCS to discover how many bytes it successfully saved before the failure
async function queryGCSOffset(sessionUrl: string, totalSize: number): Promise<number> {
  try {
    const res = await fetch(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Range': `bytes */${totalSize}` },
    });

    if (res.status === 308) {
      const rangeHeader = res.headers.get('Range');
      if (rangeHeader) {
        const lastByte = parseInt(rangeHeader.split('-')[1], 10);
        return lastByte + 1; // Resume from the next byte
      }
    }
    return 0; // Fallback to start
  } catch {
    return 0;
  }
}
