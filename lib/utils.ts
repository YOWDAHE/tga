import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend file paths and the admin proxy folder that serves each
// (the proxy keeps images same-origin, which the backend's CORP header requires)
const PROXIED_UPLOADS: [marker: string, folder: string][] = [
  ['/landing/uploads/partners/', 'partners'],
  ['/uploads/partners/', 'partners'],
  ['/landing/uploads/landing/', 'landing'],
  ['/landing/uploads/home/', 'home'],
  ['/news/images/', 'news-images'],
  ['/uploads/news-images/', 'news-images'],
  ['/uploads/documents/', 'documents'],
];

export function convertToApiUrl(url: string | { secure_url?: string } | null | undefined): string {
  if (url && typeof url === 'object') return convertToApiUrl(url.secure_url);
  if (!url) return '/office/placeholder.jpg';

  if (url.startsWith('/office/')) return url;

  const path = url.split('?')[0];
  for (const [marker, folder] of PROXIED_UPLOADS) {
    const idx = path.indexOf(marker);
    if (idx === -1) continue;
    const filename = path.slice(idx + marker.length).split('/')[0];
    if (filename) return `/office/api/uploads/${folder}/${filename}`;
  }

  if (url.startsWith('/')) return url;

  return url;
}
