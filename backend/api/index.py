"""
Vercel serverless entrypoint.
Vercel auto-detects the `app` variable as an ASGI application.
"""

from app.main import app
