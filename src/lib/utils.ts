
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSecondsToTime(timeInSeconds: number | undefined): string {
  if (timeInSeconds === undefined || isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00.0"; // Return a more standard "zero" time

  const totalSecs = Math.max(0, Number(timeInSeconds.toFixed(1))); // Ensure non-negative

  if (totalSecs < 60) {
    return `0:${totalSecs.toFixed(1).padStart(4, '0')}`; // Pad seconds like 0:05.0
  } else {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const formattedSeconds = seconds.toFixed(1);
    return `${minutes}:${formattedSeconds.padStart(4, '0')}`;
  }
}
