// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAccessCode(yearDigits: string): string {
  const number = Math.floor(Math.random() * 10000); // 0 to 9999
  const padded = number.toString().padStart(4, '0');
  return `FH-${padded}-${yearDigits}`;
}

export function generateCourseStudentCode(yearDigits: string): string {
  const number = Math.floor(Math.random() * 10000); // 0 to 9999
  const padded = number.toString().padStart(4, '0');
  return `FHC-${padded}-${yearDigits}`;
}

/**
 * Check if current date is within academic year timeline
 * @param startDate - Academic year start date
 * @param endDate - Academic year end date
 * @returns true if current date is within the academic year timeline
 */
export function isWithinAcademicYearTimeline(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time components for accurate date comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return now >= start && now <= end;
}

/**
 * Check if academic year has ended
 * @param endDate - Academic year end date
 * @returns true if current date is past the end date
 */
export function hasAcademicYearEnded(endDate: Date): boolean {
  const now = new Date();
  const end = new Date(endDate);
  
  // Reset time components for accurate date comparison
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return now > end;
}

/**
 * Check if academic year has started
 * @param startDate - Academic year start date
 * @returns true if current date is on or after the start date
 */
export function hasAcademicYearStarted(startDate: Date): boolean {
  const now = new Date();
  const start = new Date(startDate);
  
  // Reset time components for accurate date comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  
  return now >= start;
}
