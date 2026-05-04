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

MAX_FILE_SIZE = 4 * 1024 * 1024  # 4MB (Vercel payload limit is 4.5MB)


@router.post("/api/ingest")
async def ingest(
    files: Optional[list[UploadFile]] = File(None),
    url: Optional[str] = Form(None),
):
    """
    Ingest documents for Q&A.
    Accepts either a list of PDF/DOCX files or a URL.
    """
    # Validate: at least one of files or url must be provided
    if not files and not url:
        raise HTTPException(
            status_code=422,
            detail="Tidak ada file atau URL yang diberikan. Kirim setidaknya satu file.",
        )

    files_data = []

    if files:
        for file in files:
            # Validate file type
            if file.content_type and file.content_type not in [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            ]:
                ext = (file.filename or "").lower().rsplit(".", 1)[-1] if file.filename else ""
                if ext not in ("pdf", "docx", "doc"):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Format file {file.filename} tidak didukung. Gunakan PDF atau DOCX.",
                    )

            # Read file bytes
            file_bytes = await file.read()
            filename = file.filename or "unknown"

            # Validate file size
            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ukuran file {filename} melebihi batas maksimum {MAX_FILE_SIZE // (1024*1024)}MB.",
                )
                
            files_data.append({
                "filename": filename,
                "content_type": file.content_type,
                "bytes": file_bytes
            })

    try:
        result = await ingest_document(
            files_data=files_data if files_data else None,
            url=url,
        )
        return result

    except DocumentLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses dokumen: {str(e)}")
