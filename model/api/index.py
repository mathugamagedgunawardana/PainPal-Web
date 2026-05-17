"""Lightweight Vercel entrypoint for the model service.

The real ML server in `main.py` imports heavy dependencies such as PyTorch,
XGBoost, pandas, and scikit-learn. Those exceed Vercel's Python Lambda storage
limit, so this Vercel app only exposes health/status endpoints and returns a
clear 503 for model inference routes.

Deploy the full `main.py` service on a Python host with larger storage/runtime
limits (Render, Railway, Fly.io, a VPS, etc.) for real predictions.
"""

from fastapi import FastAPI, HTTPException

app = FastAPI(title="PainPal model API status")


@app.get("/")
def root():
    return {
        "service": "painpal-model-api",
        "status": "vercel-status-only",
        "message": (
            "This Vercel deployment is lightweight. Full ML inference requires "
            "deploying model/main.py on a Python host that supports ML packages."
        ),
        "health": "/api/health",
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "status": "vercel-status-only",
        "model_runtime": "not-loaded-on-vercel",
    }


@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "painpal-model-api", "runtime": "vercel-status-only"}


@app.post("/predict")
def predict_unavailable():
    raise HTTPException(
        status_code=503,
        detail="Deploy model/main.py on Render/Railway/Fly.io/VPS for XGBoost inference.",
    )


@app.post("/predict/next-attack")
def next_attack_unavailable():
    raise HTTPException(
        status_code=503,
        detail="Deploy model/main.py on Render/Railway/Fly.io/VPS for next-attack inference.",
    )


@app.post("/predict_next_attack")
def next_attack_alias_unavailable():
    return next_attack_unavailable()


@app.post("/predict/mri")
def mri_unavailable():
    raise HTTPException(
        status_code=503,
        detail="Deploy model/main.py on a host that supports PyTorch for MRI inference.",
    )
