"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, FileText, ExternalLink } from "lucide-react"
import type { Source } from "@/types/api"
import dynamic from "next/dynamic"
import { useChatStore } from "@/stores/chatStore"

const PdfViewer = dynamic(() => import("./PdfViewer").then((mod) => mod.PdfViewer), {
  ssr: false,
})

interface SourceCardsProps {
  sources: Source[]
}

export function SourceCards({ sources }: SourceCardsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewerState, setViewerState] = useState<{ isOpen: boolean; source: Source | null }>({
    isOpen: false,
    source: null
  })
  
  const { sessionId } = useChatStore()

  if (!sources || sources.length === 0) return null

  // Show max 3 sources, hide rest behind toggle
  const visibleSources = isExpanded ? sources : sources.slice(0, 3)
  const hasMore = sources.length > 3

  const handleOpenViewer = (source: Source) => {
    // Only open PDF viewer for PDFs
    const filename = source.filename || ""
    if (filename.toLowerCase().endsWith(".pdf")) {
      setViewerState({ isOpen: true, source })
    }
  }

  return (
    <div className="mt-2 space-y-1.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
      >
        <FileText className="w-3 h-3" />
        <span>{sources.length} sumber referensi</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleSources.map((source, index) => (
            <SourceCard 
              key={source.chunk_id || index} 
              source={source} 
              onClick={() => handleOpenViewer(source)}
            />
          ))}
          {hasMore && !isExpanded && (
            <p className="text-xs text-stone-400">
              +{sources.length - 3} sumber lainnya
            </p>
          )}
        </div>
      )}
      
      {viewerState.source && viewerState.isOpen && sessionId && (
        <PdfViewer
          isOpen={viewerState.isOpen}
          onClose={() => setViewerState({ isOpen: false, source: null })}
          sessionId={sessionId}
          filename={viewerState.source.filename || ""}
          pageNumber={viewerState.source.page}
          highlightText={viewerState.source.text}
        />
      )}
    </div>
  )
}

function SourceCard({ source, onClick }: { source: Source, onClick: () => void }) {
  const [showFull, setShowFull] = useState(false)

  const truncatedText =
    source.text.length > 120
      ? source.text.substring(0, 120) + "..."
      : source.text

  const scorePercent = Math.round(source.score * 100)
  const isPdf = (source.filename || "").toLowerCase().endsWith(".pdf")

  return (
    <div
      onClick={(e) => {
        // Prevent click if clicking the "Tutup/Lihat selengkapnya" button
        if ((e.target as HTMLElement).tagName !== 'BUTTON' && isPdf && source.page > 0) {
          onClick()
        }
      }}
      className={cn(
        "p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs transition-colors",
        isPdf && source.page > 0 ? "cursor-pointer hover:bg-stone-100 hover:border-stone-200" : ""
      )}
      style={{
        boxShadow:
          "rgba(14, 63, 126, 0.02) 0px 0px 0px 1px, rgba(42, 51, 69, 0.02) 0px 1px 1px -0.5px",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 font-medium">
            {source.filename || "Dokumen"}
          </span>
          <span className="text-stone-400 text-[10px]">&bull;</span>
          <span className="text-stone-500 font-medium">
            {source.page > 0 ? `Hal ${source.page}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPdf && source.page > 0 && (
            <span className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5">
              <ExternalLink className="w-3 h-3" />
              Lihat PDF
            </span>
          )}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full font-mono text-[10px]",
              scorePercent >= 80
                ? "bg-green-100 text-green-700"
                : scorePercent >= 60
                  ? "bg-amber-100 text-amber-700"
                  : "bg-stone-100 text-stone-500",
            )}
          >
            {scorePercent}%
          </span>
        </div>
      </div>
      <p className="text-stone-600 font-mono leading-relaxed">
        {showFull ? source.text : truncatedText}
      </p>
      {source.text.length > 120 && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-stone-400 hover:text-stone-600 mt-1 underline underline-offset-2 transition-colors"
        >
          {showFull ? "Tutup" : "Lihat selengkapnya"}
        </button>
      )}
    </div>
  )
}
