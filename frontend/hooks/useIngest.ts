/**
 * Hook for document ingestion — upload file and get session_id.
 */

"use client"

import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useChatStore } from "@/stores/chatStore"
import type { IngestResponse } from "@/types/api"

export function useIngest() {
  const setSession = useChatStore((s) => s.setSession)

  const mutation = useMutation({
    mutationFn: async (input: File[] | File | string) => {
      const form = new FormData()

      if (Array.isArray(input)) {
        input.forEach(file => form.append("files", file))
      } else if (input instanceof File) {
        form.append("files", input)
      } else {
        form.append("url", input)
      }

      return api.postForm<IngestResponse>("/api/ingest", form)
    },
    onSuccess: (data) => {
      setSession(data.session_id, data.filename)
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
