#!/usr/bin/env bash
# Production server for model/main.py (analogous to `npm run start` in Next.js).
# Requires: pip install -r requirements-ml.txt (from model/)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

export MODEL_API_ENV="${MODEL_API_ENV:-production}"
export MODEL_SERVER_HOST="${MODEL_SERVER_HOST:-0.0.0.0}"
export MODEL_SERVER_PORT="${MODEL_SERVER_PORT:-${PORT:-8000}}"

WORKERS="${MODEL_API_WORKERS:-1}"
LOG_LEVEL="${MODEL_API_LOG_LEVEL:-info}"
LOG_LEVEL="$(echo "$LOG_LEVEL" | tr '[:upper:]' '[:lower:]')"

echo "PainPal model API (production)"
echo "  host=$MODEL_SERVER_HOST port=$MODEL_SERVER_PORT workers=$WORKERS env=$MODEL_API_ENV"

exec uvicorn main:app \
  --host "$MODEL_SERVER_HOST" \
  --port "$MODEL_SERVER_PORT" \
  --workers "$WORKERS" \
  --log-level "$LOG_LEVEL" \
  --no-access-log \
  --proxy-headers \
  --forwarded-allow-ips="${MODEL_FORWARDED_ALLOW_IPS:-*}"
