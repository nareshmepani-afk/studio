"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useEffect, useRef, useState } from "react";

const VideoEditorPage = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [testVideoBlob, setTestVideoBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [status, setStatus] = useState("Initializing...");
  const [trimmedVideoURL, setTrimmedVideoURL] = useState(null);

  const videoPreviewRef = useRef(null);
  const trimmedVideoOutputRef = useRef(null);
  const trimStartInputRef = useRef(null);
  const trimEndInputRef = useRef(null);

  const log = (message, type = "info") => {
    setStatus(message);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    const initializeFFmpeg = async () => {
      if (ffmpeg && ffmpeg.loaded) {
        log("FFmpeg is already loaded.", "success");
        return;
      }

      log("Initializing FFmpeg with working single-threaded core...", "info");

      try {
        const ffmpegInstance = new FFmpeg({
          log: true,
          progress: ({ ratio }) => {
            if (ratio >= 0) {
              log(`Loading progress: ${Math.round(ratio * 100)}%`, "info");
            }
          },
        });

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        const coreURL = await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        );
        const wasmURL = await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        );
        await ffmpegInstance.load({ coreURL, wasmURL });
        setFfmpeg(ffmpegInstance);

        log("✓ Single-threaded FFmpeg loaded successfully!", "success");
      } catch (e) {
        console.error("All FFmpeg initialization methods failed:", e);
        log(`✗ All initialization methods failed: ${e.message}`, "error");
      }
    };
    initializeFFmpeg();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      videoPreviewRef.current.srcObject = stream;
      let chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setTestVideoBlob(blob);
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.src = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        log("Recording stopped. Video ready for trimming.", "success");
      };
      recorder.start();
      setMediaRecorder(recorder);
      log("Recording started...", "info");
    } catch (e) {
      log(`Could not access camera/microphone: ${e.message}`, "error");
      console.error("Error starting recording:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const trimVideo = async () => {
    if (!ffmpeg || !ffmpeg.loaded) {
      log("Error: FFmpeg is not loaded.", "error");
      return;
    }
    if (!testVideoBlob) {
      log("Error: No video has been recorded.", "error");
      return;
    }

    const start = parseFloat(trimStartInputRef.current.value);
    const end = parseFloat(trimEndInputRef.current.value);
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
      log("Error: Invalid trim times. Start must be >= 0, end > start.", "error");
      return;
    }

    const inputFileName = "input.webm";
    const outputFileName = "output.mp4";

    try {
      log("Trimming video...", "info");

      await ffmpeg.writeFile(inputFileName, await fetchFile(testVideoBlob));
      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-ss",
        start.toString(),
        "-to",
        end.toString(),
        "-c",
        "copy",
        outputFileName,
      ]);
      const data = await ffmpeg.readFile(outputFileName);
      const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });
      setTrimmedVideoURL(URL.createObjectURL(trimmedBlob));

      log("✓ Trimming complete!", "success");
    } catch (e) {
      log(`✗ Error during trimming: ${e.message}`, "error");
      console.error("Error during trimming:", e);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Client-Side Video Editor</h1>
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold">Video Preview</h2>
        <video
          ref={videoPreviewRef}
          width="640"
          height="480"
          controls
          autoPlay
          muted
          playsInline
          className="border"
        ></video>
        <p>{status}</p>
      </div>
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold">Recording Controls</h2>
        <button
          onClick={startRecording}
          disabled={!ffmpeg}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!mediaRecorder}
          className="ml-2 px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Recording
        </button>
      </div>
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold">Trimming Controls</h2>
        <div>
          <label htmlFor="trim-start">Start Time (seconds):</label>
          <input
            ref={trimStartInputRef}
            type="number"
            id="trim-start"
            defaultValue="0"
            min="0"
            className="border p-1"
          />
        </div>
        <div>
          <label htmlFor="trim-end">End Time (seconds):</label>
          <input
            ref={trimEndInputRef}
            type="number"
            id="trim-end"
            defaultValue="2"
            min="0"
            className="border p-1"
          />
        </div>
        <button
          onClick={trimVideo}
          disabled={!testVideoBlob || !ffmpeg}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          Trim Video
        </button>
      </div>
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold">Trimmed Video Output</h2>
        {trimmedVideoURL && (
          <video
            ref={trimmedVideoOutputRef}
            src={trimmedVideoURL}
            width="640"
            height="480"
            controls
            playsInline
            className="border"
          ></video>
        )}
      </div>
    </div>
  );
};

export default VideoEditorPage;
