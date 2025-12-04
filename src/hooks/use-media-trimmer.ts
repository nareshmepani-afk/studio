
"use client";

import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { toast } from '@/hooks/use-toast';

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg;
  }
  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

export function useMediaTrimmer() {
  const [isTrimming, setIsTrimming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // General processing state

  const trim = useCallback(async (
    sourceFile: File,
    startTime: number,
    endTime: number
  ): Promise<File | null> => {
    setIsTrimming(true);
    setIsProcessing(true);
    try {
      const ffmpeg = await getFFmpeg();
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

      const trimmedFile = new File([data.buffer], outputFileName, { type: sourceFile.type });
      toast({ title: "Trimming Successful", variant: "success" });
      return trimmedFile;

    } catch (error) {
      console.error("Error during media trimming:", error);
      toast({ title: "Trimming Failed", description: "An error occurred while trimming the media.", variant: "destructive" });
      return null;
    } finally {
      setIsTrimming(false);
      setIsProcessing(false);
    }
  }, []);

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${seconds.toFixed(2)}`;
  };

  const pad = (num: number): string => num.toString().padStart(2, '0');

  return { trim, isTrimming, isProcessing };
}
