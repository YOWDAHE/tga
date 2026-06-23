import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function filenameFromPartnerUrl(input: string): string | null {
  const q = input.indexOf('?');
  const path = q === -1 ? input : input.slice(0, q);
  for (const marker of ['/landing/uploads/partners/', '/uploads/partners/']) {
    const idx = path.indexOf(marker);
    if (idx === -1) continue;
    const after = path.slice(idx + marker.length);
    const filename = after.split('/')[0];
    if (filename) return filename;
  }
  return null;
}

export function convertToApiUrl(url: string): string {
  if (!url) return '/office/placeholder.jpg';

  if (url.startsWith('/office/')) return url;

  const partnerFile = filenameFromPartnerUrl(url);
  if (partnerFile) {
    return `/office/api/uploads/partners/${partnerFile}`;
  }

  if (url.startsWith('/')) return url;

  if (url.includes('localhost:3000/uploads/')) {
    const urlObj = new URL(url);
    return `/api${urlObj.pathname}`;
  }

  return url;
}
