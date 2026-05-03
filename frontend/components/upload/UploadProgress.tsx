"use client"

import { AnimatedOrb } from "@/components/chat/animated-orb"

export function UploadProgress() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 animate-in fade-in duration-500">
      <div className="relative">
        <AnimatedOrb size={64} />
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-stone-400" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-stone-700">
          Memproses dokumen...
        </p>
        <p className="text-sm text-stone-400 mt-1">
          Mengekstrak teks dan membuat indeks pencarian
        </p>
      </div>
    </div>
  )
}
