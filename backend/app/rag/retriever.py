"""
FAISS vector store — index creation and similarity search.
"""

from typing import List

from langchain_community.vectorstores import FAISS

from app.rag.embedder import get_embeddings
from app.utils.logger import logger


def create_index(chunks: List[str], metadatas: List[dict]) -> FAISS:
    """
    Create a FAISS index from text chunks and metadata.
    Each session gets its own index — never shared between sessions.
    """
    embeddings = get_embeddings()
    index = FAISS.from_texts(chunks, embeddings, metadatas=metadatas)
    logger.info(f"FAISS index created: {len(chunks)} vectors")
    return index


def search(index: FAISS, query: str, top_k: int = 5) -> List[dict]:
    """
    Perform similarity search on a FAISS index.

    Returns list of dicts with: text, score, page, chunk_id
    """
    results = index.similarity_search_with_score(query, k=top_k)
    return [
        {
            "text": doc.page_content,
            "score": round(float(score), 4),
            "page": doc.metadata.get("page", 0),
            "chunk_id": doc.metadata.get("chunk_id"),
        }
        for doc, score in results
    ]
