/**
 * Hook for legal text analysis.
 */

"use client"

import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AnalyzeResponse } from "@/types/api"

interface AnalyzeInput {
  text: string
  mode: "legal" | "general"
}

export function useAnalyze() {
  const mutation = useMutation({
    mutationFn: async (input: AnalyzeInput) => {
      return api.post<AnalyzeResponse>("/api/analyze", input)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  }
}
