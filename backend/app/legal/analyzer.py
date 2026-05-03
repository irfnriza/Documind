"""
Legal analysis orchestrator.
Analyzes legal text using structured LLM output via Gemini.
Independent from RAG module — no cross-imports.
"""

import json
from typing import Literal

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import get_settings
from app.legal.prompts import LEGAL_SYSTEM_PROMPT, LEGAL_USER_PROMPT, GENERAL_SYSTEM_PROMPT
from app.utils.logger import logger


class AnalysisParseError(Exception):
    """Raised when LLM response cannot be parsed as valid JSON."""
    pass


def _get_llm() -> ChatGoogleGenerativeAI:
    """Return a configured Gemini LLM for legal analysis."""
    get_settings()  # ensure env var is set
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        max_output_tokens=4096,
    )


def _calculate_risk_score(clauses: list) -> int:
    """
    Calculate risk score from clause levels.
    BAHAYA=100, PERHATIAN=50, AMAN=0
    Normalized to 0-100 range.
    """
    if not clauses:
        return 0

    level_scores = {
        "BAHAYA": 100,
        "PERHATIAN": 50,
        "AMAN": 0,
    }

    total = sum(level_scores.get(c.get("level", "AMAN"), 0) for c in clauses)
    max_possible = len(clauses) * 100
    return int((total / max_possible) * 100) if max_possible > 0 else 0


def _count_levels(clauses: list) -> dict:
    """Count clauses by level."""
    counts = {"bahaya_count": 0, "perhatian_count": 0, "aman_count": 0}
    for c in clauses:
        level = c.get("level", "").upper()
        if level == "BAHAYA":
            counts["bahaya_count"] += 1
        elif level == "PERHATIAN":
            counts["perhatian_count"] += 1
        elif level == "AMAN":
            counts["aman_count"] += 1
    return counts


def _parse_llm_response(content: str) -> dict:
    """
    Parse LLM response as JSON.
    Handles cases where LLM wraps JSON in markdown code blocks.
    """
    # Strip markdown code block if present
    text = content.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    return json.loads(text)


async def analyze_text(
    text: str,
    mode: Literal["legal", "general"] = "legal",
) -> dict:
    """
    Analyze legal or general text.

    Args:
        text: Text to analyze (max 8000 chars)
        mode: "legal" or "general"

    Returns:
        dict with risk_score, summary, clauses, counts
    """
    # Truncate if needed
    truncated = False
    if len(text) > 8000:
        text = text[:8000]
        truncated = True
        logger.warning("Text truncated to 8000 chars")

    # Select prompts based on mode
    system_prompt = LEGAL_SYSTEM_PROMPT if mode == "legal" else GENERAL_SYSTEM_PROMPT
    user_prompt = LEGAL_USER_PROMPT.format(text=text)

    llm = _get_llm()

    # Try up to 3 times (initial + 2 retries for rate limits/JSON errors)
    for attempt in range(3):
        try:
            response = await llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ])

            parsed = _parse_llm_response(response.content)

            clauses = parsed.get("clauses", [])
            summary = parsed.get("summary", "")

            if truncated:
                summary += " (Catatan: teks dipotong karena melebihi 8000 karakter)"

            # Validate clause levels
            valid_levels = {"BAHAYA", "PERHATIAN", "AMAN"}
            for clause in clauses:
                if clause.get("level", "").upper() not in valid_levels:
                    clause["level"] = "PERHATIAN"
                else:
                    clause["level"] = clause["level"].upper()

            risk_score = _calculate_risk_score(clauses)
            level_counts = _count_levels(clauses)

            result = {
                "risk_score": risk_score,
                "summary": summary,
                "clauses": clauses,
                "total_clauses": len(clauses),
                **level_counts,
            }

            logger.info(
                f"Analysis complete: {len(clauses)} clauses, "
                f"risk_score={risk_score}, mode={mode}"
            )

            return result

        except json.JSONDecodeError as e:
            if attempt < 2:
                logger.warning(f"JSON parse failed, retrying: {e}")
                continue
            logger.error(f"JSON parse failed after retries: {e}")
            raise AnalysisParseError(f"Gagal memproses respons AI: {str(e)}")
        except AnalysisParseError:
            raise
        except Exception as e:
            error_str = str(e)
            # Handle rate limit (429) — retry after delay
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if attempt < 2:
                    import asyncio
                    wait_time = 25 * (attempt + 1)
                    logger.warning(f"Rate limited, waiting {wait_time}s before retry (attempt {attempt + 1})")
                    await asyncio.sleep(wait_time)
                    continue
                logger.error(f"Rate limit exceeded after retries: {e}")
                raise AnalysisParseError(
                    "Quota API Google AI habis sementara. Silakan tunggu beberapa saat dan coba lagi."
                )
            logger.error(f"Analysis failed: {e}")
            raise

    raise AnalysisParseError("Gagal memproses respons AI setelah beberapa percobaan.")
