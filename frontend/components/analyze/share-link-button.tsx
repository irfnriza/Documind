"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Loader2, Check } from "lucide-react"
import { api } from "@/lib/api"
import type { AnalyzeResponse } from "@/types/api"

interface ShareLinkButtonProps {
  data: AnalyzeResponse
}

export function ShareLinkButton({ data }: ShareLinkButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const response = await api.post<{ share_id: string }>("/api/analyze/share", {
        analysis_data: data
      })
      
      const shareUrl = `${window.location.origin}/analyze/result/${response.share_id}`
      await navigator.clipboard.writeText(shareUrl)
      
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error("Failed to share analysis:", error)
      alert("Gagal membuat link. Silakan coba lagi.")
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant="outline"
      size="sm"
      className="text-stone-600 bg-white border-stone-200 hover:bg-stone-50"
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : copied ? (
        <Check className="w-4 h-4 mr-2 text-green-600" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      )}
      {copied ? "Link Disalin!" : "Bagikan Tautan"}
    </Button>
  )
}
