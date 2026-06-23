import { useMutation } from "@tanstack/react-query"
import api from "@/lib/api"

export interface BatchValidationError {
  field: string
  message: string
}

export interface BatchValidationResult {
  valid: boolean
  errors?: BatchValidationError[]
}

export function useBatchValidation() {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await api.post("/batches/validate", payload)
      return response.data as BatchValidationResult
    },
  })
}
