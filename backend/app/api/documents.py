from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.db import get_db

router = APIRouter()

@router.get("/api/documents/{session_id}/{filename}")
async def get_document(session_id: str, filename: str):
    """
    Retrieve a raw PDF document stored during ingestion for the PDF viewer.
    """
    db = get_db()
    documents_col = db["documents"]
    
    doc = await documents_col.find_one({
        "session_id": session_id,
        "filename": filename
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
        
    if "data" not in doc:
        raise HTTPException(status_code=400, detail="Data dokumen tidak valid.")
        
    return Response(
        content=doc["data"],
        media_type=doc["content_type"] or "application/pdf"
    )
