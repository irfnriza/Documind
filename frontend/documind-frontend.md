# DocuMind — Frontend Documentation
> Pedoman teknis untuk AI agent. Dokumen ini mencakup arsitektur, stack, struktur folder, komponen, state management, API integration, dan aturan implementasi frontend DocuMind.

---

## 1. Konteks Project

Frontend DocuMind adalah aplikasi Next.js yang berjalan di Vercel. Terdiri dari dua fungsionalitas utama:
1. **Chat interface** — user upload dokumen, lalu tanya-jawab dalam bahasa natural dengan sumber referensi
2. **Legal Analyzer** — user tempel teks hukum, AI sorot klausul berbahaya dan terjemahkan

### Prinsip Frontend

- Frontend **tidak menyimpan state permanen** — saat tab ditutup atau refresh, session hilang
- Frontend **tidak memanggil OpenAI** secara langsung — semua AI logic ada di backend
- Satu-satunya komunikasi eksternal adalah ke backend FastAPI melalui REST API
- Tidak ada fitur auth, login, atau user account

**Yang sengaja tidak ada di versi ini:**
- ~~Monitoring dashboard~~ — direncanakan untuk dashboard AI terpusat di masa depan
- ~~RAGAS score display~~ — mengikuti backend, belum diimplementasikan

---

## 2. Tech Stack

| Komponen | Teknologi | Versi |
|---|---|---|
| Framework | Next.js (App Router) | >= 14 |
| Language | TypeScript | >= 5 |
| Styling | Tailwind CSS | >= 3 |
| Server state | TanStack Query (React Query) | >= 5 |
| Client state | Zustand | >= 4 |
| File upload | react-dropzone | latest |
| HTTP client | native `fetch` (wrapped di `lib/api.ts`) | — |
| Form | react-hook-form + zod | latest |
| Icons | lucide-react | latest |
| Hosting | Vercel | — |

---

## 3. Struktur Folder

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout: font, providers, metadata
│   │   ├── page.tsx                  # Landing page / redirect ke /chat
│   │   ├── chat/
│   │   │   └── page.tsx              # Halaman utama chat + upload
│   │   └── analyze/
│   │       └── page.tsx              # Legal analyzer (standalone)
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx        # Container percakapan, scroll otomatis
│   │   │   ├── MessageBubble.tsx     # Single message (user / assistant)
│   │   │   ├── MessageInput.tsx      # Input teks + tombol kirim
│   │   │   └── SourceCards.tsx       # Tampilkan chunk sumber dari RAG
│   │   │
│   │   ├── upload/
│   │   │   ├── DropZone.tsx          # Drag & drop file uploader
│   │   │   └── UploadProgress.tsx    # Progress / status saat ingest
│   │   │
│   │   ├── legal/
│   │   │   ├── LegalInput.tsx        # Textarea + tombol analisis + contoh siap pakai
│   │   │   ├── RiskScore.tsx         # Skor risiko 0–100 dengan warna
│   │   │   ├── ClauseCard.tsx        # Kartu per klausul (BAHAYA / PERHATIAN / AMAN)
│   │   │   └── ClauseList.tsx        # Container list ClauseCard
│   │   │
│   │   └── ui/                       # Komponen generik reusable
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Spinner.tsx
│   │       ├── ErrorBanner.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── hooks/
│   │   ├── useChat.ts                # Logic kirim pesan, kelola message history
│   │   ├── useIngest.ts              # Upload dokumen, dapat session_id
│   │   └── useAnalyze.ts             # Panggil /api/analyze, kelola hasil
│   │
│   ├── lib/
│   │   ├── api.ts                    # Fetch wrapper: base URL, error handling
│   │   ├── queryClient.ts            # TanStack Query client config
│   │   └── utils.ts                  # Helper: cn(), formatDate(), truncate()
│   │
│   ├── stores/
│   │   └── chatStore.ts              # Zustand: session_id aktif, message history
│   │
│   └── types/
│       ├── api.ts                    # TypeScript types semua API response
│       └── index.ts                  # Re-export semua types
│
├── public/
│   └── logo.svg
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

