"""
RAG Pipeline orchestrator — ingest and query document flows.
"""

import uuid
import time
from typing import List

from app.rag.loader import load_pdf, load_docx, load_url, DocumentLoadError
from app.rag.chunker import chunk_text
from app.rag.retriever import create_index, search
from app.rag.generator import generate_answer
from app.dependencies import get_session_store, get_session_meta
from app.utils.logger import logger


class SessionNotFoundError(Exception):
    """Raised when session_id is not found or expired."""
    pass


async def ingest_document(
    file_bytes: bytes | None = None,
    filename: str | None = None,
    url: str | None = None,
) -> dict:
    """
    Ingest a document: load → chunk → embed → store in FAISS.

    Returns dict with session_id, filename, chunks count, status.
    """
    # Load document
    if file_bytes and filename:
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if ext == "pdf":
            full_text, pages_data = load_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            full_text, pages_data = load_docx(file_bytes)
        else:
            raise DocumentLoadError(f"Format file tidak didukung: .{ext}. Gunakan PDF atau DOCX.")
    elif url:
        full_text, pages_data = await load_url(url)
        filename = url[:80]
    else:
        raise DocumentLoadError("Tidak ada file atau URL yang diberikan.")

    # Chunk text
    chunks, metadatas = chunk_text(full_text, pages_data)

    if not chunks:
        raise DocumentLoadError("Dokumen tidak menghasilkan chunk yang valid.")

    # Create FAISS index
    try:
        index = create_index(chunks, metadatas)
    except Exception as e:
        logger.error(f"Failed to create FAISS index: {e}")
        raise

    # Store in session
    session_id = str(uuid.uuid4())
    store = get_session_store()
    meta = get_session_meta()

    store[session_id] = index
    meta[session_id] = {
        "last_active": time.time(),
        "filename": filename or "unknown",
    }

    logger.info(f"Session created: {session_id}, {len(chunks)} chunks")

    return {
        "session_id": session_id,
        "filename": filename or "unknown",
        "chunks": len(chunks),
        "status": "ready",
    }


async def query_document(
    session_id: str,
    question: str,
    top_k: int = 5,
) -> dict:
    """
    Query a document: retrieve from FAISS → generate answer.

    Returns dict with answer, sources, latency_ms.
    """
    store = get_session_store()
    meta = get_session_meta()

    if session_id not in store:
        raise SessionNotFoundError("Session tidak ditemukan atau sudah expired.")

    # Update last active
    meta[session_id]["last_active"] = time.time()

    start_time = time.time()

    # Retrieve relevant chunks
    index = store[session_id]
    sources = search(index, question, top_k=top_k)

    # Generate answer
    answer = await generate_answer(question, sources)

    latency_ms = int((time.time() - start_time) * 1000)

    logger.info(f"Query answered: session={session_id[:8]}..., latency={latency_ms}ms")

    return {
        "answer": answer,
        "sources": sources,
        "latency_ms": latency_ms,
    }
