"""Vercel FastAPI entrypoint (see vercel_app.py). Do not use main.py on Vercel."""

from vercel_app import app

__all__ = ["app"]
