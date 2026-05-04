/**
 * TypeScript types for all API responses.
 * Single source of truth — no inline types in components.
 */

// === Ingestion ===

export interface IngestResponse {
  session_id: string
  filename: string
  chunks: number
  status: "ready"
}

// === Query ===

export interface Source {
  chunk_id: string
  text: string
  page: number
  score: number
  filename?: string
}

export interface QueryResponse {
  answer: string
  sources: Source[]
  latency_ms: number
}

// === Legal Analysis ===

export type ClauseLevel = "BAHAYA" | "PERHATIAN" | "AMAN"

export interface Clause {
  title: string
  level: ClauseLevel
  original_text: string
  translation: string
  impact: string
}

export interface AnalyzeResponse {
  risk_score: number // 0–100
  summary: string
  clauses: Clause[]
  total_clauses: number
  bahaya_count: number
  perhatian_count: number
  aman_count: number
}

// === Chat (client-only, not from API) ===

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: Date
}
