"""
Embedding model wrapper — Google text-embedding-004 via langchain-google-genai.
"""

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """
    Return an embedding model instance.
    Uses Google's text-embedding-004 model.
    """
    get_settings()  # ensure env var is set
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
    )
