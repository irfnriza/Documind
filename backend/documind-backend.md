# DocuMind — Backend Documentation
> Pedoman teknis untuk AI agent. Dokumen ini mencakup arsitektur, stack, struktur folder, API contract, dan aturan implementasi backend DocuMind.

---

## 1. Konteks Project

DocuMind adalah platform AI Document Intelligence yang memungkinkan user untuk:
- Upload dokumen (PDF, DOCX, URL) dan melakukan tanya-jawab dalam bahasa natural
- Menganalisis klausul hukum secara otomatis (Legal Mode)

### Prinsip Arsitektur

Backend bersifat **stateless** — tidak ada database, tidak ada penyimpanan file permanen.
Dokumen diproses sepenuhnya di memory dan dibuang saat session berakhir.
Ini adalah keputusan desain yang disengaja: tidak ada data user yang tersimpan di server.

### Alur kerja

```
User upload PDF
    ↓
FastAPI terima file (di memory, tidak ditulis ke disk)
    ↓
LangChain: load → chunk → embed → simpan ke FAISS in-memory
    ↓
Return session_id (UUID, key untuk FAISS index di RAM)
    ↓
User kirim pertanyaan + session_id
    ↓
Retrieve dari FAISS → generate jawaban → return ke user
    ↓
User selesai → FAISS index hilang saat server restart atau TTL habis
```

> **Catatan deployment**: karena index ada di RAM, server restart akan menghapus semua session aktif. Ini acceptable untuk portofolio. Jika di masa depan dibutuhkan persistence, FAISS index bisa di-serialize ke disk tanpa mengubah API contract.

---

## 2. Tech Stack

| Komponen | Teknologi | Versi |
|---|---|---|
| Web framework | FastAPI | >= 0.110 |
| RAG orchestration | LangChain | >= 0.2 |
| LLM | OpenAI GPT-4o via LangChain | latest |
| Embedding model | OpenAI text-embedding-3-small | 1536 dim |
| Vector store | FAISS (in-memory) via langchain-community | latest |
| PDF parsing | pdfplumber | latest |
| DOCX parsing | python-docx | latest |
| Web scraping | BeautifulSoup4 + httpx | latest |
| Server | Uvicorn | latest |
| Containerization | Docker | latest |
| Hosting | Railway | — |

**Yang sengaja tidak dipakai:**
- ~~PostgreSQL~~ — tidak ada data yang perlu disimpan permanen
- ~~Weaviate / Pinecone~~ — digantikan FAISS in-memory, tidak perlu service terpisah
- ~~RAGAS~~ — direncanakan untuk dashboard terpusat di masa depan, belum diimplementasikan

---

## 3. Struktur Folder

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory, CORS, router registration, session store
│   ├── config.py                # Settings via pydantic-settings (baca dari env vars)
│   ├── dependencies.py          # Shared DI: get_session_store
│   │
│   ├── api/                     # Route handlers (tipis, hanya validasi + delegate)
│   │   ├── __init__.py
│   │   ├── ingest.py            # POST /api/ingest
│   │   ├── query.py             # POST /api/query
│   │   └── analyze.py           # POST /api/analyze
│   │
│   ├── rag/                     # Seluruh logika RAG pipeline
│   │   ├── __init__.py
│   │   ├── pipeline.py          # Orchestrator: ingest + query flow
│   │   ├── loader.py            # PDF, DOCX, URL loader & text extraction
│   │   ├── chunker.py           # Text splitting strategy
│   │   ├── embedder.py          # Embedding model wrapper
│   │   ├── retriever.py         # FAISS similarity search
│   │   └── generator.py         # LLM answer generation + prompt assembly
│   │
│   ├── legal/                   # Legal analysis module (independen dari RAG)
│   │   ├── __init__.py
│   │   ├── analyzer.py          # Orchestrator legal analysis
│   │   └── prompts.py           # System + user prompt templates untuk clause detection
│   │
│   └── utils/
│       ├── __init__.py
│       └── logger.py            # Structured logging config
│
├── Dockerfile
├── .env.example
└── requirements.txt
```

### Aturan Struktur
- File di `api/` harus tipis: hanya parsing request, panggil service, return response. Tidak ada business logic.
- Seluruh business logic ada di `rag/` dan `legal/`.
- Tidak boleh ada cross-import antara `rag/` dan `legal/` — keduanya independent.
- `dependencies.py` adalah satu-satunya tempat inisialisasi `session_store`.

---

## 4. Session Store (In-Memory)

Karena tidak ada database, session dikelola dengan dictionary sederhana di memory aplikasi.

```python
# app/main.py — inisialisasi saat startup

from typing import Dict
from langchain_community.vectorstores import FAISS

# Global session store: { session_id: FAISS index }
session_store: Dict[str, FAISS] = {}

