export async function uploadStory(blob: Blob, fileName: string, inviteId: string): Promise<{ success: boolean; fileKey: string }> {
  if (!blob || !fileName || !inviteId) {
    throw new Error('Missing blob, fileName, or inviteId for upload.');
  }

  try {
    // Step A: Request a pre-signed URL from our secure API endpoint
    const presignedUrlResponse = await fetch('/api/upload/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, contentType: blob.type, inviteId }),
    });

    if (!presignedUrlResponse.ok) {
      const errorBody = await presignedUrlResponse.json();
      throw new Error(`Failed to get pre-signed URL: ${errorBody.error || 'Unknown error'}`)
    }

    const { uploadUrl, fileKey } = await presignedUrlResponse.json();

    if (!uploadUrl || !fileKey) {
        throw new Error('API response did not include a valid uploadUrl and fileKey.');
    }

    // Step B: Upload the file directly to Google Cloud Storage using the pre-signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Direct upload to storage failed with status: ${uploadResponse.statusText}`);
    }

    // The upload was successful
    return { success: true, fileKey };

  } catch (error) {
    console.error('Storyteller upload failed:', error);
    // In a real app, you might want to surface this error to the user more gracefully.
    return { success: false, fileKey: '' };
  }
}
