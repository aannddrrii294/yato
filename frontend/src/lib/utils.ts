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
  if (mins < 60) {
    return `${mins} mins ago`;
  }
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }
  
  return date.toLocaleDateString();
}
