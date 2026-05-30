import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ApiError {
  response?: {
    data?: { error?: string };
    status?: number;
  };
}

export function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null) {
    return error as ApiError;
  }
  return {};
}
