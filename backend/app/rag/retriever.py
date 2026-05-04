"""
Vector retriever — MongoDB-backed similarity search.

Supports two modes:
1. MongoDB Atlas Vector Search ($vectorSearch) — fast, native
2. Cosine similarity fallback — works on any MongoDB tier
"""

import numpy as np
from typing import List

from app.db import get_chunks_collection
from app.rag.embedder import get_embeddings
from app.utils.logger import logger


async def store_chunks(
    session_id: str,
    chunks: List[str],
    metadatas: List[dict],
    embeddings_vectors: List[List[float]],
) -> int:
    """
    Store text chunks with their embeddings in MongoDB.
    Returns the number of documents inserted.
    """
    collection = get_chunks_collection()
    from datetime import datetime, timezone

    documents = []
    for text, meta, embedding in zip(chunks, metadatas, embeddings_vectors):
        documents.append({
            "session_id": session_id,
            "text": text,
            "embedding": embedding,
            "page": meta.get("page", 0),
            "chunk_id": meta.get("chunk_id", ""),
            "created_at": datetime.now(timezone.utc),
        })

    if documents:
        await collection.insert_many(documents)

    logger.info(f"Stored {len(documents)} chunks for session {session_id[:8]}...")
    return len(documents)


async def search(session_id: str, query: str, top_k: int = 5) -> List[dict]:
    """
    Perform similarity search on chunks belonging to a session.
    Uses cosine similarity computed in Python (works on all MongoDB tiers).
    """
    collection = get_chunks_collection()

    # Generate query embedding
    embeddings_model = get_embeddings()
    query_embedding = embeddings_model.embed_query(query)

    # Fetch all chunks for this session
    cursor = collection.find(
        {"session_id": session_id},
        {"text": 1, "embedding": 1, "page": 1, "chunk_id": 1, "_id": 0},
    )
    docs = await cursor.to_list(length=500)

    if not docs:
        logger.warning(f"No chunks found for session {session_id[:8]}...")
        return []

    # Compute cosine similarity
    query_vec = np.array(query_embedding)
    results = []
    for doc in docs:
        doc_vec = np.array(doc["embedding"])
        # Cosine similarity
        dot = np.dot(query_vec, doc_vec)
        norm = np.linalg.norm(query_vec) * np.linalg.norm(doc_vec)
        score = float(dot / norm) if norm > 0 else 0.0
        results.append({
            "text": doc["text"],
            "score": round(score, 4),
            "page": doc.get("page", 0),
            "chunk_id": doc.get("chunk_id"),
        })

    # Sort by score descending, return top_k
    results.sort(key=lambda x: x["score"], reverse=True)
    top_results = results[:top_k]

    logger.info(f"Search returned {len(top_results)} results (top score: {top_results[0]['score'] if top_results else 'N/A'})")
    return top_results


async def delete_session_chunks(session_id: str) -> int:
    """Delete all chunks for a session. Returns count of deleted documents."""
    collection = get_chunks_collection()
    result = await collection.delete_many({"session_id": session_id})
    return result.deleted_count
