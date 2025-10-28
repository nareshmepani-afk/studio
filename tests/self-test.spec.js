
const { test, expect } = require('@playwright/test');

test.describe('Video Editor Self-Test', () => {
  test('should run the self-test and log the results', async ({ page }) => {
    // Navigate to the local HTML file
    await page.goto('public/index.html');

    // Click the "Run Self-Test" button
    await page.click('#run-self-test');

    // Wait for the tests to complete
    await page.waitForSelector('#overall-test-status:not(:text("Running..."))', { timeout: 60000 });

    // Log the results to the console
    const overallStatus = await page.textContent('#overall-test-status');
    const assessmentScore = await page.textContent('#self-assessment-score');
    const testSteps = await page.textContent('#test-steps-container');

    console.log('--- Self-Test Results ---');
    console.log(`Overall Status: ${overallStatus}`);
    console.log(`Self-Assessment Score: ${assessmentScore}`);
    console.log('\nTest Steps:\n', testSteps);
    console.log('-------------------------');

    // Assert that the test passed
    await expect(page.locator('#overall-test-status')).toHaveText('All tests passed!');
  });
});
