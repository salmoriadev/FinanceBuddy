/**
 * This file implements Utils behavior for the frontend utility layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