### Aturan Struktur
- Komponen di `components/ui/` tidak boleh punya dependencies ke API atau state management.
- Komponen di `components/chat/`, `components/legal/` tidak boleh memanggil `fetch` langsung — semua API call melalui hooks di `hooks/`.
- Halaman (`app/**/page.tsx`) hanya compose komponen dan hooks — tidak ada business logic.
- Semua TypeScript types untuk API ada di `types/api.ts` — tidak ada type inline di komponen.

---

## 4. Environment Variables

```env
# .env.local.example

# URL backend FastAPI — satu-satunya env var yang dibutuhkan
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (set di Vercel dashboard):
# NEXT_PUBLIC_API_URL=https://api.documind.railway.app
```

Tidak ada API key di frontend. Semua secret ada di backend.

---

## 5. API Integration

### 5.1 Fetch Wrapper (`lib/api.ts`)

Semua HTTP call harus menggunakan wrapper ini:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new ApiError(res.status, err.detail)
  }
  return res.json()
}

export const api = {
  get:  <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, {
      method: "POST",
      body: form,
      headers: {},  // biarkan browser set Content-Type multipart/form-data
    }),
}
```

### 5.2 TypeScript Types (`types/api.ts`)

```typescript
// Ingestion
export interface IngestResponse {
  session_id: string
  filename: string
  chunks: number
  status: "ready"
}

// Query
export interface Source {
  chunk_id: string
  text: string
  page: number
  score: number
}

export interface QueryResponse {
  answer: string
  sources: Source[]
  latency_ms: number
}

// Legal Analysis
export type ClauseLevel = "BAHAYA" | "PERHATIAN" | "AMAN"

export interface Clause {
  title: string
  level: ClauseLevel
  original_text: string
  translation: string
  impact: string
}

export interface AnalyzeResponse {
  risk_score: number          // 0–100
  summary: string
  clauses: Clause[]
  total_clauses: number
  bahaya_count: number
  perhatian_count: number
  aman_count: number
}

// Chat (client-only, tidak dari API)
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: Date
}
```

---

## 6. Custom Hooks

### 6.1 `useIngest` (`hooks/useIngest.ts`)

Mengelola upload dokumen dan mendapatkan `session_id`.

```typescript
export function useIngest() {
  // TanStack Query mutation
  // Input: File | string (URL)
  // Proses:
  //   1. Buat FormData dengan file atau url
  //   2. POST /api/ingest via api.postForm()
  //   3. Simpan session_id ke chatStore
  // Return: { mutate, isPending, data: IngestResponse | undefined, error }
}
```

### 6.2 `useChat` (`hooks/useChat.ts`)

Mengelola percakapan dalam session aktif.

```typescript
export function useChat() {
  // Ambil session_id dari chatStore
  // Fungsi sendMessage(question: string):
  //   1. Tambah message user ke state (optimistic update)
  //   2. POST /api/query dengan { question, session_id, top_k: 5 }
  //   3. Append response assistant ke state dengan sources
  //   4. Error: hapus optimistic message, tampilkan error
  // Return: { messages, sendMessage, isLoading, error, hasSession }
}
```

### 6.3 `useAnalyze` (`hooks/useAnalyze.ts`)

Mengelola legal text analysis.

```typescript
export function useAnalyze() {
  // TanStack Query mutation
  // Input: { text: string, mode: "legal" | "general" }
  // POST /api/analyze
  // Return: { mutate, isPending, data: AnalyzeResponse | undefined, error, reset }
}
```

---

## 7. State Management (Zustand)

```typescript
// stores/chatStore.ts

interface ChatStore {
  sessionId: string | null        // session_id dari backend setelah ingest
  filename: string | null         // nama file yang diupload
  messages: Message[]             // history percakapan saat ini

