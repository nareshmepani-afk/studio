const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  // Grant camera and microphone permissions to the browser context
  await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:8080' });
});

test('should record, trim, and upload a video', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:8080/');

  // Wait for FFmpeg to load
  await expect(page.locator('text=FFmpeg loaded successfully!')).toBeVisible({ timeout: 15000 });

  // Start recording
  await page.click('text=Start Recording');
  await expect(page.locator('text=Recording...')).toBeVisible();

  // Wait for a few seconds to record
  await page.waitForTimeout(3000);

  // Stop recording
  await page.click('text=Stop Recording');
  await expect(page.locator('text=Recording stopped. Video ready for trimming.')).toBeVisible();

  // Set trim times (e.g., from 1 to 2 seconds)
  await page.fill('#trim-start', '1');
  await page.fill('#trim-end', '2');

  // Trim the video
  await page.click('text=Trim Video');
  await expect(page.locator('text=Trimming complete!')).toBeVisible({ timeout: 15000 });

  // Upload the video
  await page.click('text=Upload Trimmed Video');
  await expect(page.locator('text=/Video uploaded successfully!/')).toBeVisible();
});
