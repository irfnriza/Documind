"""
LLM answer generation — Gemini 2.0 Flash via langchain-google-genai.
Prompt assembly for RAG Q&A in Bahasa Indonesia.
"""

from typing import List

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import get_settings
from app.utils.logger import logger

# System prompt for RAG Q&A
SYSTEM_PROMPT = """Kamu adalah asisten dokumen yang menjawab pertanyaan berdasarkan konteks yang diberikan.
Jawab dalam bahasa Indonesia. Jika jawaban tidak ada di konteks, katakan "Informasi ini tidak tersedia dalam dokumen."
Jangan mengarang informasi di luar konteks.
Berikan jawaban yang terstruktur dan mudah dipahami."""


def get_llm() -> ChatGoogleGenerativeAI:
    """Return a configured Gemini LLM instance."""
    get_settings()  # ensure env var is set
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.3,
        max_output_tokens=2048,
    )


async def generate_answer(question: str, sources: List[dict]) -> str:
    """
    Generate an answer from retrieved sources using Gemini.

    Args:
        question: User's question
        sources: List of retrieved chunks with text, page, score

    Returns:
        Generated answer string
    """
    # Build context from sources, max ~4000 chars
    context_parts = []
    total_chars = 0
    for source in sources:
        text = source["text"]
        if total_chars + len(text) > 4000:
            break
        context_parts.append(text)
        total_chars += len(text)

    context = "\n---\n".join(context_parts)

    user_prompt = f"""Konteks:
{context}

Pertanyaan: {question}"""

    llm = get_llm()

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        answer = response.content
        logger.info(f"Answer generated: {len(answer)} chars")
        return answer

    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        raise


async def generate_answer_stream(question: str, sources: List[dict]):
    """
    Generate an answer from retrieved sources using Gemini, streaming the response.
    
    Args:
        question: User's question
        sources: List of retrieved chunks
        
    Yields:
        Chunks of generated answer string
    """
    context_parts = []
    total_chars = 0
    for source in sources:
        text = source["text"]
        if total_chars + len(text) > 4000:
            break
        context_parts.append(text)
        total_chars += len(text)

    context = "\n---\n".join(context_parts)

    user_prompt = f"""Konteks:
{context}

Pertanyaan: {question}"""

    llm = get_llm()

    try:
        async for chunk in llm.astream([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]):
            yield chunk.content

    except Exception as e:
        logger.error(f"LLM stream generation failed: {e}")
        raise

