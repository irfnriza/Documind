"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface PdfExportButtonProps {
  targetId: string
  filename?: string
}

export function PdfExportButton({ targetId, filename = "documind-analysis.pdf" }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    const targetElement = document.getElementById(targetId)
    if (!targetElement) return

    setIsExporting(true)
    try {
      // Small delay to ensure all animations are done
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })

      const imgData = canvas.toDataURL("image/jpeg", 1.0)
      const pdf = new jsPDF("p", "mm", "a4")
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } catch (error) {
      console.error("Failed to export PDF:", error)
      alert("Gagal mengekspor PDF. Silakan coba lagi.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="text-stone-600 bg-white border-stone-200 hover:bg-stone-50"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Download Laporan
    </Button>
  )
}
