
import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export function useFfmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      await ffmpeg.load();
      setIsLoaded(true);
    };
    loadFfmpeg();
  }, []);

  const runCommand = async (command: string[]) => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.exec(command);
  };

  const trimVideo = async (file: File, startTime: number, endTime: number) => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.webm', await fetchFile(file));
    const command = [
      '-i',
      'input.webm',
      '-ss',
      `${startTime}`,
      '-to',
      `${endTime}`,
      '-c',
      'copy',
      'output.webm'
    ];
    await runCommand(command);
    const data = await ffmpeg.readFile('output.webm');
    return new Blob([data], { type: 'video/webm' });
  };

  return { isLoaded, progress, runCommand, trimVideo };
}