  setSession: (sessionId: string, filename: string) => void
  addMessage: (message: Message) => void
  clearSession: () => void        // hapus session + messages, kembali ke state awal
}
```

**Aturan Zustand**:
- Store hanya menyimpan state yang perlu di-share antar komponen.
- State lokal satu komponen cukup `useState`.
- Tidak ada async logic di dalam store — async di hooks, hasilnya di-set ke store.
- `clearSession()` dipanggil saat user klik "Upload dokumen baru" — reset semua state.

---

## 8. Halaman dan Routing

### `/` — Landing Page (`app/page.tsx`)
Hero section singkat dengan deskripsi DocuMind + dua tombol CTA:
- "Mulai Chat dengan Dokumen" → `/chat`
- "Analisis Kontrak Hukum" → `/analyze`

### `/chat` — Chat Page (`app/chat/page.tsx`)

**Dua state utama:**

**State 1 — Belum ada dokumen** (`sessionId === null`):
- Tampilkan `DropZone` di tengah halaman
- Instruksi singkat cara pakai
- Setelah upload sukses → transisi ke State 2

**State 2 — Dokumen aktif** (`sessionId` tersedia):
- Layout: header (nama file + tombol "Ganti dokumen"), area chat (`ChatWindow`), input bawah (`MessageInput`)
- Tombol "Ganti dokumen" memanggil `clearSession()` dan kembali ke State 1

### `/analyze` — Legal Analyzer (`app/analyze/page.tsx`)
Layout dua kolom di desktop, stack vertikal di mobile:
- Kiri: `LegalInput` dengan contoh siap pakai
- Kanan: hasil analisis (`RiskScore` + `ClauseList`), muncul setelah analisis selesai
- Tidak ada state yang disimpan — analisis baru menggantikan hasil sebelumnya

---

## 9. Komponen Detail

### `DropZone`
- Terima: `.pdf`, `.docx` (maksimum 10MB)
- States: `idle` → `drag-over` → `uploading` → `success` / `error`
- Saat `uploading`: tampilkan `UploadProgress` dengan teks "Memproses dokumen..."
- Saat `success`: tampilkan nama file + jumlah chunk, lalu auto-transisi ke chat state
- Saat `error`: tampilkan pesan dari `ApiError.message` + tombol retry

### `ChatWindow`
- Render daftar `MessageBubble` dari `messages` di store
- Auto-scroll ke bawah setiap ada message baru (`useEffect` + `scrollIntoView`)
- Tampilkan `Spinner` saat `isLoading`
- Jika `messages` kosong: tampilkan `EmptyState` dengan contoh pertanyaan yang bisa diajukan

### `MessageBubble`
- `role === "user"`: bubble kanan, background aksen
- `role === "assistant"`: bubble kiri, background netral + render `SourceCards` di bawah jika ada `sources`
- Timestamp ditampilkan kecil di bawah bubble

### `SourceCards`
- Tampilkan maksimum 3 kartu sumber (jika lebih dari 3, sembunyikan sisanya)
- Tiap kartu: halaman dokumen, skor similarity (0–1), teks chunk (truncated 120 karakter)
- Toggle "Lihat selengkapnya" untuk expand teks penuh
- Collapsed by default agar tidak memenuhi layar

### `MessageInput`
- Textarea (bukan input) agar bisa multi-line
- Submit dengan Enter (Shift+Enter untuk newline baru)
- Disabled saat `isLoading` atau `hasSession === false`
- Clear otomatis setelah submit

### `RiskScore`
- Angka besar di tengah (0–100)
- Warna: >= 70 merah, >= 40 kuning, < 40 hijau
- Label teks: "Risiko Tinggi" / "Perlu Hati-hati" / "Relatif Aman"
- Tiga angka kecil di bawah: jumlah klausul BAHAYA / PERHATIAN / AMAN

### `ClauseCard`
- Border kiri berwarna: merah (BAHAYA), kuning (PERHATIAN), hijau (AMAN)
- Badge level di pojok kanan atas
- Collapsed by default, expand saat diklik
- Saat expand tampilkan: teks asli (italic, abu-abu), terjemahan (tebal), dampak (colored background)
- Klausul BAHAYA ditampilkan pertama, lalu PERHATIAN, lalu AMAN

### `LegalInput`
- Textarea besar untuk tempel teks hukum
- Tab "Contoh siap pakai" dengan 4 preset: kontrak sewa, T&C aplikasi, kontrak kerja, perjanjian pinjaman
- Karakter counter (0 / 8000)
- Tombol "Analisis" disabled jika textarea kosong atau `isPending`

---

## 10. Styling Convention (Tailwind)

- **Tidak ada inline `style`** — semua Tailwind utility class.
- **Tidak ada custom CSS** kecuali `globals.css` untuk Tailwind base dan font import.
- **Color palette**:
  - Primary action: `bg-neutral-900 text-white hover:bg-neutral-700`
  - BAHAYA: `text-red-700 bg-red-50 border-red-300`
  - PERHATIAN: `text-amber-700 bg-amber-50 border-amber-300`
  - AMAN: `text-green-700 bg-green-50 border-green-300`
  - Border default: `border-neutral-200`
  - Background page: `bg-white`
  - Background secondary: `bg-neutral-50`
- **Font**: Inter via `next/font/google`. Monospace untuk teks chunk source.
- **Spacing**: ikuti skala 4px Tailwind. Tidak ada magic number.
- **Dark mode**: tidak diimplementasikan di versi ini.
- **Responsive breakpoints**: mobile-first, breakpoint utama `md:` (768px).
  - `/chat`: DropZone full width di mobile. Chat layout stack vertikal di mobile.
  - `/analyze`: dua kolom di `md:`, stack vertikal di bawahnya.

---

## 11. Error Handling Convention

```typescript
// Pattern standar di komponen
const { mutate, isPending, error } = useIngest()

