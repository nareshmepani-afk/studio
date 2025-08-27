
import { test, expect } from '@playwright/test';

test.describe('Video Editor Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-editor-test.html');
  });

  test('should load the page and initialize FFmpeg', async ({ page }) => {
    await expect(page.locator('#status-message')).toHaveText('Ready. You can now run tests or trim the video.');
  });

  test('should run integration tests and pass', async ({ page }) => {
    await page.click('#run-tests');
    await expect(page.locator('.test-result.passed')).toHaveCount(1);
  });

  test('should trim the video and update the output', async ({ page }) => {
    await page.fill('#trim-start', '1');
    await page.fill('#trim-end', '2');
    await page.click('#trim-video');
    await expect(page.locator('#trimmed-video-output')).toHaveJSProperty('duration', 1);
  });
});
