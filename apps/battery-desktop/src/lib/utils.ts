import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared API error type used across dashboard pages.
export interface ApiError {
  response?: {
    data?: {
      error?: string
    }
    status?: number
  }
}

// Casts an unknown catch-block value to ApiError so callers can safely
// read response.data.error without repeated type guards everywhere.
export function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null) {
    return error as ApiError
  }
  return {}
}
