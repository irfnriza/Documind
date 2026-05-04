"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { RiskScore } from "@/components/legal/RiskScore"
import { ClauseList } from "@/components/legal/ClauseList"
import { AnimatedOrb } from "@/components/chat/animated-orb"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { api, ApiError } from "@/lib/api"
import type { AnalyzeResponse } from "@/types/api"
import { PdfExportButton } from "@/components/analyze/pdf-export-button"

export default function SharedAnalyzePage() {
  const params = useParams()
  const id = params.id as string
  
  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    
    const fetchSharedData = async () => {
      try {
        const result = await api.get<AnalyzeResponse>(`/api/analyze/share/${id}`)
        setData(result)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Gagal memuat hasil analisis")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSharedData()
  }, [id])

  return (
    <div className="min-h-dvh bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/analyze"
              className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Buat Analisis Baru</span>
            </Link>
            <div className="h-4 w-px bg-stone-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <AnimatedOrb size={20} />
              <span className="text-sm font-semibold text-stone-700">
                DocuMind Legal Analyzer
              </span>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
            Shared Result
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in duration-300">
            <AnimatedOrb size={64} />
            <p className="text-base font-medium text-stone-700">
              Memuat hasil analisis...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-8 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-2xl text-center animate-in fade-in duration-300">
            <p className="text-base font-medium text-red-800 mb-2">
              Tautan Kadaluarsa atau Tidak Valid
            </p>
            <p className="text-sm text-red-600 mb-6">
              Hasil analisis ini mungkin sudah dihapus (tautan hanya bertahan 24 jam) atau URL tidak tepat.
            </p>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Kembali ke Legal Analyzer
            </Link>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800">Laporan Analisis Kontrak</h1>
              <PdfExportButton targetId="pdf-export-shared-content" />
            </div>
            
            <div id="pdf-export-shared-content" className="space-y-6 bg-stone-50 pb-4">
              {/* Risk Score */}
              <RiskScore
                score={data.risk_score}
                bahayaCount={data.bahaya_count}
                perhatianCount={data.perhatian_count}
                amanCount={data.aman_count}
              />

              {/* Summary */}
              <div
                className="p-5 bg-white rounded-2xl border border-stone-200"
                style={{
                  boxShadow:
                    "rgba(14, 63, 126, 0.03) 0px 0px 0px 1px, rgba(42, 51, 69, 0.03) 0px 1px 1px -0.5px",
                }}
              >
                <h3 className="text-base font-semibold text-stone-800 mb-2 flex items-center gap-2">
                  Ringkasan Eksekutif
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {data.summary}
                </p>
              </div>

              {/* Clause List */}
              <div className="pt-4 border-t border-stone-200">
                <h3 className="text-lg font-semibold text-stone-800 mb-4">Detail Klausul</h3>
                <ClauseList clauses={data.clauses} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
