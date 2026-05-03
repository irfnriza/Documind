"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Scale, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sample legal text presets
const PRESETS = [
  {
    title: "Kontrak Sewa",
    text: `Pasal 5 - Denda Keterlambatan
Penyewa yang terlambat membayar uang sewa akan dikenakan denda sebesar 5% per hari dari total uang sewa bulanan. Denda ini bersifat kumulatif dan akan terus berjalan sampai seluruh tunggakan dilunasi.

Pasal 8 - Pemutusan Sepihak
Pemilik berhak memutuskan perjanjian sewa ini secara sepihak tanpa pemberitahuan terlebih dahulu apabila Penyewa dianggap telah melanggar ketentuan dalam perjanjian ini. Uang sewa yang telah dibayarkan tidak dapat dikembalikan.

Pasal 12 - Pemeliharaan
Penyewa bertanggung jawab atas seluruh biaya pemeliharaan dan perbaikan properti selama masa sewa, termasuk kerusakan yang disebabkan oleh force majeure.

Pasal 15 - Kenaikan Harga
Pemilik berhak menaikkan uang sewa setiap 6 bulan tanpa batasan persentase kenaikan.`,
  },
  {
    title: "Syarat & Ketentuan Aplikasi",
    text: `1. Penggunaan Data
Dengan menggunakan aplikasi ini, Anda menyetujui bahwa kami dapat mengumpulkan, menyimpan, dan membagikan seluruh data pribadi Anda kepada pihak ketiga tanpa pemberitahuan lebih lanjut.

2. Perubahan Ketentuan
Kami berhak mengubah syarat dan ketentuan ini kapan saja tanpa pemberitahuan. Penggunaan berkelanjutan dianggap sebagai persetujuan atas perubahan tersebut.

3. Batasan Tanggung Jawab
Kami tidak bertanggung jawab atas kerugian apapun yang timbul dari penggunaan layanan kami, termasuk kehilangan data, kerugian finansial, atau kerusakan perangkat.

4. Penyelesaian Sengketa
Segala sengketa akan diselesaikan melalui arbitrase di yurisdiksi yang kami tentukan, dengan biaya ditanggung sepenuhnya oleh pengguna.`,
  },
  {
    title: "Kontrak Kerja",
    text: `Pasal 3 - Jam Kerja
Karyawan wajib bekerja minimal 10 jam per hari, 6 hari seminggu. Lembur tidak dihitung sebagai jam kerja tambahan dan tidak mendapat kompensasi.

Pasal 7 - Non-Compete
Setelah berakhirnya hubungan kerja, Karyawan dilarang bekerja di perusahaan sejenis selama 3 tahun di seluruh wilayah Indonesia.

Pasal 10 - Cuti
Karyawan berhak atas cuti tahunan sebanyak 12 hari kerja setelah bekerja selama 12 bulan berturut-turut.

Pasal 14 - Pemutusan Hubungan Kerja
Perusahaan dapat memutuskan hubungan kerja tanpa pesangon apabila Karyawan dinilai tidak mencapai target kinerja selama 2 bulan berturut-turut.`,
  },
  {
    title: "Perjanjian Pinjaman",
    text: `Pasal 2 - Bunga
Bunga pinjaman ditetapkan sebesar 2% per bulan (24% per tahun) dan dihitung dari sisa pokok pinjaman. Bunga bersifat floating rate dan dapat berubah sewaktu-waktu sesuai kebijakan pemberi pinjaman.

Pasal 5 - Jaminan
Peminjam menyerahkan sertifikat rumah sebagai jaminan. Apabila terjadi wanprestasi, pemberi pinjaman berhak melelang jaminan tanpa melalui proses pengadilan.

Pasal 8 - Pelunasan Dipercepat
Peminjam yang melunasi lebih awal akan dikenakan penalti sebesar 10% dari sisa pokok pinjaman.

Pasal 11 - Pembayaran
Pembayaran dilakukan setiap tanggal 1. Keterlambatan lebih dari 3 hari dikenakan denda 3% per hari dari jumlah angsuran.`,
  },
]

interface LegalInputProps {
  onAnalyze: (text: string) => void
  isPending: boolean
}

export function LegalInput({ onAnalyze, isPending }: LegalInputProps) {
  const [text, setText] = useState("")
  const [activePreset, setActivePreset] = useState<number | null>(null)

  const handlePreset = (index: number) => {
    setText(PRESETS[index].text)
    setActivePreset(index)
  }

  const handleAnalyze = () => {
    if (text.trim() && !isPending) {
      onAnalyze(text.trim())
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
          <Scale className="w-5 h-5 text-stone-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-800">
            Analisis Klausul Hukum
          </h2>
          <p className="text-sm text-stone-500">
            Tempel teks kontrak atau dokumen hukum untuk dianalisis
          </p>
        </div>
      </div>

      {/* Preset tabs */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((preset, index) => (
          <button
            key={index}
            onClick={() => handlePreset(index)}
            disabled={isPending}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              activePreset === index
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              isPending && "opacity-50 cursor-not-allowed",
            )}
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative flex-1 min-h-[200px]">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActivePreset(null)
          }}
          placeholder="Tempel teks hukum di sini...&#10;&#10;Contoh: Pasal-pasal dari kontrak sewa, perjanjian kerja, syarat & ketentuan, dll."
          disabled={isPending}
          className={cn(
            "w-full h-full min-h-[200px] resize-none rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-800",
            "placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200",
          )}
          style={{
            boxShadow:
              "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px",
          }}
          maxLength={8000}
        />
        {/* Character counter */}
        <span
          className={cn(
            "absolute bottom-3 right-4 text-xs font-mono",
            text.length > 7500 ? "text-red-500" : "text-stone-400",
          )}
        >
          {text.length} / 8000
        </span>
      </div>

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={!text.trim() || isPending}
        className={cn(
          "w-full h-12 rounded-xl text-base font-medium transition-all duration-300",
          "bg-stone-900 hover:bg-stone-700 text-white",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menganalisis...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Analisis Dokumen
          </span>
        )}
      </Button>
    </div>
  )
}
