"""
POST /api/ingest — Document ingestion endpoint.
Receives PDF/DOCX file or URL, processes via RAG pipeline.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from app.rag.pipeline import ingest_document
from app.rag.loader import DocumentLoadError
from app.utils.logger import logger

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/api/ingest")
async def ingest(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
):
    """
    Ingest a document for Q&A.
    Accepts either a PDF/DOCX file or a URL.
    """
    # Validate: at least one of file or url must be provided
    if not file and not url:
        raise HTTPException(
            status_code=422,
            detail="Tidak ada file atau URL yang diberikan. Kirim salah satu.",
        )

    file_bytes = None
    filename = None

    if file:
        # Validate file type
        if file.content_type and file.content_type not in [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        ]:
            # Also check by extension as fallback
            ext = (file.filename or "").lower().rsplit(".", 1)[-1] if file.filename else ""
            if ext not in ("pdf", "docx", "doc"):
                raise HTTPException(
                    status_code=400,
                    detail="Format file tidak didukung. Gunakan PDF atau DOCX.",
                )

        # Read file bytes
        file_bytes = await file.read()
        filename = file.filename or "unknown"

        # Validate file size
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Ukuran file melebihi batas maksimum {MAX_FILE_SIZE // (1024*1024)}MB.",
            )

    try:
        result = await ingest_document(
            file_bytes=file_bytes,
            filename=filename,
            url=url,
        )
        return result

    except DocumentLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal memproses dokumen. Error: {str(e)}")
