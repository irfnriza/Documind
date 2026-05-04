"""
FastAPI application factory.
CORS, router registration. Serverless-compatible (no background tasks).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import get_sessions_collection, get_chunks_collection
from app.api.ingest import router as ingest_router
from app.api.query import router as query_router
from app.api.analyze import router as analyze_router
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup/shutdown lifecycle — creates MongoDB indexes once."""
    try:
        # Create TTL index on sessions — auto-deletes after SESSION_TTL_HOURS
        settings = get_settings()
        sessions = get_sessions_collection()
        chunks = get_chunks_collection()

        await sessions.create_index("created_at", expireAfterSeconds=settings.SESSION_TTL_HOURS * 3600)
        await chunks.create_index("session_id")
        await chunks.create_index("created_at", expireAfterSeconds=settings.SESSION_TTL_HOURS * 3600)

        logger.info("DocuMind API started (serverless mode)")
    except Exception as e:
        logger.warning(f"Index creation skipped (may already exist): {e}")

    yield  # app runs here


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title="DocuMind API",
        description="AI Document Intelligence — Legal Clause Analyzer",
        version="2.0.0",
        lifespan=lifespan,
    )

    # CORS — support comma-separated origins
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
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
        return {
            "status": "ok",
            "service": "DocuMind API",
            "version": "2.0.0",
            "runtime": "serverless",
        }

    return application


app = create_app()