# Session metadata: { session_id: { "last_active": float, "filename": str } }
session_meta: Dict[str, dict] = {}
```

### TTL (Time-to-Live)
Session otomatis dihapus setelah **2 jam** tidak aktif untuk mencegah memory leak.
Implementasi menggunakan background task yang berjalan setiap 30 menit:

```python
async def cleanup_expired_sessions():
    while True:
        await asyncio.sleep(1800)  # setiap 30 menit
        now = time.time()
        expired = [sid for sid, meta in session_meta.items()
                   if now - meta["last_active"] > 7200]  # 2 jam
        for sid in expired:
            session_store.pop(sid, None)
            session_meta.pop(sid, None)
```

---

## 5. Environment Variables

Semua env vars dibaca melalui `app/config.py` menggunakan `pydantic-settings`.

```env
# .env.example

# OpenAI — satu-satunya secret yang dibutuhkan
OPENAI_API_KEY=sk-...

# App
APP_ENV=development
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO

# Session
SESSION_TTL_HOURS=2
```

---

## 6. API Contract

Base URL production: `https://api.documind.railway.app`
Base URL development: `http://localhost:8000`

Semua endpoint menggunakan JSON kecuali `/api/ingest` yang menerima `multipart/form-data`.
Semua response error: `{"detail": "pesan error"}` dengan HTTP status yang sesuai.

**Tidak ada endpoint untuk metrics atau list dokumen** — tidak ada data yang dipersist.

---

### 6.1 POST `/api/ingest`

Menerima dokumen, memprosesnya, dan menyimpan FAISS index ke session store.
**File tidak ditulis ke disk** — diproses dari `bytes` di memory.

**Request** — `multipart/form-data`:
```
file: File          # PDF atau DOCX (opsional jika url diisi)
url:  string        # URL halaman web (opsional jika file diisi)
```
Salah satu dari `file` atau `url` wajib ada. Ukuran file maksimum: **10MB**.

**Response** `200 OK`:
```json
{
  "session_id": "uuid-v4",
  "filename": "kontrak-sewa.pdf",
  "chunks": 42,
  "status": "ready"
}
```

**Error cases**:
- `400` — file bukan PDF/DOCX, ukuran melebihi 10MB, atau URL tidak dapat diakses
- `422` — tidak ada file maupun URL
- `500` — gagal membuat FAISS index

**Pipeline**: `rag/pipeline.py → ingest_document()`

---

### 6.2 POST `/api/query`

Menerima pertanyaan dan `session_id`, retrieve dari FAISS, generate jawaban.

**Request**:
```json
{
  "question": "Apa saja klausul yang merugikan saya?",
  "session_id": "uuid-v4",
  "top_k": 5
}
```
- `top_k` default: `5`, range: `1–10`
- `session_id` harus valid dan belum expired

**Response** `200 OK`:
```json
{
  "answer": "Berdasarkan dokumen, terdapat tiga klausul yang perlu diperhatikan...",
  "sources": [
    {
      "chunk_id": "uuid",
      "text": "...teks chunk relevan...",
      "page": 3,
      "score": 0.91
    }
  ],
  "latency_ms": 1423
}
```

**Error cases**:
- `404` — `session_id` tidak ditemukan atau sudah expired
- `400` — `question` kosong
- `500` — LLM call gagal

**Pipeline**: `rag/pipeline.py → query_document()`

---

### 6.3 POST `/api/analyze`

Menganalisis teks hukum langsung — **tidak membutuhkan `session_id`**.
Sepenuhnya stateless: terima teks → proses → return hasil.

**Request**:
```json
{
  "text": "Penyewa wajib membayar denda 5% per hari...",
  "mode": "legal"
}
```
- `mode`: `"legal"` (default) atau `"general"`
- `text` maksimum: **8000 karakter**

**Response** `200 OK`:
```json
{
  "risk_score": 72,
  "summary": "Kontrak ini memiliki risiko tinggi...",
  "clauses": [
    {
      "title": "Denda keterlambatan",
      "level": "BAHAYA",
      "original_text": "denda sebesar 5% per hari...",
      "translation": "Intinya: kalau telat bayar 1 hari, kamu kena denda 5% dari total sewa.",
      "impact": "Denda bisa melebihi nilai sewa jika keterlambatan lebih dari 20 hari."
    }
  ],
  "total_clauses": 4,
  "bahaya_count": 1,
  "perhatian_count": 2,
  "aman_count": 1
}
```

`level` hanya boleh: `"BAHAYA"`, `"PERHATIAN"`, atau `"AMAN"`.

**Pipeline**: `legal/analyzer.py → analyze_text()`

---

## 7. RAG Pipeline Detail

### 7.1 Ingestion flow

