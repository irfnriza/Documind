"""
POST /api/analyze — Legal text analysis endpoint.
Stateless: receives text → processes → returns analysis.
No session_id required.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from app.legal.analyzer import analyze_text, AnalysisParseError
from app.utils.logger import logger

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str = Field(..., max_length=8000)
    mode: Literal["legal", "general"] = "legal"


@router.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Analyze legal text — completely stateless.
    Identifies clauses, assesses risk, and provides translations.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong.")

    try:
        result = await analyze_text(
            text=request.text.strip(),
            mode=request.mode,
        )
        return result

    except AnalysisParseError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Gagal menganalisis teks.")
