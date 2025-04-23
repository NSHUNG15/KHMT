import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "Chưa xác định";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "Định dạng không hợp lệ";
  }
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "Chưa xác định";
  try {
    return format(new Date(date), "HH:mm - dd/MM/yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting date time:", error, date);
    return "Định dạng không hợp lệ";
  }
}

export function formatTimeOnly(date: Date | string | number | null | undefined): string {
  if (!date) return "Chưa xác định";
  try {
    return format(new Date(date), "HH:mm", { locale: vi });
  } catch (error) {
    console.error("Error formatting time:", error, date);
    return "Định dạng không hợp lệ";
  }
}

export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return "Chưa xác định";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch (error) {
    console.error("Error formatting relative time:", error, date);
    return "Định dạng không hợp lệ";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateEventImageUrl(imageUrl?: string): string {
  // Use provided image URL or fallback to a generic event image
  return imageUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644";
}

export function generateTournamentImageUrl(sportType: string, imageUrl?: string): string {
  // Use provided image URL or fallback to a sport-specific image
  if (imageUrl) return imageUrl;
  
  // Default sport images
  const sportImages: Record<string, string> = {
    "football": "https://images.unsplash.com/photo-1517466787929-bc90951d0974",
    "basketball": "https://images.unsplash.com/photo-1505666287802-931d7a78bde0",
    "volleyball": "https://images.unsplash.com/photo-1562552052-296a76df3711",
    "badminton": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
    "table tennis": "https://images.unsplash.com/photo-1534158914592-062992fbe900",
    "tennis": "https://images.unsplash.com/photo-1622279457486-28f6ead80a3a",
    "swimming": "https://images.unsplash.com/photo-1530549387789-4c1017266635",
    "chess": "https://images.unsplash.com/photo-1586165368502-1bad197a6461",
  };
  
  const lowerSportType = sportType.toLowerCase();
  
  // Find matching sport image
  for (const [sport, url] of Object.entries(sportImages)) {
    if (lowerSportType.includes(sport)) {
      return url;
    }
  }
  
  // Generic sports image fallback
  return "https://images.unsplash.com/photo-1517649763962-0c623066013b";
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateRemainingSpots(capacity: number | undefined, registered: number): string {
  if (!capacity) return "Không giới hạn";
  const remaining = capacity - registered;
  return `Còn ${remaining}/${capacity} chỗ`;
}

export function getMatchStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getBracketLines(round: number, matchNumber: number, totalRounds: number): string {
  // This helps with drawing connecting lines in a tournament bracket
  let classes = "";
  
  if (round < totalRounds) {
    if (matchNumber % 2 === 1) {
      classes += " border-r border-t";
    } else {
      classes += " border-r border-b";
    }
  }
  
  return classes;
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
