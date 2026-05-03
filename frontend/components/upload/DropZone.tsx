"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIngest } from "@/hooks/useIngest"
import { UploadProgress } from "./UploadProgress"
import { ApiError } from "@/lib/api"

export function DropZone() {
  const { mutateAsync, isPending, data, error, reset } = useIngest()
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploadState("uploading")
      try {
        await mutateAsync(file)
        setUploadState("success")
      } catch {
        setUploadState("error")
      }
    },
    [mutateAsync],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isPending,
  })

  const handleRetry = () => {
    reset()
    setUploadState("idle")
  }

  if (uploadState === "uploading" || isPending) {
    return <UploadProgress />
  }

  if (uploadState === "success" && data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-stone-800">{data.filename}</p>
          <p className="text-sm text-stone-500 mt-1">
            {data.chunks} bagian dokumen siap dianalisis
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 p-10 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-stone-400 bg-stone-100 scale-[1.02]"
            : "border-stone-200 bg-white/60 hover:border-stone-300 hover:bg-stone-50",
          "backdrop-blur-sm",
        )}
        style={{
          boxShadow:
            "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
        }}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragActive ? "bg-stone-200" : "bg-stone-100",
          )}
        >
          {isDragActive ? (
            <FileText className="w-7 h-7 text-stone-600 animate-bounce" />
          ) : (
            <Upload className="w-7 h-7 text-stone-500" />
          )}
        </div>

        <div className="text-center">
          <p className="text-base font-medium text-stone-700">
            {isDragActive
              ? "Lepaskan file di sini..."
              : "Drag & drop dokumen Anda"}
          </p>
          <p className="text-sm text-stone-400 mt-1">
            atau klik untuk memilih file
          </p>
          <p className="text-xs text-stone-400 mt-3">
            PDF atau DOCX • Maksimum 10MB
          </p>
        </div>
      </div>

      {uploadState === "error" && error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Gagal memproses dokumen
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {error instanceof ApiError ? error.message : "Terjadi kesalahan"}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="text-sm text-red-600 hover:text-red-700 font-medium underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      )}
    </div>
  )
}
