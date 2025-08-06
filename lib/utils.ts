import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToApiUrl(url: string): string {
  if (!url) return '/office/placeholder.jpg';

  // If it's already a relative URL, return as is
  if (url.startsWith('/')) return url;

  // If it's a localhost upload URL, convert to use our API route
  if (url.includes('localhost:3000/uploads/')) {
    const urlObj = new URL(url);
    console.log('urlObj:', `/api${urlObj.pathname}`);
    return `/api${urlObj.pathname}`;
  }

  // For external URLs, return as is
  return url;
}
