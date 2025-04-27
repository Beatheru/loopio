import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats seconds into a string in the format of HH:MM:SS.
 * @param input Seconds.
 * @returns The formatted time string in the format of HH:MM:SS.
 */
export function formatSeconds(input: number) {
  const hours = Math.floor(input / 3600);
  input = input % 3600;
  const minutes = Math.floor(input / 60);
  const [seconds, secondDecimals] = String(Number(input % 60).toFixed(2)).split(
    ".",
  );

  return `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${secondDecimals}`;
}

export function isValidYoutubeVideoID(videoId: string) {
  return /^[\w\-]{11}$/.test(videoId);
}
