import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractErrorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : fallback;
