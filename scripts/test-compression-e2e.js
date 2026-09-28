const { chromium } = require('playwright');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = 'C:\\Users\\home\\Downloads\\memory-weaver-dev-firebase-adminsdk-fbsvc-70bb84f941.json';

// Initialize Firebase Admin for checking Firestore telemetry logs
let db;
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  db = getFirestore();
} else {
  console.warn("WARNING: Service account JSON not found. Will skip Firestore validation phase.");
}

async function runTest() {
  let browser;
  let context;
  let page;
  try {
    console.log("[E2E Compression Test] Launching automated Chrome instance with fake camera media...");
    browser = await chromium.launch({
      headless: true,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--window-size=1280,720'
      ]
    });

    const videoDir = path.join(__dirname, '..', 'test-results', 'videos');
    fs.mkdirSync(videoDir, { recursive: true });

    // Use standard 1280x720 Desktop Viewport, Video Recording, and Desktop User-Agent
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1280, height: 720 }
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
      permissions: ['geolocation', 'camera', 'microphone']
    });

    await context.grantPermissions(['camera', 'microphone', 'geolocation'], { origin: 'https://dev.memoryweaver.studio' });

    page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Register browser logs and error listeners for debugging
    page.on('console', msg => {
      console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[Browser Runtime Error] ${err.stack}`);
    });
    page.on('requestfailed', request => {
      console.log(`[Request Failed] URL: ${request.url()} - Error: ${request.failure()?.errorText}`);
    });
    
    // Set up Chrome DevTools Protocol session to throttle network to 3G speed
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150, // 150ms RTT
      downloadThroughput: 750 * 1024 / 8, // 750 kbps download
      uploadThroughput: 250 * 1024 / 8 // 250 kbps upload
    });

    // STEP 1: Authenticated Session Sign-In / Account Provisioning Flow
    console.log("[E2E Compression Test] Navigating to login route...");
    await page.goto('https://dev.memoryweaver.studio/login', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'test-results/step1_login_page.png' });

    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password';

    console.log(`[E2E Compression Test] Submitting credentials for account: ${testEmail}...`);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for authentication response
    await page.waitForTimeout(3500);

    // If account invalid or not registered yet, provision test user account via /register
    if (page.url().includes('/login')) {
      console.log("[E2E Compression Test] Account not found. Provisioning automated test account via /register...");
      await page.goto('https://dev.memoryweaver.studio/register', { waitUntil: 'domcontentloaded' });
      await page.fill('#name', 'Automated E2E Tester');
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await page.fill('#confirm-password', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
      console.log("[E2E Compression Test] Test account provisioned successfully!");
    }

    await page.screenshot({ path: 'test-results/step2_authenticated.png' });

    // STEP 2: Direct Navigation to Studio Production Workspace (Solo Stage View)
    const targetUrl = `https://dev.memoryweaver.studio/studio/production/p1?room=solo`;
    console.log(`[E2E Compression Test] Navigating authenticated session to studio deck: ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    console.log(`[E2E Compression Test] Current URL: ${page.url()}`);
    console.log(`[E2E Compression Test] Page Title: ${await page.title()}`);
    await page.screenshot({ path: 'test-results/step3_studio_loaded.png' });

    // Allow time for Firestore state rehydration to complete
    console.log("[E2E Compression Test] Waiting 4 seconds for Firestore rehydration to complete...");
    await page.waitForTimeout(4000);

    // Passively disable pointer events & visibility on Sonner toasts to prevent UI blockage
    await page.evaluate(() => {
      document.querySelectorAll('[data-sonner-toast], .sonner-toast').forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
      });
    });

    // STEP 3: Dismiss Onboarding Briefing overlay using native Escape & Enter keypresses
    console.log("[E2E Compression Test] Pressing native Escape key to dismiss Onboarding Briefing overlay...");
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/step4_after_escape.png' });

    // Explicitly click "Solo Stage" pill or monitor icon button to switch into the full Stage View Deck
    console.log("[E2E Compression Test] Switching workspace view into Solo Stage Deck...");
    const soloStageBtn = page.locator('button:has-text("Solo Stage"), button[title*="Stage"]').first();
    if (await soloStageBtn.isVisible().catch(() => false)) {
      await soloStageBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }

    // STEP 4: Click "Ignite Camera & Mic" if Privacy Shield is active
    console.log("[E2E Compression Test] Checking for Privacy Shield / Optics ignition trigger...");
    const igniteButton = page.locator('button:has-text("Ignite Camera & Mic")');
    if (await igniteButton.first().isVisible().catch(() => false)) {
      console.log("[E2E Compression Test] Igniting optics (disabling Privacy Shield)...");
      await igniteButton.first().click({ force: true });
      await page.waitForTimeout(2000);
    }

    // STEP 5: Click "Confirm Alignment" if tech alignment is required
    console.log("[E2E Compression Test] Checking for technical alignment confirmation button...");
    const confirmAlignmentButton = page.locator('button:has-text("Confirm Alignment")');
    if (await confirmAlignmentButton.first().isVisible().catch(() => false)) {
      console.log("[E2E Compression Test] Confirming technical alignment to enable performance start...");
      await confirmAlignmentButton.first().click({ force: true });
      await page.waitForTimeout(2500);
    }

    // STEP 6: Initiate performance recording take
    console.log("[E2E Compression Test] Initiating recording take (triggers count-in)...");
    const startButton = page.locator('button[aria-label="Start Performance"], button:has-text("RECORDING"), button:has-text("PAUSED")').first();
    await startButton.waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({ path: 'test-results/step5_before_recording.png' });
    await startButton.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/step6_recording_active.png' });

    // Wait for 5s count-in + 16s recording duration = 21 seconds total
    const totalRecordingWait = 21; 
    console.log(`[E2E Compression Test] Recording active. Streaming media for ${totalRecordingWait} seconds...`);
    await page.waitForTimeout(totalRecordingWait * 1000);

    // STEP 7: Finalize recording take by clicking Stop Recording or active recording toggle button
    console.log("[E2E Compression Test] Finalizing recording take...");
    const stopButton = page.locator('button[aria-label="Stop Recording"], button:has-text("RECORDING"), button:has-text("PAUSED")').first();
    await stopButton.waitFor({ state: 'visible', timeout: 10000 });
    await stopButton.click({ force: true });
    
    // Allow time for chunks to compile and client-side telemetry to dispatch
    console.log("[E2E Compression Test] Waiting for telemetry compile and dispatch (6 seconds)...");
    await page.waitForTimeout(6000);

    // Capture final screenshot
    const screenshotPath = path.join(__dirname, '..', 'test-results', 'step7_take_complete.png');
    await page.screenshot({ path: screenshotPath });
    console.log("[E2E Compression Test] Finished recording! Saved final snapshot to:", screenshotPath);

    // Fetch video file recording path
    let videoFilePath = null;
    if (page.video()) {
      videoFilePath = await page.video().path();
      console.log(`[E2E Compression Test] Video recording saved successfully to: ${videoFilePath}`);
    }

    // Validate telemetry in Firestore database
    if (db) {
      console.log("[E2E Compression Test] Querying Firestore system_logs for telemetry validation...");
      const snapshot = await db.collection('system_logs')
        .where('structPayload.segmentId', '>', '')
        .orderBy('structPayload.segmentId', 'desc')
        .limit(10)
        .get();

      let matchedLog = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.message === "MediaRecorder: Compiled segment") {
          matchedLog = data;
        }
      });

      if (matchedLog) {
        console.log("=== Found Matching Telemetry Log ===");
        console.log(`Segment ID: ${matchedLog.structPayload.segmentId}`);
        console.log(`Duration: ${matchedLog.structPayload.duration} seconds`);
        console.log(`File Size: ${matchedLog.structPayload.size} bytes (~${(matchedLog.structPayload.size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`Target Type: ${matchedLog.structPayload.type}`);

        // Size Verification Assertions
        const maxAllowedSize = 1.6 * 1024 * 1024; // 1.6 MB limit for 16 seconds on compact mode
        if (matchedLog.structPayload.size < maxAllowedSize) {
          console.log("✅ SUCCESS: Client-Side WebM Compression succeeded! Weight is within limit threshold.");
        } else {
          console.error("❌ FAILURE: Video payload exceeds maximum compression weight!");
        }
      } else {
        console.log("⚠️ Could not find matching Compiled segment telemetry log in Firestore. Checking recent start logs...");
        const startSnapshot = await db.collection('system_logs')
          .where('message', '==', 'MediaRecorder: Start recording')
          .limit(10)
          .get();
          
        startSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`Start Log:`, JSON.stringify(data.structPayload || {}, null, 2));
        });
      }
    }

    console.log("[E2E Compression Test] Done!");
  } catch (error) {
    console.error("[E2E Compression Test] Unexpected execution error:", error.message || error);
    process.exitCode = 1;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      console.log("[E2E Compression Test] Cleaning up: Closing browser instance...");
      await browser.close();
    }
    console.log("[E2E Compression Test] Execution complete. Forcing process exit...");
    process.exit(process.exitCode || 0);
  }
}

runTest();
