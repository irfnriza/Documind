"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react"
import type { Clause, ClauseLevel } from "@/types/api"

interface ClauseCardProps {
  clause: Clause
  index: number
}

const LEVEL_CONFIG: Record<
  ClauseLevel,
  {
    borderColor: string
    bgColor: string
    textColor: string
    badgeBg: string
    badgeText: string
    icon: typeof ShieldAlert
  }
> = {
  BAHAYA: {
    borderColor: "border-l-red-500",
    bgColor: "hover:bg-red-50/50",
    textColor: "text-red-700",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    icon: ShieldAlert,
  },
  PERHATIAN: {
    borderColor: "border-l-amber-500",
    bgColor: "hover:bg-amber-50/50",
    textColor: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    icon: AlertTriangle,
  },
  AMAN: {
    borderColor: "border-l-green-500",
    bgColor: "hover:bg-green-50/50",
    textColor: "text-green-700",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    icon: ShieldCheck,
  },
}

export function ClauseCard({ clause, index }: ClauseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = LEVEL_CONFIG[clause.level] || LEVEL_CONFIG.PERHATIAN
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 border-l-4 overflow-hidden transition-all duration-200",
        config.borderColor,
        config.bgColor,
        "animate-in fade-in slide-in-from-bottom-2",
      )}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "backwards",
        boxShadow:
          "rgba(14, 63, 126, 0.03) 0px 0px 0px 1px, rgba(42, 51, 69, 0.03) 0px 1px 1px -0.5px",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={cn("w-4 h-4 shrink-0", config.textColor)} />
          <span className="text-sm font-medium text-stone-800 truncate">
            {clause.title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              config.badgeBg,
              config.badgeText,
            )}
          >
            {clause.level}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-stone-400 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
          {/* Original text */}
          <div>
            <p className="text-xs text-stone-500 mb-1 font-medium">
              Teks Asli:
            </p>
            <p className="text-sm text-stone-500 italic leading-relaxed bg-stone-100/50 p-3 rounded-lg">
              &ldquo;{clause.original_text}&rdquo;
            </p>
          </div>

          {/* Translation */}
          <div>
            <p className="text-xs text-stone-500 mb-1 font-medium">
              Artinya:
            </p>
            <p className="text-sm text-stone-800 font-medium leading-relaxed">
              {clause.translation}
            </p>
          </div>

          {/* Impact */}
          <div
            className={cn(
              "p-3 rounded-lg text-sm leading-relaxed",
              clause.level === "BAHAYA" && "bg-red-50 text-red-800",
              clause.level === "PERHATIAN" && "bg-amber-50 text-amber-800",
              clause.level === "AMAN" && "bg-green-50 text-green-800",
            )}
          >
            <p className="text-xs font-semibold mb-1 opacity-70">
              💡 Dampak:
            </p>
            {clause.impact}
          </div>
        </div>
      )}
    </div>
  )
}
