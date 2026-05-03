/**
 * Hook for chat Q&A — send questions and receive answers with sources.
 */

"use client"

import { useState, useCallback } from "react"
import { api, ApiError } from "@/lib/api"
import { useChatStore } from "@/stores/chatStore"
import type { QueryResponse, Message } from "@/types/api"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function useChat() {
  const {
    sessionId,
    messages,
    addMessage,
    updateLastAssistantMessage,
  } = useChatStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || !sessionId || isLoading) return

      setError(null)

      // Optimistic update: add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: question.trim(),
        timestamp: new Date(),
      }
      addMessage(userMessage)

      // Add placeholder assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }
      addMessage(assistantMessage)

      setIsLoading(true)

      try {
        const response = await api.post<QueryResponse>("/api/query", {
          question: question.trim(),
          session_id: sessionId,
          top_k: 5,
        })

        updateLastAssistantMessage(response.answer, response.sources)
      } catch (e) {
        // Remove the placeholder assistant message on error
        setError(e instanceof Error ? e : new Error("Unknown error"))
        updateLastAssistantMessage(
          "Maaf, terjadi kesalahan. Silakan coba lagi.",
          undefined,
        )
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, isLoading, addMessage, updateLastAssistantMessage],
  )

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    hasSession: !!sessionId,
  }
}
