"use client"

import Link from "next/link"
import { FileText, Scale, ArrowRight, Shield, Zap, Brain } from "lucide-react"
import { AnimatedOrb } from "@/components/chat/animated-orb"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <div className="min-h-dvh bg-stone-50 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Animated Orb */}
        <div className="orb-intro mb-8">
          <AnimatedOrb size={96} />
        </div>

        {/* Title */}
        <h1 className="text-blur-intro text-4xl md:text-5xl font-bold text-stone-800 text-center tracking-tight">
          DocuMind
        </h1>
        <p className="text-blur-intro-delay text-lg text-stone-500 mt-3 text-center max-w-xl leading-relaxed">
          Platform AI untuk menganalisis dokumen dan klausul hukum secara otomatis.
          Upload dokumen atau tempel teks kontrak — AI akan membantu Anda memahaminya.
        </p>

        {/* CTA Cards */}
        <div className="text-blur-intro-delay mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Chat CTA */}
          <Link href="/chat" className="group">
            <div
              className={cn(
                "p-6 rounded-2xl bg-white border border-stone-200 transition-all duration-300",
                "hover:border-stone-300 hover:shadow-lg hover:-translate-y-1",
                "cursor-pointer",
              )}
              style={{
                boxShadow:
                  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px",
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                    Chat dengan Dokumen
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Upload PDF atau DOCX, lalu tanya apa saja tentang isinya dalam bahasa natural.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Legal Analyzer CTA */}
          <Link href="/analyze" className="group">
            <div
              className={cn(
                "p-6 rounded-2xl bg-white border border-stone-200 transition-all duration-300",
                "hover:border-stone-300 hover:shadow-lg hover:-translate-y-1",
                "cursor-pointer",
              )}
              style={{
                boxShadow:
                  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px",
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Scale className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                    Analisis Kontrak Hukum
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Tempel teks kontrak — AI akan sorot klausul berbahaya dan jelaskan dalam bahasa sederhana.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700">Privasi Terjamin</h3>
            <p className="text-xs text-stone-500">
              Dokumen diproses di memory, tidak tersimpan di server
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700">Analisis Cepat</h3>
            <p className="text-xs text-stone-500">
              Didukung Gemini AI untuk respons akurat dan cepat
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-stone-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700">Bahasa Indonesia</h3>
            <p className="text-xs text-stone-500">
              Jawaban dan analisis dalam bahasa yang mudah dipahami
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-stone-400">
          DocuMind • AI Document Intelligence • Powered by Gemini
        </p>
      </footer>
    </div>
  )
}
