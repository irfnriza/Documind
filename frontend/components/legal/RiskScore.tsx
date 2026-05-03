"use client"

import { cn } from "@/lib/utils"
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react"

interface RiskScoreProps {
  score: number
  bahayaCount: number
  perhatianCount: number
  amanCount: number
}

export function RiskScore({
  score,
  bahayaCount,
  perhatianCount,
  amanCount,
}: RiskScoreProps) {
  const getRiskConfig = () => {
    if (score >= 70) {
      return {
        label: "Risiko Tinggi",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        ringColor: "stroke-red-500",
        trackColor: "stroke-red-100",
        icon: ShieldAlert,
        iconColor: "text-red-500",
      }
    }
    if (score >= 40) {
      return {
        label: "Perlu Hati-hati",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        ringColor: "stroke-amber-500",
        trackColor: "stroke-amber-100",
        icon: AlertTriangle,
        iconColor: "text-amber-500",
      }
    }
    return {
      label: "Relatif Aman",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      ringColor: "stroke-green-500",
      trackColor: "stroke-green-100",
      icon: ShieldCheck,
      iconColor: "text-green-500",
    }
  }

  const config = getRiskConfig()
  const Icon = config.icon

  // SVG circle gauge
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border animate-in fade-in duration-500",
        config.bgColor,
        config.borderColor,
      )}
      style={{
        boxShadow:
          "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px",
      }}
    >
      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="8"
              className={config.trackColor}
            />
            {/* Progress */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(config.ringColor, "transition-all duration-1000 ease-out")}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-bold tabular-nums", config.color)}>
              {score}
            </span>
            <span className="text-xs text-stone-500 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Label */}
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.iconColor)} />
          <span className={cn("text-base font-semibold", config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Clause counts */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-stone-200/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-stone-600">
            <span className="font-semibold">{bahayaCount}</span> Bahaya
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-xs text-stone-600">
            <span className="font-semibold">{perhatianCount}</span> Perhatian
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-stone-600">
            <span className="font-semibold">{amanCount}</span> Aman
          </span>
        </div>
      </div>
    </div>
  )
}
