import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const mins = Math.floor(diff / 60000);
  if (60 > mins) {
    return `${mins} mins ago`;
  }
  
  const hours = Math.floor(mins / 60);
  if (24 > hours) {
    return `${hours} hours ago`;
  }
  
  return date.toLocaleDateString();
}

export function getRelativeLink(link?: string): string | undefined {
  if (!link) return undefined;
  if (link.startsWith("http")) {
    try {
      const urlObj = new URL(link);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return link;
    }
  }
  return link;
}
