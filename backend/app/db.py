"""
MongoDB async client — Motor (async driver) for serverless compatibility.
Provides database and collection access.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Return a shared MongoDB client instance (connection pooled)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            maxPoolSize=10,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_db():
    """Return the DocuMind database."""
    return get_client()["documind"]


def get_sessions_collection():
    """Return the sessions collection."""
    return get_db()["sessions"]


def get_chunks_collection():
    """Return the chunks collection (stores text + embeddings)."""
    return get_db()["chunks"]
