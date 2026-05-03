"""
FastAPI application factory.
CORS, router registration, session store, TTL cleanup.
"""

import asyncio
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.dependencies import get_session_store, get_session_meta
from app.api.ingest import router as ingest_router
from app.api.query import router as query_router
from app.api.analyze import router as analyze_router
from app.utils.logger import logger


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title="DocuMind API",
        description="AI Document Intelligence — Legal Clause Analyzer",
        version="1.0.0",
    )

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS.split(","),
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Register routers
    application.include_router(ingest_router, tags=["Ingestion"])
    application.include_router(query_router, tags=["Query"])
    application.include_router(analyze_router, tags=["Analysis"])

    # Health check
    @application.get("/")
    async def health():
        store = get_session_store()
        return {
            "status": "ok",
            "service": "DocuMind API",
            "active_sessions": len(store),
        }

    # TTL cleanup background task
    @application.on_event("startup")
    async def start_cleanup():
        asyncio.create_task(cleanup_expired_sessions())
        logger.info("DocuMind API started")

    return application


async def cleanup_expired_sessions():
    """Remove expired sessions every 30 minutes."""
    settings = get_settings()
    ttl_seconds = settings.SESSION_TTL_HOURS * 3600

    while True:
        await asyncio.sleep(1800)  # every 30 minutes
        now = time.time()
        store = get_session_store()
        meta = get_session_meta()

        expired = [
            sid for sid, m in meta.items()
            if now - m["last_active"] > ttl_seconds
        ]

        for sid in expired:
            store.pop(sid, None)
            meta.pop(sid, None)

        if expired:
            logger.info(f"Cleaned up {len(expired)} expired sessions")


app = create_app()
