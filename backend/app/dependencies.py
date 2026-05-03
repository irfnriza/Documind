"""
Shared dependency injection.
Session store and metadata are initialized here and injected into route handlers.
"""

from typing import Dict
from langchain_community.vectorstores import FAISS


# Global session store: { session_id: FAISS index }
session_store: Dict[str, FAISS] = {}

# Session metadata: { session_id: { "last_active": float, "filename": str } }
session_meta: Dict[str, dict] = {}


def get_session_store() -> Dict[str, FAISS]:
    """Return the global session store."""
    return session_store


def get_session_meta() -> Dict[str, dict]:
    """Return the global session metadata."""
    return session_meta
