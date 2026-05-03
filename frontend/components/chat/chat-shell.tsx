"use client"

import { useState, useCallback } from "react"
import { MessageSquareDashed, FileUp, ArrowLeft } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer } from "./composer"
import { Button } from "@/components/ui/button"
import { DropZone } from "@/components/upload/DropZone"
import { useChatStore } from "@/stores/chatStore"
import { useChat } from "@/hooks/useChat"
import { AnimatedOrb } from "./animated-orb"

// Data model for messages — re-exported for compatibility with existing components
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  sources?: Array<{
    chunk_id: string
    text: string
    page: number
    score: number
  }>
}

export function ChatShell() {
  const { sessionId, filename, clearSession } = useChatStore()
  const { messages, sendMessage, isLoading, error } = useChat()
  const [isLoaded, setIsLoaded] = useState(true) // No localStorage loading needed

  // Convert store messages to the format expected by MessageList
  const formattedMessages: Message[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.timestamp,
    sources: m.sources,
  }))

  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim() || isLoading) return
      sendMessage(content)
    },
    [isLoading, sendMessage],
  )

  const retry = useCallback(() => {
    if (messages.length === 0) return
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content)
    }
  }, [messages, sendMessage])

  // State 1: No document uploaded
  if (!sessionId) {
    return (
      <div
        className="relative h-dvh bg-stone-50 flex flex-col"
        style={{
          boxShadow:
            "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="orb-intro">
            <AnimatedOrb size={80} />
          </div>
          <div className="text-center text-blur-intro">
            <h1 className="text-2xl font-bold text-stone-800">DocuMind</h1>
            <p className="text-sm text-stone-500 mt-2 max-w-md">
              Upload dokumen PDF atau DOCX, lalu tanya apa saja tentang isinya.
              AI akan menjawab berdasarkan konteks dokumen Anda.
            </p>
          </div>
          <div className="text-blur-intro-delay w-full max-w-lg">
            <DropZone />
          </div>
        </div>
      </div>
    )
  }

  // State 2: Document active — chat interface
  return (
    <div
      className="relative h-dvh bg-stone-50"
      style={{
        boxShadow:
          "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
      }}
    >
      {/* Header with filename and change document button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-stone-50/80 backdrop-blur-md border-b border-stone-100">
        <div className="flex items-center gap-3">
          <Button
            onClick={clearSession}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            aria-label="Ganti dokumen"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileUp className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-700 truncate max-w-[200px] md:max-w-[400px]">
              {filename}
            </span>
          </div>
        </div>
        <Button
          onClick={clearSession}
          variant="ghost"
          size="sm"
          className="text-xs text-stone-500 hover:text-stone-700"
        >
          <MessageSquareDashed className="w-4 h-4 mr-1" />
          Ganti Dokumen
        </Button>
      </div>

      <MessageList
        messages={formattedMessages}
        isStreaming={isLoading}
        error={error?.message || null}
        onRetry={retry}
        isLoaded={isLoaded}
      />

      <Composer
        onSend={handleSend}
        onStop={() => {}}
        isStreaming={isLoading}
        disabled={!sessionId}
      />
    </div>
  )
}
