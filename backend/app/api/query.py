"""
POST /api/query — Document Q&A endpoint.
Receives question + session_id, retrieves from FAISS, generates answer.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.rag.pipeline import query_document, query_document_stream, SessionNotFoundError
from app.utils.logger import logger

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    session_id: str
    top_k: int = Field(default=5, ge=1, le=10)


@router.post("/api/query")
async def query(request: QueryRequest):
    """
    Query a document in an active session.
    Retrieves relevant chunks and generates an answer.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    try:
        result = await query_document(
            session_id=request.session_id,
            question=request.question.strip(),
            top_k=request.top_k,
        )
        return result

    except SessionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Session tidak ditemukan atau sudah expired.",
        )
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail="Gagal memproses pertanyaan.")


@router.post("/api/query_stream")
async def query_stream(request: QueryRequest):
    """
    Stream a document query answer using Server-Sent Events (SSE).
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    return StreamingResponse(
        query_document_stream(
            session_id=request.session_id,
            question=request.question.strip(),
            top_k=request.top_k,
        ),
        media_type="text/event-stream"
    )
