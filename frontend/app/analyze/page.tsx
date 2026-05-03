"use client"

import { useAnalyze } from "@/hooks/useAnalyze"
import { LegalInput } from "@/components/legal/LegalInput"
import { RiskScore } from "@/components/legal/RiskScore"
import { ClauseList } from "@/components/legal/ClauseList"
import { AnimatedOrb } from "@/components/chat/animated-orb"
import { ArrowLeft, Scale } from "lucide-react"
import Link from "next/link"
import { ApiError } from "@/lib/api"

export default function AnalyzePage() {
  const { mutate, isPending, data, error, reset } = useAnalyze()

  const handleAnalyze = (text: string) => {
    mutate({ text, mode: "legal" })
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <AnimatedOrb size={24} />
            <span className="text-sm font-semibold text-stone-700">
              DocuMind Legal Analyzer
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="min-h-[500px]">
            <LegalInput onAnalyze={handleAnalyze} isPending={isPending} />
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Loading state */}
            {isPending && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-300">
                <AnimatedOrb size={64} />
                <div className="text-center">
                  <p className="text-base font-medium text-stone-700">
                    Menganalisis klausul...
                  </p>
                  <p className="text-sm text-stone-400 mt-1">
                    AI sedang membaca dan menilai setiap klausul
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !isPending && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-300">
                <p className="text-sm font-medium text-red-800">
                  Gagal menganalisis teks
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {error instanceof ApiError
                    ? error.message
                    : "Terjadi kesalahan. Silakan coba lagi."}
                </p>
                <button
                  onClick={() => reset()}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium underline underline-offset-2"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Results */}
            {data && !isPending && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Risk Score */}
                <RiskScore
                  score={data.risk_score}
                  bahayaCount={data.bahaya_count}
                  perhatianCount={data.perhatian_count}
                  amanCount={data.aman_count}
                />

                {/* Summary */}
                <div
                  className="p-4 bg-white rounded-2xl border border-stone-200"
                  style={{
                    boxShadow:
                      "rgba(14, 63, 126, 0.03) 0px 0px 0px 1px, rgba(42, 51, 69, 0.03) 0px 1px 1px -0.5px",
                  }}
                >
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">
                    Ringkasan
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {data.summary}
                  </p>
                </div>

                {/* Clause List */}
                <ClauseList clauses={data.clauses} />
              </div>
            )}

            {/* Empty state */}
            {!data && !isPending && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
                <Scale className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-base font-medium text-stone-500">
                  Hasil analisis akan muncul di sini
                </p>
                <p className="text-sm mt-1 text-stone-400">
                  Tempel teks hukum di kolom kiri dan klik &ldquo;Analisis&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
