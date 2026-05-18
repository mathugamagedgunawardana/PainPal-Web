import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  fetchNextAttackPredictionWithReason,
  migraineEventsToModelRecords,
  type MigraineEventDbInput,
  type ModelRecord,
  type PatientNextAttackDto,
} from '@/lib/model/migraineModelRecords'
import {
  enrichPatientNextAttackDto,
  historyTypesFromModelRecords,
} from '@/lib/model/nextAttackPresentation'
import { tryGetModelApiBaseUrl } from '@/lib/env/modelApiUrl'

export type PatientEventSnapshot = {
  latestEventAt: Date | null
  eventCount: number
}

export async function getPatientEventSnapshot(patientId: string): Promise<PatientEventSnapshot> {
  const [latest, eventCount] = await Promise.all([
    prisma.migraineEvent.findFirst({
      where: { patientId },
      orderBy: { startDatetime: 'desc' },
      select: { startDatetime: true },
    }),
    prisma.migraineEvent.count({ where: { patientId } }),
  ])
  return {
    latestEventAt: latest?.startDatetime ?? null,
    eventCount,
  }
}

function snapshotMatches(
  cache: { latestEventAt: Date | null; eventCount: number },
  snap: PatientEventSnapshot,
): boolean {
  const cacheTs = cache.latestEventAt?.getTime() ?? null
  const snapTs = snap.latestEventAt?.getTime() ?? null
  return cache.eventCount === snap.eventCount && cacheTs === snapTs
}

export type CachedNextAttackResult = {
  dto: PatientNextAttackDto | null
  unavailableReason: string | null
  fromCache: boolean
}

/** Next-attack forecast with DB cache; set refresh=true to force model call. */
export async function getCachedNextAttack(params: {
  patientId: string
  patientDob: Date
  events: MigraineEventDbInput[]
  refresh?: boolean
}): Promise<CachedNextAttackResult> {
  const { patientId, patientDob, events, refresh = false } = params
  const records = migraineEventsToModelRecords(events, patientDob)

  if (records.length === 0) {
    return {
      dto: null,
      unavailableReason: 'No episodes available to forecast from.',
      fromCache: false,
    }
  }

  const snap = await getPatientEventSnapshot(patientId)
  const existing = await prisma.patientModelCache.findUnique({ where: { patientId } })

  if (
    !refresh &&
    existing?.nextAttack &&
    existing.nextAttackAt &&
    snapshotMatches(existing, snap)
  ) {
    const cached = existing.nextAttack as PatientNextAttackDto
    return {
      dto: enrichPatientNextAttackDto(cached, {
        historyTypes: historyTypesFromModelRecords(records),
      }),
      unavailableReason: null,
      fromCache: true,
    }
  }

  const result = await fetchNextAttackPredictionWithReason(records)
  const dto = result.dto
    ? enrichPatientNextAttackDto(result.dto, {
        historyTypes: historyTypesFromModelRecords(records),
      })
    : null

  if (dto) {
    await prisma.patientModelCache.upsert({
      where: { patientId },
      create: {
        patientId,
        nextAttack: dto as unknown as Prisma.InputJsonValue,
        nextAttackAt: new Date(),
        latestEventAt: snap.latestEventAt,
        eventCount: snap.eventCount,
      },
      update: {
        nextAttack: dto as unknown as Prisma.InputJsonValue,
        nextAttackAt: new Date(),
        latestEventAt: snap.latestEventAt,
        eventCount: snap.eventCount,
      },
    })
  }

  return {
    dto,
    unavailableReason: result.unavailableReason,
    fromCache: false,
  }
}

type ModelPredictResponse = {
  predicted_type: string[]
  probabilities?: Array<Record<string, number>>
}

/** Type distribution from cache or live /predict (refresh only). */
export async function getCachedTypeDistribution(params: {
  patientId: string
  records: ModelRecord[]
  refresh?: boolean
}): Promise<{ typeCounts: Map<string, { scoreSum: number; count: number }>; fromCache: boolean }> {
  const { patientId, records, refresh = false } = params
  const snap = await getPatientEventSnapshot(patientId)
  const existing = await prisma.patientModelCache.findUnique({ where: { patientId } })

  if (
    !refresh &&
    existing?.typeDistribution &&
    existing.typeDistributionAt &&
    snapshotMatches(existing, snap)
  ) {
    const raw = existing.typeDistribution as Record<string, { scoreSum: number; count: number }>
    return { typeCounts: new Map(Object.entries(raw)), fromCache: true }
  }

  const modelBaseUrl = tryGetModelApiBaseUrl()
  if (!modelBaseUrl || records.length === 0) {
    return { typeCounts: new Map(), fromCache: false }
  }

  const resp = await fetch(`${modelBaseUrl}/predict`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ records }),
  })

  if (!resp.ok) {
    return { typeCounts: new Map(), fromCache: false }
  }

  const prediction = (await resp.json()) as ModelPredictResponse
  const typeCounts = new Map<string, { scoreSum: number; count: number }>()

  for (let i = 0; i < prediction.predicted_type.length; i++) {
    const raw = prediction.predicted_type[i]
    const key = raw?.trim().toLowerCase().replace(/[_-]+/g, ' ') ?? ''
    if (!key) continue
    let score = 1
    const probObj = prediction.probabilities?.[i]
    if (probObj) {
      const direct = probObj[raw] ?? probObj[Object.keys(probObj)[0] ?? '']
      if (typeof direct === 'number') score = direct
    }
    const cur = typeCounts.get(key) ?? { scoreSum: 0, count: 0 }
    cur.scoreSum += score
    cur.count += 1
    typeCounts.set(key, cur)
  }

  const serialized = Object.fromEntries(typeCounts)
  await prisma.patientModelCache.upsert({
    where: { patientId },
    create: {
      patientId,
      typeDistribution: serialized as Prisma.InputJsonValue,
      typeDistributionAt: new Date(),
      latestEventAt: snap.latestEventAt,
      eventCount: snap.eventCount,
    },
    update: {
      typeDistribution: serialized as Prisma.InputJsonValue,
      typeDistributionAt: new Date(),
      latestEventAt: snap.latestEventAt,
      eventCount: snap.eventCount,
    },
  })

  return { typeCounts, fromCache: false }
}
