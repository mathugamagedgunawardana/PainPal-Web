"""Lightweight Vercel entrypoint for the model service.

The real ML server in `main.py` imports heavy dependencies such as PyTorch,
XGBoost, pandas, and scikit-learn. Those exceed Vercel's Python Lambda storage
limit, so this Vercel app only exposes health/status endpoints and returns a
clear 503 for model inference routes.

Deploy the full `main.py` service on a Python host with larger storage/runtime
limits (Render, Railway, Fly.io, a VPS, etc.) for real predictions.
"""

import os
import urllib.error
import urllib.request

from fastapi import FastAPI, HTTPException, Request
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from starlette.concurrency import run_in_threadpool
from starlette.responses import Response

FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" aria-label="PainPal AI">
  <defs>
    <linearGradient id="pp-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8B5CF6"/>
      <stop offset="0.45" stop-color="#6366F1"/>
      <stop offset="1" stop-color="#2DD4BF"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#pp-bg)"/>
  <path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M16 7.25c-2.35 0-4.25 1.62-4.25 3.62 0 .98.44 1.87 1.15 2.52-.95.55-1.55 1.45-1.55 2.48 0 1.66 1.46 3 3.25 3 .55 0 1.07-.12 1.52-.33.58 1.52 2.1 2.58 3.88 2.58 2.28 0 4.12-1.72 4.12-3.85 0-1.05-.48-2-1.25-2.62.62-.58 1-1.36 1-2.23 0-2-1.9-3.62-4.25-3.62-.72 0-1.4.15-2 .42A4.18 4.18 0 0 0 16 7.25Zm-2.6 3.62c0-1.15 1.17-2.08 2.6-2.08s2.6.93 2.6 2.08c0 .7-.35 1.33-.9 1.75l.75 1.3h-5.7l.75-1.3c-.55-.42-.9-1.05-.9-1.75Zm-.35 5.38c0-1.04.85-1.88 1.9-1.88h3.1c1.05 0 1.9.84 1.9 1.88 0 1.04-.85 1.88-1.9 1.88h-3.1c-1.05 0-1.9-.84-1.9-1.88Zm2.95 3.5a2.35 2.35 0 0 0 2.3 1.85c1.12 0 2.05-.78 2.28-1.85h-4.58Z"/>
</svg>"""
FAVICON_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
}

app = FastAPI(title="PainPal model API status", docs_url=None, redoc_url=None)


def _upstream_url() -> str | None:
    raw = os.getenv("MODEL_UPSTREAM_URL", "").strip()
    return raw.rstrip("/") if raw else None


async def _proxy_to_upstream(request: Request, path: str) -> Response:
    upstream = _upstream_url()
    if not upstream:
        raise HTTPException(
            status_code=503,
            detail=(
                "Full ML runtime is not available on Vercel. Set MODEL_UPSTREAM_URL "
                "to a Render/Railway/Fly.io/VPS deployment of model/main.py."
            ),
        )

    body = await request.body()
    query = f"?{request.url.query}" if request.url.query else ""
    target = f"{upstream}{path}{query}"
    content_type = request.headers.get("content-type", "application/json")

    def _send() -> Response:
        req = urllib.request.Request(
            target,
            data=body,
            method=request.method,
            headers={"content-type": content_type},
        )
        try:
            with urllib.request.urlopen(req, timeout=float(os.getenv("MODEL_UPSTREAM_TIMEOUT", "60"))) as resp:
                return Response(
                    content=resp.read(),
                    status_code=resp.status,
                    media_type=resp.headers.get_content_type(),
                )
        except urllib.error.HTTPError as exc:
            return Response(
                content=exc.read(),
                status_code=exc.code,
                media_type=exc.headers.get_content_type() if exc.headers else "application/json",
            )
        except urllib.error.URLError as exc:
            raise HTTPException(status_code=502, detail=f"Could not reach MODEL_UPSTREAM_URL: {exc}") from exc

    return await run_in_threadpool(_send)


@app.get("/")
def root():
    return {
        "service": "painpal-model-api",
        "status": "vercel-status-only",
        "message": (
            "This Vercel deployment is lightweight. It proxies predictions only "
            "when MODEL_UPSTREAM_URL points to a full model/main.py deployment."
        ),
        "health": "/api/health",
        "favicon": "/favicon.svg",
        "upstream_configured": _upstream_url() is not None,
    }


@app.get("/favicon.svg", include_in_schema=False)
def favicon_svg():
    return Response(content=FAVICON_SVG, media_type="image/svg+xml", headers=FAVICON_HEADERS)


@app.get("/logo.svg", include_in_schema=False)
def logo_svg():
    return Response(content=FAVICON_SVG, media_type="image/svg+xml", headers=FAVICON_HEADERS)


@app.get("/favicon.ico", include_in_schema=False)
def favicon_ico():
    # Serve the SVG directly for browsers/proxies that do not follow favicon redirects reliably.
    return Response(content=FAVICON_SVG, media_type="image/svg+xml", headers=FAVICON_HEADERS)


@app.get("/docs", include_in_schema=False)
def custom_swagger_docs():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="PainPal Model API status docs",
        swagger_favicon_url="/favicon.svg",
    )


@app.get("/redoc", include_in_schema=False)
def custom_redoc_docs():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title="PainPal Model API status docs",
        redoc_favicon_url="/favicon.svg",
    )


@app.get("/health")
def health():
    return {
        "ok": True,
        "status": "vercel-status-only",
        "model_runtime": "not-loaded-on-vercel",
        "upstream_configured": _upstream_url() is not None,
    }


@app.get("/api/health")
def api_health():
    return {
        "status": "ok",
        "service": "painpal-model-api",
        "runtime": "vercel-status-only",
        "upstream_configured": _upstream_url() is not None,
    }


@app.post("/predict")
async def predict_proxy(request: Request):
    return await _proxy_to_upstream(request, "/predict")


@app.post("/predict/next-attack")
async def next_attack_proxy(request: Request):
    return await _proxy_to_upstream(request, "/predict/next-attack")


@app.post("/predict_next_attack")
async def next_attack_alias_proxy(request: Request):
    return await _proxy_to_upstream(request, "/predict_next_attack")


@app.post("/predict/mri")
async def mri_proxy(request: Request):
    return await _proxy_to_upstream(request, "/predict/mri")