```
loader.py     → Baca file bytes / fetch URL, return raw text string
chunker.py    → Split teks: chunk_size=1000, chunk_overlap=200, separator="\n\n"
embedder.py   → Batch embed semua chunks via text-embedding-3-small
retriever.py  → Buat FAISS index, simpan ke session_store[session_id]
```

**Aturan loader.py**:
- PDF: gunakan `pdfplumber`, ekstrak teks per halaman, simpan metadata `page` di tiap chunk
- DOCX: gunakan `python-docx`, ekstrak paragraf, gabungkan dengan `\n`
- URL: gunakan `httpx` fetch + `BeautifulSoup4` strip HTML, ambil teks dari `<p>`, `<h1>`–`<h6>`, `<li>`
- File dibaca dari `bytes` (dari `UploadFile.read()`), **tidak pernah ditulis ke disk**

### 7.2 Query flow

```
embedder.py   → Embed pertanyaan user (single call)
retriever.py  → FAISS similarity_search_with_score dari session_store[session_id], top_k chunks
generator.py  → Rakit prompt + call GPT-4o + return jawaban + sources
```

**Prompt template** di `generator.py`:
```
System:
  Kamu adalah asisten dokumen yang menjawab pertanyaan berdasarkan konteks yang diberikan.
  Jawab dalam bahasa Indonesia. Jika jawaban tidak ada di konteks, katakan "Informasi ini
  tidak tersedia dalam dokumen." Jangan mengarang informasi di luar konteks.

User:
  Konteks:
  {context}
  <- teks dari top_k chunks, dipisah "\n---\n", maksimum 4000 token total

  Pertanyaan: {question}
```

### 7.3 FAISS Implementation

```python
# retriever.py

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

def create_index(chunks: list[str], metadatas: list[dict]) -> FAISS:
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return FAISS.from_texts(chunks, embeddings, metadatas=metadatas)

def search(index: FAISS, query: str, top_k: int = 5) -> list[dict]:
    results = index.similarity_search_with_score(query, k=top_k)
    return [
        {
            "text": doc.page_content,
            "score": float(score),
            "page": doc.metadata.get("page", 0),
            "chunk_id": doc.metadata.get("chunk_id")
        }
        for doc, score in results
    ]
```

---

## 8. Legal Analysis Detail

`/api/analyze` menggunakan **structured LLM call** — LLM diminta respond dalam JSON ketat.

**Strategi**:
- System prompt menginstruksikan LLM respond hanya JSON, tanpa preamble
- Schema JSON didefinisikan eksplisit di dalam prompt
- Response di-parse dengan `json.loads()`, jika gagal retry sekali
- `risk_score` dihitung dari proporsi klausul: BAHAYA=100 poin, PERHATIAN=50, AMAN=0, dinormalisasi ke 0–100
- Jika `text` melebihi 8000 karakter, potong dan tambahkan catatan di `summary`

---

## 9. Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Tidak ada `docker-compose.yml` untuk production — hanya satu container.
Development lokal: `uvicorn app.main:app --reload`

---

## 10. CORS Configuration

```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

**Development**: `CORS_ORIGINS=http://localhost:3000`
**Production**: `CORS_ORIGINS=https://documind.vercel.app`

---

## 11. Error Handling Convention

Custom exceptions di modul masing-masing:

```python
# rag/pipeline.py
class SessionNotFoundError(Exception): pass
class DocumentLoadError(Exception): pass

# legal/analyzer.py
class AnalysisParseError(Exception): pass
```

Di-catch di layer `api/` dan dikonversi ke `HTTPException`:

```python
try:
    result = await pipeline.query_document(...)
except SessionNotFoundError:
    raise HTTPException(status_code=404, detail="Session tidak ditemukan atau sudah expired")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 12. Aturan Implementasi untuk AI Agent

1. **File upload tidak pernah ditulis ke disk** — selalu proses dari `bytes` di memory.
2. **Semua endpoint async** — gunakan `async def` dan `await` konsisten.
3. **Session store adalah satu-satunya state** — tidak ada state lain di luar `session_store` dan `session_meta`.
4. **Environment variables hanya dari `config.py`** — tidak ada `os.getenv()` langsung di file lain.
5. **Tidak ada database** — jangan tambahkan SQLAlchemy, Weaviate, Redis, atau storage apapun tanpa instruksi eksplisit.
6. **FAISS index dibuat per session** — jangan share index antar session.
7. **chunk_size=1000, chunk_overlap=200** — jangan ubah tanpa instruksi eksplisit.
8. **Model LLM**: `gpt-4o`. **Embedding**: `text-embedding-3-small`.
9. **TTL cleanup wajib berjalan** sebagai background task — jangan biarkan session menumpuk.
10. **RAGAS belum diimplementasikan** — jangan tambahkan dependency atau logika evaluasi apapun.
