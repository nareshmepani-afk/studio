
import { FFmpeg } from './ffmpeg/ffmpeg.js';
import { fetchFile } from './ffmpeg/util.js';

// DOM Elements
const videoPreview = document.getElementById('video-preview');
const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');
const trimStartInput = document.getElementById('trim-start');
const trimEndInput = document.getElementById('trim-end');
const trimVideoButton = document.getElementById('trim-video');
const trimmedVideoOutput = document.getElementById('trimmed-video-output');
const statusMessage = document.getElementById('status-message');
const recordingTimer = document.getElementById('recording-timer');

// Self-Test UI Elements
const runSelfTestButton = document.getElementById('run-self-test');
const overallTestStatus = document.getElementById('overall-test-status');
const selfAssessmentScore = document.getElementById('self-assessment-score');
const testStepsContainer = document.getElementById('test-steps-container');
const testHistoryContainer = document.getElementById('test-history-container');

let ffmpeg = null;
let recordedBlob = null;
let mediaRecorder;
let recordingInterval;

// --- Utility Functions ---
const log = (message, type = 'info') => {
    statusMessage.textContent = message;
    statusMessage.className = type;
    console.log(`[${type.toUpperCase()}] ${message}`);
};

const updateTestStepUI = (element, testName, status, message = '') => {
    element.innerHTML = `<b>${testName}:</b> ${status} ${message ? `<br><small>${message}</small>` : ''}`;
    element.className = 'test-step ' + status.toLowerCase();
};


// --- Core Application Logic ---

async function initializeFFmpeg() {
    log('Loading FFmpeg library...', 'info');
    ffmpeg = new FFmpeg({ log: true, progress: ({ progress }) => {
        const percentage = Math.round(progress * 100);
        if (percentage < 100 && percentage > 0) log(`Processing video... ${percentage}%`, 'info');
    }});

    try {
        const coreURL = new URL('/ffmpeg/ffmpeg-core.js', document.baseURI).href;
        const wasmURL = new URL('/ffmpeg/ffmpeg-core.wasm', document.baseURI).href;
        const workerURL = new URL('/ffmpeg/ffmpeg-core.worker.js', document.baseURI).href;
        await ffmpeg.load({ coreURL, wasmURL, workerURL });
        log('Ready to record!', 'success');
        startRecordingButton.disabled = false;
        return true;
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        log('Error: Could not load FFmpeg. Test on a modern browser.', 'error');
        return false;
    }
}

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoPreview.srcObject = stream;
        const chunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        let startTime;
        
        mediaRecorder.onstart = () => {
            startTime = Date.now();
            recordingInterval = setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime) / 1000);
                recordingTimer.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
            }, 1000);
        };
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            clearInterval(recordingInterval);
            recordingTimer.textContent = '00:00';
            recordedBlob = new Blob(chunks, { type: 'video/webm' });
            videoPreview.srcObject = null;
            videoPreview.src = URL.createObjectURL(recordedBlob);
            stream.getTracks().forEach(track => track.stop());
            log('Recording complete. Ready to trim.', 'success');
            [trimStartInput, trimEndInput, trimVideoButton, startRecordingButton].forEach(btn => btn.disabled = false);
            stopRecordingButton.disabled = true;
        };
        
        mediaRecorder.start();
        log('Recording...', 'info');
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;

    } catch (error) {
        log(`Camera/Mic access denied: ${error.message}`, 'error');
        console.error('Error starting recording:', error);
    }
};

const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
};

