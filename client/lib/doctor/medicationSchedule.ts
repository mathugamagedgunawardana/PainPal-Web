export type MedicationScheduleEntry = {
  name: string
  tablets: number
  time: string
}

/**
 * Validates JSON body medicationSchedule: [{ name, tablets, time }, ...]
 */
export function parseMedicationSchedule(raw: unknown): MedicationScheduleEntry[] | null {
  if (raw == null) return null
  if (!Array.isArray(raw)) return null
  const out: MedicationScheduleEntry[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null
    const r = row as Record<string, unknown>
    const name = typeof r.name === 'string' ? r.name.trim() : ''
    if (!name) return null
    let tablets = 1
    if (typeof r.tablets === 'number' && Number.isFinite(r.tablets) && r.tablets > 0) {
      tablets = Math.min(99, Math.floor(r.tablets))
    }
    const time = typeof r.time === 'string' ? r.time.trim() : ''
    out.push({ name, tablets, time })
  }
  return out
}

export function namesFromSchedule(entries: MedicationScheduleEntry[]): string[] {
  return entries.map((e) => e.name)
}
