import { test, expect } from '@playwright/test';

/**
 * 🛡️ Automated In-Browser Sentinel Smoke Shield (TOOL-MW-145 / RFC-MW-144)
 *
 * Verifies that the public staging studio dashboard loads without emitting
 * [CRITICAL_DATA_SHADOWING_ANOMALY] or triggering DATA_SHADOWING_ANOMALY_DETECTED.
 *
 * Eliminates the manual F12 DevTools trap by asserting programmatically in CI/CD.
 */

test.describe('Dashboard Data Integrity Sentinel E2E Smoke Shield', () => {
  test('Dashboard loads with zero data-shadowing telemetry alerts', async ({ page }) => {
    const anomalies: string[] = [];

    // Attach capturing listener to capture any console errors or sentinel alarms
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('CRITICAL_DATA_SHADOWING_ANOMALY') ||
        text.includes('DATA_SHADOWING_ANOMALY_DETECTED')
      ) {
        anomalies.push(text);
      }
    });

    // Navigate to staging public studio dashboard
    const response = await page.goto('https://dev.memoryweaver.studio/studio', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    expect(response?.status()).toBeLessThan(400);

    // Wait for client rehydration and Firestore correlation to complete
    await page.waitForTimeout(3000);

    // Assert that zero authentic documents were shadowed (M == N)
    if (anomalies.length > 0) {
      console.error('Data shadowing anomalies detected during page load:', anomalies);
    }
    expect(anomalies).toHaveLength(0);
  });
});
