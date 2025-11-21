import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sanitize postal/ZIP codes to contain digits only and at most 4 characters.
// This is used across address forms to enforce numeric-only, 4-digit max input.
export function sanitizePostalCode(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(/\D/g, "").slice(0, 4)
}
