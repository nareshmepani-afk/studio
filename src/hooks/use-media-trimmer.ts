
"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getFFmpeg } from '@/lib/ffmpeg-loader';

export function useMediaTrimmer() {
  const [isTrimming, setIsTrimming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // General processing state

  const trim = useCallback(async (
    sourceFile: File,
    startTime: number,
    endTime: number
  ): Promise<File | null> => {
    if (!sourceFile || !sourceFile.name) {
      console.error("Trim function called without a valid source file.");
      return null;
    }

    setIsTrimming(true);
    setIsProcessing(true);
    try {
      const ffmpeg = await getFFmpeg();
      if (!ffmpeg) {
        throw new Error("FFmpeg not available.");
      }
      
      const inputFileName = `input.${sourceFile.name.split('.').pop()}`;
      const outputFileName = `trimmed_${inputFileName}`;

      await ffmpeg.writeFile(inputFileName, new Uint8Array(await sourceFile.arrayBuffer()));
      
      const start = formatTime(startTime);
      const duration = formatTime(endTime - startTime);

      // Execute FFmpeg command
      await ffmpeg.exec(['-i', inputFileName, '-ss', start, '-t', duration, '-c', 'copy', outputFileName]);

      const data = await ffmpeg.readFile(outputFileName) as Uint8Array;
      
      // Cleanup files in wasm memory
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      const trimmedFile = new File([data.slice()], outputFileName, { type: sourceFile.type });
      toast.success("Trimming Successful");
      return trimmedFile;

    } catch (error) {
      console.error("Error during media trimming:", error);
      toast.error("Trimming Failed", { description: "An error occurred while trimming the media." });
      return null;
    } finally {
      setIsTrimming(false);
      setIsProcessing(false);
    }
  }, []);

  return { trim, isTrimming, isProcessing };
}

const formatTime = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${seconds.toFixed(2)}`;
};

const pad = (num: number): string => num.toString().padStart(2, '0');
