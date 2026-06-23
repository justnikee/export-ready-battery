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

/**
 * Extracts a human-readable message from an axios error that used
 * responseType: "blob". When the server returns JSON errors for blob
 * requests, axios puts a Blob in response.data. This helper reads the
 * blob as text and parses the JSON `error` field.
 */
export async function getApiErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  const apiError = toApiError(error)
  const status = apiError.response?.status

  // If response.data is a Blob (happens with responseType: "blob"),
  // read it and try to parse the JSON error.
  const data = apiError.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text) as { error?: string }
      if (parsed.error) return parsed.error
    } catch {
      // ignore parse failures
    }
  }

  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error?: string }).error
    if (err) return err
  }

  if (status === 403) {
    return "You do not have permission to perform this action."
  }

  return fallback
}
