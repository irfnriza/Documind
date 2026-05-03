"use client"

import type { Clause } from "@/types/api"
import { ClauseCard } from "./ClauseCard"

interface ClauseListProps {
  clauses: Clause[]
}

// Sort order: BAHAYA first, then PERHATIAN, then AMAN
const LEVEL_ORDER: Record<string, number> = {
  BAHAYA: 0,
  PERHATIAN: 1,
  AMAN: 2,
}

export function ClauseList({ clauses }: ClauseListProps) {
  const sorted = [...clauses].sort(
    (a, b) =>
      (LEVEL_ORDER[a.level] ?? 1) - (LEVEL_ORDER[b.level] ?? 1),
  )

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-700">
        Klausul Teridentifikasi ({clauses.length})
      </h3>
      {sorted.map((clause, index) => (
        <ClauseCard
          key={`${clause.title}-${index}`}
          clause={clause}
          index={index}
        />
      ))}
    </div>
  )
}
