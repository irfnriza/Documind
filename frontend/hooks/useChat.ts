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
      let accumulatedContent = ""

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/query_stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
            session_id: sessionId,
            top_k: 5,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unknown error" }))
          throw new Error(err.detail || "Something went wrong")
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("Response body is empty")

        const decoder = new TextDecoder()
        let done = false
        let buffer = ""

        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            buffer += decoder.decode(value, { stream: true })
            
            // Parse SSE format: data: {...}\n\n
            const parts = buffer.split("\n\n")
            buffer = parts.pop() || "" // Keep the last incomplete part in the buffer

            for (const part of parts) {
              if (part.startsWith("data: ")) {
                const dataStr = part.slice(6)
                try {
                  const data = JSON.parse(dataStr)
                  
                  if (data.type === "chunk") {
                    accumulatedContent += data.content
                    updateLastAssistantMessage(accumulatedContent)
                  } else if (data.type === "sources") {
                    // Final update with sources
                    updateLastAssistantMessage(accumulatedContent, data.sources)
                  } else if (data.type === "done") {
                    // Stream complete
                    break
                  }
                } catch (e) {
                  console.error("Failed to parse SSE data", e, dataStr)
                }
              }
            }
          }
        }
      } catch (e) {
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