// Render error
{error instanceof ApiError && error.status === 400 && (
  <ErrorBanner message={error.message} />
)}
{error instanceof ApiError && error.status >= 500 && (
  <ErrorBanner message="Server bermasalah, coba beberapa saat lagi" onRetry={retry} />
)}
```

- **Error 4xx**: tampilkan pesan dari `error.message` (berasal dari `detail` backend)
- **Error 5xx / network error**: tampilkan pesan generik + tombol retry
- **Loading state**: selalu ada Spinner atau skeleton — tidak boleh ada blank state saat loading
- **Session expired (404)**: tampilkan pesan "Sesi berakhir" + tombol "Upload dokumen baru" yang memanggil `clearSession()`

---

## 12. Deployment ke Vercel

### Setup awal:
1. Push ke GitHub (monorepo: `documind/frontend/` + `documind/backend/`)
2. Import repo di [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** ke `frontend/`
4. Vercel auto-detect Next.js, tidak perlu konfigurasi build tambahan
5. Tambahkan env var di Vercel dashboard: `NEXT_PUBLIC_API_URL=https://api.documind.railway.app`

### Auto-deploy:
- Push ke `main` → Vercel otomatis deploy production
- Push ke branch lain → Vercel buat preview URL

### Vercel ignore build (opsional):
Tambahkan `vercel.json` di `frontend/` agar hanya rebuild jika ada perubahan di folder frontend:
```json
{
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- frontend/"
}
```

---

## 13. Aturan Implementasi untuk AI Agent

1. **Selalu TypeScript** — tidak ada `.js` atau `.jsx`. Semua komponen `.tsx`.
2. **Tidak ada `any` type** — gunakan `unknown` dan narrowing jika type tidak diketahui.
3. **Semua API call melalui `lib/api.ts`** — tidak ada `fetch` langsung di komponen.
4. **Semua API types dari `types/api.ts`** — tidak ada type inline di komponen.
5. **State global melalui Zustand** — tidak ada prop drilling lebih dari 2 level.
6. **Server state melalui TanStack Query** — tidak ada `useState` + `useEffect` untuk data fetching.
7. **Komponen single responsibility** — lebih dari 150 baris berarti harus dipecah.
8. **Loading dan error state wajib dihandle** di setiap komponen yang fetch data.
9. **`"use client"`** hanya jika komponen butuh browser API atau event handler. Server Component adalah default.
10. **Gambar pakai `next/image`** — tidak ada `<img>` biasa.
11. **Link pakai `next/link`** — tidak ada `<a>` untuk navigasi internal.
12. **Tidak ada monitoring dashboard** — jangan buat halaman atau komponen metrics apapun.
13. **Tidak ada RAGAS score display** — field ini belum ada di API response, jangan render apapun terkait evaluasi.
14. **Session bersifat sementara** — jangan tambahkan localStorage, IndexedDB, atau mekanisme persistence apapun.
