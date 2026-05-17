"""Vercel serverless entrypoint for the FastAPI model API.

Vercel looks for Python functions under `api/`. The main application lives in
`model/main.py`, so this module imports and exposes its FastAPI `app`.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from main import app  # noqa: E402
