"use client"

import { useState, useMemo, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ZoomIn, ZoomOut, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  filename: string
  pageNumber: number
  highlightText?: string
}

export function PdfViewer({ isOpen, onClose, sessionId, filename, pageNumber, highlightText }: PdfViewerProps) {
  const [scale, setScale] = useState(1.2)
  const [error, setError] = useState<string | null>(null)

  const pdfUrl = useMemo(() => {
    if (!sessionId || !filename) return ""
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${sessionId}/${filename}`
  }, [sessionId, filename])

  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3))
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5))

  // Custom text renderer to highlight matching text
  const customTextRenderer = useCallback(({ str, itemIndex }: any) => {
    if (!highlightText) return str
    
    // Simple substring match (case insensitive)
    const lowerStr = str.toLowerCase()
    const lowerHighlight = highlightText.toLowerCase()
    
    // We only try to match parts of the highlight text, since PDF text layers can be fragmented
    // For simplicity, we just check if any word from the str is in the highlightText
    // A robust highlighter requires complex text layer alignment, but this gives a good heuristic
    
    if (lowerHighlight.includes(lowerStr.trim()) && str.trim().length > 4) {
      return `<mark class="bg-yellow-200/80 rounded-sm">${str}</mark>`
    }
    return str
  }, [highlightText])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-stone-100">
        <DialogHeader className="px-4 py-3 bg-white border-b border-stone-200 flex flex-row items-center justify-between shadow-sm z-10 shrink-0">
          <DialogTitle className="text-sm font-medium text-stone-700 truncate max-w-md">
            {filename} <span className="text-stone-400 font-normal ml-2">Halaman {pageNumber}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4 text-stone-600" />
            </Button>
            <span className="text-xs font-mono text-stone-500 w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4 text-stone-600" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto relative flex justify-center py-6">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">Gagal memuat dokumen PDF.</p>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          
          <Document
            file={pdfUrl}
            loading={
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Memuat dokumen asli...</p>
              </div>
            }
            error={(err) => {
              console.error("PDF load error:", err)
              setError(err.message)
              return null
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-md bg-white mb-6"
              renderAnnotationLayer={false}
              renderTextLayer={true}
              customTextRenderer={customTextRenderer}
            />
          </Document>
        </div>
      </DialogContent>
    </Dialog>
  )
}