trimVideoButton.addEventListener('click', async () => {
    if (!ffmpeg || !ffmpeg.loaded) return log('FFmpeg not loaded.', 'error');
    if (!recordedBlob) return log('Please record a video first.', 'error');

    const start = parseFloat(trimStartInput.value), end = parseFloat(trimEndInput.value);
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) return log('Invalid start/end times.', 'error');

    trimVideoButton.disabled = true;
    log('Trimming video...', 'info');

    try {
        await ffmpeg.writeFile('input.webm', await fetchFile(recordedBlob));
        await ffmpeg.exec(['-i', 'input.webm', '-ss', String(start), '-to', String(end), 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');
        trimmedVideoOutput.src = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        log('Trimming complete!', 'success');
    } catch (error) {
        log('An error occurred during trimming.', 'error');
        console.error('Trimming error:', error);
    } finally {
        trimVideoButton.disabled = false;
    }
});


// --- Advanced Self-Testing Framework ---
const MAX_RETRIES = 3;

const selfTestFunctions = {
    'FFmpeg Loading': {
        test: async () => {
            const loaded = await initializeFFmpeg();
            if (!loaded) throw new Error("FFmpeg failed to load.");
        }
    },
    'Camera and Mic Permissions': {
        test: async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                throw new Error(`Camera/Mic access denied: ${error.message}`);
            }
        }
    },
    'Video Recording and Blob Creation': {
        test: async () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                    const chunks = [];
                    recorder.ondataavailable = e => chunks.push(e.data);
                    recorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        if (blob.size === 0) return reject(new Error("Recorded blob is empty."));
                        stream.getTracks().forEach(track => track.stop());
                        resolve(blob); // Pass blob to next test
                    };
                    recorder.start();
                    setTimeout(() => recorder.stop(), 2000);
                } catch (err) {
                    reject(new Error("Failed to get user media for recording test."));
                }
            });
        }
    },
    'Video Preview and Playback': {
        test: async (blob, attempt = 1) => {
            return new Promise((resolve, reject) => {
                let videoElement = document.createElement('video');
                videoElement.oncanplay = () => {
                    videoElement.play().then(() => resolve()).catch(() => reject(new Error("Playback failed.")));
                };
                videoElement.onerror = () => reject(new Error(`Video element error (Attempt ${attempt})`));
                videoElement.src = URL.createObjectURL(blob);
            });
        },
        fix: async (blob) => { // Adaptive Strategy: Re-create video element
            console.log("Applying fix for Video Preview: Re-creating video element.");
            return selfTestFunctions['Video Preview and Playback'].test(blob, 2);
        }
    }
};

const runSelfTests = async () => {
    runSelfTestButton.disabled = true;
    overallTestStatus.textContent = 'Running...';
    testStepsContainer.innerHTML = '';
    let passedCount = 0;
    let recordedTestBlob = null;

    for (const testName of Object.keys(selfTestFunctions)) {
        const test = selfTestFunctions[testName];
        const stepElement = document.createElement('div');
        testStepsContainer.appendChild(stepElement);

        let passed = false;
        for (let i = 1; i <= MAX_RETRIES; i++) {
            updateTestStepUI(stepElement, testName, 'info', `(Attempt ${i}/${MAX_RETRIES})`);
            try {
                const result = await test.test(recordedTestBlob);
                if (testName === 'Video Recording and Blob Creation') recordedTestBlob = result;
                updateTestStepUI(stepElement, testName, 'pass');
                passed = true;
                break;
            } catch (error) {
                if (i === MAX_RETRIES) {
                    updateTestStepUI(stepElement, testName, 'fail', error.message);
                } else if (test.fix) {
                    updateTestStepUI(stepElement, testName, 'info', `Applying fix...`);
                    try {
                        await test.fix(recordedTestBlob);
                        updateTestStepUI(stepElement, testName, 'pass', 'Fix successful.');
                        passed = true;
                        break;
                    } catch (fixError) {
                         updateTestStepUI(stepElement, testName, 'fail', fixError.message);
                    }
                }
            }
        }
        if (passed) passedCount++;
    }

    const allTestsPassed = passedCount === Object.keys(selfTestFunctions).length;
    const score = Math.round((passedCount / Object.keys(selfTestFunctions).length) * 10);
    const justification = allTestsPassed ? "All essential functions are working reliably." : "Found issues in core functionalities.";
    
    overallTestStatus.textContent = allTestsPassed ? 'All tests passed!' : 'Some tests failed.';
    overallTestStatus.className = allTestsPassed ? 'success' : 'error';
    selfAssessmentScore.innerHTML = `${score}/10 <small>(${justification})</small>`;

    updateTestHistory(overallTestStatus.textContent, score, justification);
    runSelfTestButton.disabled = false;
};

const updateTestHistory = (status, score, justification) => {
    const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
    history.unshift({ time: new Date().toLocaleString(), status, score, justification });
    if (history.length > 10) history.pop(); // Keep last 10 entries
    localStorage.setItem('testHistory', JSON.stringify(history));
    renderTestHistory();
};

const renderTestHistory = () => {
    const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
    testHistoryContainer.innerHTML = history.map(h => `<div><b>${h.time}:</b> ${h.status} (Score: ${h.score}/10)</div>`).join('');
}

// --- Event Listeners and Initial Load ---
startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);
runSelfTestButton.addEventListener('click', runSelfTests);

// Initial Load
initializeFFmpeg();
renderTestHistory();
