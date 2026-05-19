#!/usr/bin/env bash
# Run from repo:  cd model && bash scripts/setup_vercel_ml.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
fi

echo "==> Compact next-attack bundle (~75MB)"
NEXT_ATTACK_N_EST_REG=50 NEXT_ATTACK_N_EST_BIN=50 NEXT_ATTACK_N_EST_TYPE=80 \
  python -c "import os; os.chdir('text'); from train_next_attack import run_next_attack_pipeline; print(run_next_attack_pipeline())"

if [[ -f image/resnet_brain_model.pt ]]; then
  echo "==> Export MRI ONNX"
  (cd image && python export_onnx.py)
else
  echo "==> Skip MRI ONNX (no image/resnet_brain_model.pt — tabular-only deploy)"
fi

echo "==> Bundle for Vercel (no Blob required)"
python scripts/prepare_vercel_deploy.py

if [[ "${UPLOAD_MODEL_ARTIFACTS_TO_BLOB:-1}" == "1" ]] && grep -qE 'BLOB_READ_WRITE_TOKEN=vercel_blob_rw_' ../client/.env 2>/dev/null; then
  echo "==> Upload to Vercel Blob (private store; token from client/.env)"
  if (cd ../client && node ../model/scripts/publish_vercel_artifacts.mjs); then
    echo "Blob upload OK — paste model/vercel-artifacts.env into painpal-model env vars"
    echo "Also set BLOB_READ_WRITE_TOKEN on painpal-model (same value, no trailing dot)"
  else
    echo "Blob upload failed — deploy still works via bundled_artifacts/ (no Blob needed)"
  fi
else
  echo "==> Skip Blob upload (bundled_artifacts/ is enough for vercel deploy)"
fi

echo ""
echo "Deploy (from LLM repo root, after Vercel fair-use unblock):"
echo "  cd $(dirname "$ROOT") && npx vercel --prod"
echo "Web app env: MODEL_API_URL=https://painpal-model.vercel.app"
