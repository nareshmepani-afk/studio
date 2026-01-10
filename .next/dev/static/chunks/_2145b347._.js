(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/memory/MediaRecorder.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MediaCaptureControl",
    ()=>MediaCaptureControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript) <export default as Mic>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Video$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/video.js [app-client] (ecmascript) <export default as Video>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$stop$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__StopCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-stop.js [app-client] (ecmascript) <export default as StopCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const MAX_FILE_SIZE_MB = 100;
const MAX_RECORDING_SECONDS = 330; // 5 minutes and 30 seconds
const RECORDING_INTERVAL_MS = 1000;
// Helper to format time
const formatTime = (seconds)=>{
    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
function MediaCaptureControl({ onMediaReady, initialMedia, trimValues }) {
    _s();
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mediaStreamRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mediaRecorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const recordedChunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const recordingIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle'); // idle, recording, preview
    const [media, setMedia] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recordingType, setRecordingType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('video');
    const [recordingTime, setRecordingTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const stopRecordingAndCleanup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MediaCaptureControl.useCallback[stopRecordingAndCleanup]": ()=>{
            const testStepId = 'media-capture-ts-stop-record';
            console.log(`TESTIMONY - ${testStepId} - START`);
            console.log(`State Before: Media recorder is in state: ${mediaRecorderRef.current?.state}`);
            console.log('Action: Stopping media recording and cleaning up resources.');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach({
                    "MediaCaptureControl.useCallback[stopRecordingAndCleanup]": (track)=>track.stop()
                }["MediaCaptureControl.useCallback[stopRecordingAndCleanup]"]);
                mediaStreamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            console.log('State After: Recording stopped, streams and timers cleaned up.');
            console.log(`TESTIMONY - ${testStepId} - END`);
        }
    }["MediaCaptureControl.useCallback[stopRecordingAndCleanup]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MediaCaptureControl.useEffect": ()=>{
            // Set initial media if it exists
            if (initialMedia?.previewUrl && !media) {
                const newMedia = {
                    type: initialMedia.type || 'video',
                    url: initialMedia.previewUrl,
                    source: 'initial',
                    duration: initialMedia.duration || 0
                };
                setMedia(newMedia);
                setStatus('preview');
                onMediaReady({
                    file: new File([], "existing"),
                    type: newMedia.type,
                    duration: newMedia.duration
                });
            }
        }
    }["MediaCaptureControl.useEffect"], [
        initialMedia,
        media,
        onMediaReady
    ]);
    // Cleanup effect for streams
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MediaCaptureControl.useEffect": ()=>{
            return ({
                "MediaCaptureControl.useEffect": ()=>{
                    stopRecordingAndCleanup();
                }
            })["MediaCaptureControl.useEffect"];
        }
    }["MediaCaptureControl.useEffect"], [
        stopRecordingAndCleanup
    ]);
    // Auto-stop timer effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MediaCaptureControl.useEffect": ()=>{
            if (status === 'recording' && recordingTime >= MAX_RECORDING_SECONDS) {
                toast({
                    title: "Recording Limit Reached",
                    description: `Recording stopped automatically after ${formatTime(MAX_RECORDING_SECONDS)}.`
                });
                stopRecordingAndCleanup();
            }
        }
    }["MediaCaptureControl.useEffect"], [
        recordingTime,
        status,
        stopRecordingAndCleanup,
        toast
    ]);
    const handlePlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MediaCaptureControl.useCallback[handlePlay]": ()=>{
            const testStepId = 'media-capture-ts-play-preview';
            console.log(`TESTIMONY - ${testStepId} - START`);
            const video = videoRef.current;
            if (!video) {
                console.log('State Before: Video element not available.');
                console.log(`TESTIMONY - ${testStepId} - END`);
                return;
            }
            console.log(`State Before: Video playback paused at ${video.currentTime}. Trim values: [${trimValues[0]}, ${trimValues[1]}].`);
            console.log('Action: Playing media preview, ensuring it starts within trim boundaries.');
            if (!trimValues || trimValues[0] === 0 && trimValues[1] === media?.duration) {
                console.log('State After: No trim values, default playback initiated.');
                console.log(`TESTIMONY - ${testStepId} - END`);
                return;
            }
            if (video.currentTime < trimValues[0] || video.currentTime >= trimValues[1]) {
                video.currentTime = trimValues[0];
            }
            console.log(`State After: Video playback initiated at ${video.currentTime}.`);
            console.log(`TESTIMONY - ${testStepId} - END`);
        }
    }["MediaCaptureControl.useCallback[handlePlay]"], [
        trimValues,
        media
    ]);
    const handleTimeUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MediaCaptureControl.useCallback[handleTimeUpdate]": ()=>{
            const video = videoRef.current;
            if (!video || !trimValues || trimValues[0] === 0 && trimValues[1] === media?.duration) return;
            if (video.currentTime >= trimValues[1]) {
                video.pause();
            }
        }
    }["MediaCaptureControl.useCallback[handleTimeUpdate]"], [
        trimValues,
        media
    ]);
    const startRecording = async (type)=>{
        const testStepId = 'media-capture-ts-start-record';
        console.log(`TESTIMONY - ${testStepId} - START`);
        console.log(`State Before: Status is 'idle'. Requested recording type: ${type}.`);
        console.log('Action: User initiated recording.');
        try {
            if (media?.url && media.source === 'new') {
                URL.revokeObjectURL(media.url);
            }
            stopRecordingAndCleanup();
            setRecordingType(type);
            setStatus('recording');
            setRecordingTime(0);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            mediaStreamRef.current = stream;
            if (type === 'video' && videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error(`${mimeType} is not supported`);
            const recorder = new MediaRecorder(stream, {
                mimeType
            });
            mediaRecorderRef.current = recorder;
            recordedChunksRef.current = [];
            recorder.ondataavailable = (event)=>{
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };
            recorder.onstop = ()=>{
                const blob = new Blob(recordedChunksRef.current, {
                    type: mimeType
                });
                const url = URL.createObjectURL(blob);
                const mediaEl = document.createElement(type === 'video' ? 'video' : 'audio');
                mediaEl.src = url;
                mediaEl.onloadedmetadata = ()=>{
                    const newMediaPayload = {
                        file: new File([
                            blob
                        ], `recording.${type === 'video' ? 'webm' : 'mp3'}`),
                        type: type,
                        duration: mediaEl.duration
                    };
                    setMedia({
                        url,
                        type,
                        source: 'new',
                        duration: mediaEl.duration
                    });
                    onMediaReady(newMediaPayload);
                    setStatus('preview');
                    console.log(`State After: Recording finished. Media payload is ready for preview.`);
                };
                recordedChunksRef.current = [];
            };
            recorder.start();
            recordingIntervalRef.current = setInterval(()=>setRecordingTime((prev)=>prev + 1), RECORDING_INTERVAL_MS);
            console.log(`State After: Media stream acquired. Recorder started.`);
        } catch (err) {
            console.error("Error starting recording:", err);
            toast({
                title: "Recording Error",
                description: err.message,
                variant: "destructive"
            });
            setStatus(initialMedia ? 'preview' : 'idle');
            console.log(`State After: Error occurred. Status reset to '${initialMedia ? 'preview' : 'idle'}'.`);
        } finally{
            console.log(`TESTIMONY - ${testStepId} - END`);
        }
    };
    const handleFileUpload = (event)=>{
        const testStepId = 'media-capture-ts-upload-file';
        console.log(`TESTIMONY - ${testStepId} - START`);
        console.log('State Before: No file is selected.');
        console.log('Action: User selected a file for upload.');
        const file = event.target.files?.[0];
        if (!file) {
            console.log('State After: No file was selected. Aborting.');
            console.log(`TESTIMONY - ${testStepId} - END`);
            return;
        }
        if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast({
                title: "File too large",
                description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
                variant: "destructive"
            });
            console.log(`State After: File is too large. Upload aborted.`);
            console.log(`TESTIMONY - ${testStepId} - END`);
            return;
        }
        const url = URL.createObjectURL(file);
        const mediaEl = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
        mediaEl.src = url;
        mediaEl.onloadedmetadata = ()=>{
            const newMediaPayload = {
                file,
                type: file.type.startsWith('video') ? 'video' : 'audio',
                duration: mediaEl.duration
            };
            setMedia({
                url,
                type: newMediaPayload.type,
                source: 'new',
                duration: mediaEl.duration
            });
            onMediaReady(newMediaPayload);
            setStatus('preview');
            console.log(`State After: File uploaded and media payload is ready for preview.`);
        };
        event.target.value = '';
        console.log(`TESTIMONY - ${testStepId} - END`);
    };
    const resetToInitial = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MediaCaptureControl.useCallback[resetToInitial]": ()=>{
            const testStepId = 'media-capture-ts-discard-media';
            console.log(`TESTIMONY - ${testStepId} - START`);
            console.log('State Before: A new media clip is in the preview state.');
            console.log('Action: User clicked "Start Over" or "Cancel and Revert".');
            if (media?.url && media.source === 'new') URL.revokeObjectURL(media.url);
            if (initialMedia?.previewUrl) {
                const newMedia = {
                    type: initialMedia.type || 'video',
                    url: initialMedia.previewUrl,
                    source: 'initial',
                    duration: initialMedia.duration || 0
                };
                setMedia(newMedia);
                setStatus('preview');
                onMediaReady({
                    file: new File([], "existing"),
                    type: newMedia.type,
                    duration: newMedia.duration
                });
                console.log('State After: Reverted to the initial media.');
            } else {
                setMedia(null);
                onMediaReady(null);
                setStatus('idle');
                console.log('State After: Media discarded. Component reset to idle state.');
            }
            console.log(`TESTIMONY - ${testStepId} - END`);
        }
    }["MediaCaptureControl.useCallback[resetToInitial]"], [
        media,
        initialMedia,
        onMediaReady
    ]);
    const renderCaptureOptions = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center min-h-[200px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-muted-foreground",
                    children: "Record a new clip or upload a file."
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 258,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center space-x-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            onClick: ()=>startRecording('video'),
                            variant: "outline",
                            size: "icon",
                            className: "h-16 w-16 rounded-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Video$3e$__["Video"], {
                                className: "h-8 w-8"
                            }, void 0, false, {
                                fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                lineNumber: 261,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 260,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            onClick: ()=>startRecording('audio'),
                            variant: "outline",
                            size: "icon",
                            className: "h-16 w-16 rounded-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__["Mic"], {
                                className: "h-8 w-8"
                            }, void 0, false, {
                                fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                lineNumber: 264,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 263,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 259,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm text-muted-foreground",
                    children: "or"
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 267,
                    columnNumber: 10
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    asChild: true,
                    type: "button",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "file-upload",
                        className: "cursor-pointer",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                className: "mr-2 h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                lineNumber: 270,
                                columnNumber: 17
                            }, this),
                            " Upload File"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                        lineNumber: 269,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 268,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    id: "file-upload",
                    type: "file",
                    className: "sr-only",
                    onChange: handleFileUpload,
                    accept: "video/*,audio/*"
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 273,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
            lineNumber: 257,
            columnNumber: 5
        }, this);
    if (status === 'recording') {
        const timerDisplay = `${formatTime(recordingTime)} / ${formatTime(MAX_RECORDING_SECONDS)}`;
        const content = recordingType === 'video' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
            ref: videoRef,
            className: "w-full h-full object-cover scale-x-[-1]",
            autoPlay: true,
            muted: true,
            playsInline: true
        }, void 0, false, {
            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
            lineNumber: 280,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center h-full text-primary",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "mr-2 h-8 w-8 animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 283,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "mt-2",
                    children: "Recording Audio..."
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 284,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
            lineNumber: 282,
            columnNumber: 9
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative w-full rounded bg-black aspect-video overflow-hidden",
                    children: [
                        content,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-2 left-2 flex items-center space-x-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2 h-2 rounded-full bg-red-500 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                    lineNumber: 292,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "REC"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                    lineNumber: 293,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 291,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono z-10",
                            children: timerDisplay
                        }, void 0, false, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 295,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 289,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    type: "button",
                    onClick: stopRecordingAndCleanup,
                    variant: "destructive",
                    className: "w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$stop$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__StopCircle$3e$__["StopCircle"], {
                            className: "mr-2 h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 300,
                            columnNumber: 17
                        }, this),
                        " Stop Recording"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 299,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
            lineNumber: 288,
            columnNumber: 9
        }, this);
    }
    if (status === 'preview' && media?.url) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                        ref: videoRef,
                        src: media.url,
                        onPlay: handlePlay,
                        onTimeUpdate: handleTimeUpdate,
                        controls: true,
                        className: "w-full rounded bg-black aspect-video"
                    }, void 0, false, {
                        fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                        lineNumber: 310,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 309,
                    columnNumber: 9
                }, this),
                media.source === 'new' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    type: "button",
                    onClick: resetToInitial,
                    variant: "outline",
                    className: "w-full",
                    children: initialMedia ? 'Cancel and Revert to Original' : 'Start Over'
                }, void 0, false, {
                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                    lineNumber: 321,
                    columnNumber: 11
                }, this),
                media.source === 'initial' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative flex items-center justify-center my-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute inset-0 flex items-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-full border-t"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                        lineNumber: 329,
                                        columnNumber: 69
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                    lineNumber: 329,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "relative bg-background px-2 text-sm text-muted-foreground uppercase",
                                    children: "Or Replace Media"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                                    lineNumber: 330,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
                            lineNumber: 328,
                            columnNumber: 13
                        }, this),
                        renderCaptureOptions()
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/memory/MediaRecorder.tsx",
            lineNumber: 308,
            columnNumber: 7
        }, this);
    }
    return renderCaptureOptions();
}
_s(MediaCaptureControl, "ZGfnu8C9ZgAN1P/3kJu3yJC9QCo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = MediaCaptureControl;
var _c;
__turbopack_context__.k.register(_c, "MediaCaptureControl");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/memory/MediaRecorder.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/memory/MediaRecorder.tsx [app-client] (ecmascript)"));
}),
"[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Upload
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M12 3v12",
            key: "1x0j5s"
        }
    ],
    [
        "path",
        {
            d: "m17 8-5-5-5 5",
            key: "7q97r8"
        }
    ],
    [
        "path",
        {
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
            key: "ih7n3h"
        }
    ]
];
const Upload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("upload", __iconNode);
;
 //# sourceMappingURL=upload.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Upload",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Mic
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M12 19v3",
            key: "npa21l"
        }
    ],
    [
        "path",
        {
            d: "M19 10v2a7 7 0 0 1-14 0v-2",
            key: "1vc78b"
        }
    ],
    [
        "rect",
        {
            x: "9",
            y: "2",
            width: "6",
            height: "13",
            rx: "3",
            key: "s6n7sd"
        }
    ]
];
const Mic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("mic", __iconNode);
;
 //# sourceMappingURL=mic.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript) <export default as Mic>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Mic",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/video.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Video
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
            key: "ftymec"
        }
    ],
    [
        "rect",
        {
            x: "2",
            y: "6",
            width: "14",
            height: "12",
            rx: "2",
            key: "158x01"
        }
    ]
];
const Video = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("video", __iconNode);
;
 //# sourceMappingURL=video.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/video.js [app-client] (ecmascript) <export default as Video>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Video",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/video.js [app-client] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/circle-stop.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>CircleStop
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "rect",
        {
            x: "9",
            y: "9",
            width: "6",
            height: "6",
            rx: "1",
            key: "1ssd4o"
        }
    ]
];
const CircleStop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("circle-stop", __iconNode);
;
 //# sourceMappingURL=circle-stop.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/circle-stop.js [app-client] (ecmascript) <export default as StopCircle>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StopCircle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$stop$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$stop$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-stop.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_2145b347._.js.map