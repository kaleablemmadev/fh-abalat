// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAccessCode(): string {
  const number = Math.floor(Math.random() * 10000); // 0 to 9999
  const padded = number.toString().padStart(4, '0');
  return `FH-${padded}`;
}

export function generateCourseStudentCode(ethYear: number): string {
  const number = Math.floor(Math.random() * 1000); // 0 to 999
  const padded = number.toString().padStart(3, '0');
  const shortYear = ethYear.toString().slice(-2);
  return `FHC-${padded}-${shortYear}`;
}
