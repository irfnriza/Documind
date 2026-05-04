"""
Application settings via pydantic-settings.
All environment variables are read from OS environment (Vercel) or .env file (local dev).
"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings — single source of truth for all config."""

    # Google AI Studio
    GOOGLE_API_KEY: str = ""

    # MongoDB
    MONGO_URI: str = ""

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"

    # Session
    SESSION_TTL_HOURS: int = 2

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


_settings: Settings | None = None


def get_settings() -> Settings:
    """Settings instance — also exports GOOGLE_API_KEY to env for libraries."""
    global _settings
    if _settings is None:
        _settings = Settings()
        # Export to env so langchain-google-genai auto-detects the key
        if _settings.GOOGLE_API_KEY:
            os.environ["GOOGLE_API_KEY"] = _settings.GOOGLE_API_KEY
    return _settings
