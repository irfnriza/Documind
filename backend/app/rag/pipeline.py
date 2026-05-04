"""
RAG Pipeline orchestrator — ingest and query document flows.
All state is persisted in MongoDB (serverless-compatible).
"""

import uuid
import time
from typing import List
from datetime import datetime, timezone

from app.rag.loader import load_pdf, load_docx, load_url, DocumentLoadError
from app.rag.chunker import chunk_text
from app.rag.embedder import get_embeddings
from app.rag.retriever import store_chunks, search
from app.rag.generator import generate_answer, generate_answer_stream
from app.db import get_sessions_collection
from app.utils.logger import logger


class SessionNotFoundError(Exception):
    """Raised when session_id is not found or expired."""
    pass


async def ingest_document(
    files_data: List[dict] | None = None,
    url: str | None = None,
) -> dict:
    """
    Ingest multiple documents or a URL: load → chunk → embed → store in MongoDB.
    files_data is a list of dicts: {"filename": str, "content_type": str, "bytes": bytes}
    Returns dict with session_id, filename, chunks count, status.
    """
    session_id = str(uuid.uuid4())
    all_chunks = []
    all_metadatas = []
    filenames = []
    
    # Process files
    if files_data:
        for f in files_data:
            filename = f["filename"]
            file_bytes = f["bytes"]
            filenames.append(filename)
            
            ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
            try:
                if ext == "pdf":
                    full_text, pages_data = load_pdf(file_bytes)
                elif ext in ("docx", "doc"):
                    full_text, pages_data = load_docx(file_bytes)
                else:
                    raise DocumentLoadError(f"Format file tidak didukung: .{ext}. Gunakan PDF atau DOCX.")
                
                # Chunk text
                chunks, metadatas = chunk_text(full_text, pages_data)
                
                # Tag metadatas with filename so we know which chunk belongs to which file
                for m in metadatas:
                    m["filename"] = filename
                    
                all_chunks.extend(chunks)
                all_metadatas.extend(metadatas)
                
                # Save raw PDF to MongoDB for the PDF viewer
                if ext == "pdf":
                    from app.db import get_db
                    db = get_db()
                    documents_col = db["documents"]
                    import bson
                    # Only store if under 15MB (BSON limit is 16MB)
                    if len(file_bytes) < 15 * 1024 * 1024:
                        await documents_col.insert_one({
                            "session_id": session_id,
                            "filename": filename,
                            "content_type": "application/pdf",
                            "data": bson.Binary(file_bytes),
                            "created_at": datetime.now(timezone.utc)
                        })
            except Exception as e:
                logger.error(f"Failed to load {filename}: {e}")
                raise DocumentLoadError(f"Gagal memproses {filename}: {str(e)}")

    # Process URL
    elif url:
        full_text, pages_data = await load_url(url)
        filename = url[:80]
        filenames.append(filename)
        chunks, metadatas = chunk_text(full_text, pages_data)
        for m in metadatas:
            m["filename"] = filename
        all_chunks.extend(chunks)
        all_metadatas.extend(metadatas)
    else:
        raise DocumentLoadError("Tidak ada file atau URL yang diberikan.")

    if not all_chunks:
        raise DocumentLoadError("Dokumen tidak menghasilkan chunk yang valid.")

    # Generate embeddings for all chunks
    try:
        embeddings_model = get_embeddings()
        embeddings_vectors = embeddings_model.embed_documents(all_chunks)
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise

    sessions = get_sessions_collection()

    display_filename = filenames[0] if len(filenames) == 1 else f"{filenames[0]} + {len(filenames)-1} lainnya"

    await sessions.insert_one({
        "_id": session_id,
        "filenames": filenames,
        "display_filename": display_filename,
        "chunks_count": len(all_chunks),
        "created_at": datetime.now(timezone.utc),
    })

    # Store chunks with embeddings in MongoDB
    await store_chunks(session_id, all_chunks, all_metadatas, embeddings_vectors)

    logger.info(f"Session created: {session_id}, {len(all_chunks)} chunks from {len(filenames)} files")

    return {
        "session_id": session_id,
        "filename": display_filename,
        "filenames": filenames,
        "chunks": len(all_chunks),
        "status": "ready",
    }


async def query_document(
    session_id: str,
    question: str,
    top_k: int = 5,
) -> dict:
    """
    Query a document: retrieve from MongoDB → generate answer.

    Returns dict with answer, sources, latency_ms.
    """
    sessions = get_sessions_collection()

    # Verify session exists
    session = await sessions.find_one({"_id": session_id})
    if not session:
        raise SessionNotFoundError("Session tidak ditemukan atau sudah expired.")

    start_time = time.time()

    # Retrieve relevant chunks via similarity search
    sources = await search(session_id, question, top_k=top_k)

    # Generate answer
    answer = await generate_answer(question, sources)

    latency_ms = int((time.time() - start_time) * 1000)

    logger.info(f"Query answered: session={session_id[:8]}..., latency={latency_ms}ms")

    return {
        "answer": answer,
        "sources": sources,
        "latency_ms": latency_ms,
    }


import json

async def query_document_stream(
    session_id: str,
    question: str,
    top_k: int = 5,
):
    """
    Query a document, returning an async generator that yields SSE events.
    """
    sessions = get_sessions_collection()

    # Verify session exists
    session = await sessions.find_one({"_id": session_id})
    if not session:
        raise SessionNotFoundError("Session tidak ditemukan atau sudah expired.")

    start_time = time.time()

    # Retrieve relevant chunks via similarity search
    sources = await search(session_id, question, top_k=top_k)

    # Generate answer stream
    async for chunk in generate_answer_stream(question, sources):
        if chunk:
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

    # Send sources at the end
    latency_ms = int((time.time() - start_time) * 1000)
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'latency_ms': latency_ms})}\n\n"
    yield "data: {\"type\": \"done\"}\n\n"
