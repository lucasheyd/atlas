import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names or class name objects into a single string.
 * Uses clsx for conditional logic and tailwind-merge to handle Tailwind CSS class conflicts.
 * 
 * @param inputs - Class names or conditional class objects
 * @returns A merged string of class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}