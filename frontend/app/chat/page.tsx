import { ChatShell } from "@/components/chat/chat-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chat — DocuMind",
  description: "Upload dokumen dan tanya jawab dengan AI dalam bahasa natural",
}

export default function ChatPage() {
  return <ChatShell />
}
