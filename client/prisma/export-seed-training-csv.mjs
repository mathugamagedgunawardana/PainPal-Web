/**
 * Export one consolidated CSV matching what prisma/seed.ts loads into MigraineEvent
 * (diversified rows + derived severity, duration text, triggers, symptoms).
 *
 * Run from client/:  npm run export:seed-csv
 * Output default: prisma/seed_migraine_training_export.csv
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PATIENTS = [
  { patientNumber: 1, email: 'sarah.chen@email.com', name: 'Sarah Chen' },
  { patientNumber: 2, email: 'john.doe@email.com', name: 'John Doe' },
  { patientNumber: 3, email: 'emily.smith@email.com', name: 'Emily Smith' },
  { patientNumber: 4, email: 'michael.j@email.com', name: 'Michael Johnson' },
]

function withRowOverrides(row, overrides) {
  const next = { ...row }
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string') next[key] = value
  }
  return next
}

function diversifiedRowForSeedPatient(patientNumber, row, rowIndex) {
  const alternating = rowIndex % 2 === 0 ? '1' : '0'
  switch (patientNumber) {
    case 1:
      return withRowOverrides(row, {
        Visual: '1',
        Sensory: '1',
        Dysphasia: alternating,
        Phonophobia: '1',
        Photophobia: '1',
        Vertigo: '0',
        Tinnitus: '0',
        Type: 'Migraine with aura',
      })
    case 2:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '1',
        Tinnitus: '1',
        Hypoacusis: alternating,
        Diplopia: alternating,
        Defect: '0',
        Type: 'Vestibular migraine',
      })
    case 3:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '0',
        Tinnitus: '0',
        Nausea: '1',
        Vomit: alternating,
        Frequency: '1',
        Type: 'Menstrual migraine',
      })
    case 4:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '0',
        Tinnitus: '0',
        Nausea: '1',
        Photophobia: '1',
        Phonophobia: '1',
        Frequency: '1',
        Duration: '1',
        Type: 'Chronic migraine',
      })
    default:
      return row
  }
}

function toInt(v) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function readCsvRows(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim()
  if (!raw) return []
  const lines = raw.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row
  })
}

function buildSymptomsAndTriggers(row) {
  const symptomSignals = [
    ['Nausea', 'Nausea'],
    ['Vomit', 'Vomiting'],
    ['Phonophobia', 'Phonophobia'],
    ['Photophobia', 'Photophobia'],
    ['Visual', 'Visual aura'],
    ['Sensory', 'Sensory aura'],
    ['Dysphasia', 'Speech difficulty'],
    ['Dysarthria', 'Slurred speech'],
    ['Vertigo', 'Vertigo'],
    ['Tinnitus', 'Tinnitus'],
    ['Hypoacusis', 'Hearing changes'],
    ['Diplopia', 'Double vision'],
    ['Defect', 'Visual field defect'],
    ['Ataxia', 'Loss of balance'],
    ['Conscience', 'Consciousness changes'],
    ['Paresthesia', 'Paresthesia'],
  ]
  const detectedSymptoms = symptomSignals.filter(([key]) => toInt(row[key]) > 0).map(([, label]) => label)
  const triggers = []
  if (toInt(row.Frequency) > 0) triggers.push('Stress')
  if (toInt(row.Duration) > 0) triggers.push('Sleep disruption')
  if (toInt(row.Photophobia) > 0) triggers.push('Bright lights')
  if (toInt(row.Phonophobia) > 0) triggers.push('Loud noise')
  if (toInt(row.Vertigo) > 0) triggers.push('Motion')
  if (toInt(row.DPF) > 0) triggers.push('Dietary pattern')
  return { detectedSymptoms, triggers: [...new Set(triggers)] }
}

function deriveSeverity(row) {
  const intensity = toInt(row.Intensity)
  const frequency = toInt(row.Frequency)
  const auraCount = ['Visual', 'Sensory', 'Dysphasia', 'Vertigo'].reduce((acc, key) => acc + toInt(row[key]), 0)
  const raw = 3 + intensity * 4 + frequency * 2 + Math.min(2, auraCount)
  return Math.max(1, Math.min(10, raw))
}

function deriveDurationText(row) {
  return toInt(row.Duration) > 0 ? '6 hours' : '2 hours'
}

function deriveEffectiveness(row) {
  const intensity = toInt(row.Intensity)
  const frequency = toInt(row.Frequency)
  if (intensity === 1 && frequency === 1) return 'LOW'
  if (intensity === 0 && frequency === 0) return 'HIGH'
  return 'MODERATE'
}

function csvCell(v) {
  const s = v == null ? '' : String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function main() {
  const trainingDataDir = path.resolve(__dirname, '..', '..', 'model', 'text', 'Data', 'traningData')
  const outArg = process.argv[2]
  const outPath = outArg
    ? path.resolve(process.cwd(), outArg)
    : path.join(__dirname, 'seed_migraine_training_export.csv')

  if (!fs.existsSync(trainingDataDir)) {
    console.error('Training data directory not found:', trainingDataDir)
    process.exit(1)
  }

  const allRows = []
  for (const p of PATIENTS) {
    const csvPath = path.join(trainingDataDir, `patient_${p.patientNumber}_migraine_attacks.csv`)
    if (!fs.existsSync(csvPath)) {
      console.warn('Missing:', csvPath)
      continue
    }
    const rows = readCsvRows(csvPath)
    for (let i = 0; i < rows.length; i++) {
      const row = diversifiedRowForSeedPatient(p.patientNumber, rows[i], i)
      const { detectedSymptoms, triggers } = buildSymptomsAndTriggers(row)
      allRows.push({
        seed_patient_number: String(p.patientNumber),
        seed_patient_email: p.email,
        seed_patient_name: p.name,
        ...row,
        derived_severity: String(deriveSeverity(row)),
        derived_duration_display: deriveDurationText(row),
        derived_perceived_triggers: triggers.join('|'),
        derived_detected_symptoms: detectedSymptoms.join('|'),
        derived_effectiveness: deriveEffectiveness(row),
      })
    }
  }

  if (allRows.length === 0) {
    console.error('No rows exported.')
    process.exit(1)
  }

  const headers = Object.keys(allRows[0])
  const lines = [headers.join(',')]
  for (const obj of allRows) {
    lines.push(headers.map((h) => csvCell(obj[h])).join(','))
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log('Wrote', allRows.length, 'rows to', outPath)
}

main()
