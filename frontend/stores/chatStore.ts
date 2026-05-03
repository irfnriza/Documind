/**
 * Zustand store for chat session state.
 * Only stores state that needs to be shared across components.
 */

import { create } from "zustand"
import type { Message } from "@/types/api"

interface ChatStore {
  sessionId: string | null
  filename: string | null
  messages: Message[]

  setSession: (sessionId: string, filename: string) => void
  addMessage: (message: Message) => void
  updateLastAssistantMessage: (content: string, sources?: Message["sources"]) => void
  clearSession: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  filename: null,
  messages: [],

  setSession: (sessionId, filename) =>
    set({ sessionId, filename, messages: [] }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (content, sources) =>
    set((state) => {
      const messages = [...state.messages]
      const lastIdx = messages.length - 1
      if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
        messages[lastIdx] = {
          ...messages[lastIdx],
          content,
          sources,
        }
      }
      return { messages }
    }),

  clearSession: () =>
    set({ sessionId: null, filename: null, messages: [] }),
}))
