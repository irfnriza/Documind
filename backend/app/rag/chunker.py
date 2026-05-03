"""
Text splitting strategy.
chunk_size=1000, chunk_overlap=200 — do not change without explicit instruction.
"""

import uuid
from typing import List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.utils.logger import logger


def chunk_text(
    full_text: str,
    pages_data: List[dict],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> Tuple[List[str], List[dict]]:
    """
    Split text into chunks with metadata.

    Returns:
        chunks: list of text chunks
        metadatas: list of metadata dicts with chunk_id and page number
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: List[str] = []
    metadatas: List[dict] = []

    for page_info in pages_data:
        page_chunks = splitter.split_text(page_info["text"])
        for chunk in page_chunks:
            chunks.append(chunk)
            metadatas.append({
                "chunk_id": str(uuid.uuid4()),
                "page": page_info["page"],
            })

    logger.info(f"Text chunked: {len(chunks)} chunks from {len(pages_data)} pages")
    return chunks, metadatas
