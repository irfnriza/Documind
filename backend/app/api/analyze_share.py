from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone

from app.db import get_db
from app.config import get_settings

router = APIRouter()

class ShareAnalysisRequest(BaseModel):
    analysis_data: dict

@router.post("/api/analyze/share")
async def share_analysis(request: ShareAnalysisRequest):
    """
    Save analysis results to MongoDB to be shared via link.
    """
    db = get_db()
    shared_col = db["shared_analysis"]
    
    share_id = str(uuid.uuid4())[:8] # Short ID
    
    await shared_col.insert_one({
        "_id": share_id,
        "data": request.analysis_data,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"share_id": share_id}

@router.get("/api/analyze/share/{share_id}")
async def get_shared_analysis(share_id: str):
    """
    Retrieve shared analysis results.
    """
    db = get_db()
    shared_col = db["shared_analysis"]
    
    doc = await shared_col.find_one({"_id": share_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Hasil analisis tidak ditemukan atau sudah kadaluarsa.")
        
    return doc["data"]
