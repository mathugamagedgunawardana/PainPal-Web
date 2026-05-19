#!/usr/bin/env node
/**
 * Upload model artifacts to Vercel Blob (uses @vercel/blob from client/).
 *
 *   cd model && node scripts/publish_vercel_artifacts.mjs
 */
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const MODEL_ROOT = join(__dirname, '..')
const CLIENT_ROOT = join(MODEL_ROOT, '..', 'client')
const CLIENT_ENV = join(CLIENT_ROOT, '.env')
const { put } = await import(join(CLIENT_ROOT, 'node_modules/@vercel/blob/dist/index.js'))

function normalizeToken(raw) {
  let token = raw.trim().replace(/^["']|["']$/g, '')
  while (token.endsWith('.')) token = token.slice(0, -1)
  return token
}

function loadToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return normalizeToken(process.env.BLOB_READ_WRITE_TOKEN)
  }
  if (!existsSync(CLIENT_ENV)) {
    throw new Error('Set BLOB_READ_WRITE_TOKEN or add it to client/.env')
  }
  for (const line of readFileSync(CLIENT_ENV, 'utf8').split('\n')) {
    const m = line.match(/^\s*BLOB_READ_WRITE_TOKEN=(.+)$/)
    if (m) return normalizeToken(m[1])
  }
  throw new Error('BLOB_READ_WRITE_TOKEN not found in client/.env')
}

async function probeToken(token) {
  const data = Buffer.from('ok')
  const blob = await put('ml-artifacts/_token_probe.txt', data, {
    access: 'private',
    token,
    allowOverwrite: true,
  })
  return blob
}

const FILES = [
  ['text/xgboost_patient_model.pkl', 'text/xgboost_patient_model.pkl'],
  ['text/label_encoder.pkl', 'text/label_encoder.pkl'],
  ['text/artifacts/feature_columns.joblib', 'text/artifacts/feature_columns.joblib'],
  ['text/artifacts/num_imputer.joblib', 'text/artifacts/num_imputer.joblib'],
  ['text/artifacts/model_class_ids.joblib', 'text/artifacts/model_class_ids.joblib'],
  ['text/artifacts/next_attack_bundle.joblib', 'text/artifacts/next_attack_bundle.joblib'],
  ['image/artifacts/class_names.json', 'image/artifacts/class_names.json'],
  ['image/artifacts/transforms_config.json', 'image/artifacts/transforms_config.json'],
]

const token = loadToken()
console.log('Validating BLOB_READ_WRITE_TOKEN (private store)...')
await probeToken(token)

const manifest = {}
const missing = []

for (const [rel, relPath] of FILES) {
  const local = join(MODEL_ROOT, relPath)
  if (!existsSync(local)) {
    missing.push(rel)
    continue
  }
  const data = readFileSync(local)
  const sizeMb = (data.length / (1024 * 1024)).toFixed(1)
  const pathname = `ml-artifacts/${rel.replace(/\//g, '_')}`
  console.log(`Uploading ${rel} (${sizeMb} MB)...`)
  const blob = await put(pathname, data, {
    access: 'private',
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  manifest[rel] = blob.downloadUrl || blob.url
}

if (missing.length) {
  console.error('\nSkipped (not found):', missing.join(', '))
}
if (!Object.keys(manifest).length) {
  throw new Error('No files uploaded')
}

const manifestLine =
  'MODEL_ARTIFACTS_JSON=' + JSON.stringify(manifest)
const out = join(MODEL_ROOT, 'vercel-artifacts.env')
writeFileSync(
  out,
  manifestLine +
    '\nMODEL_USE_ONNX=true\nMODEL_API_ENV=production\nALLOW_PIPELINE_ROUTES=false\n# Also set BLOB_READ_WRITE_TOKEN on painpal-model (same token) for private artifact downloads\n',
  'utf8',
)

console.log('\n--- Add to painpal-model Vercel project ---\n')
console.log(manifestLine)
console.log('\nMODEL_USE_ONNX=true')
console.log('MODEL_API_ENV=production')
console.log('ALLOW_PIPELINE_ROUTES=false')
console.log(`\n(Wrote ${out})`)
