export type EventLike = { startDatetime: Date; severity: number }

export function computeMigraineStats(events: EventLike[]) {
  if (!events.length) {
    return { recentEpisodes: 0, migraineDays: 0, riskLevel: 'low' as const }
  }

  const latestEventDate = new Date(
    Math.max(...events.map((e) => new Date(e.startDatetime).getTime()))
  )
  const rollingStart = new Date(latestEventDate)
  rollingStart.setDate(rollingStart.getDate() - 30)

  const recentWindow = events.filter((e) => {
    const ts = new Date(e.startDatetime).getTime()
    return ts >= rollingStart.getTime() && ts <= latestEventDate.getTime()
  })

  const migraineDaySet = new Set(
    recentWindow
      .filter((e) => {
        const d = new Date(e.startDatetime)
        return (
          d.getUTCFullYear() === latestEventDate.getUTCFullYear() &&
          d.getUTCMonth() === latestEventDate.getUTCMonth()
        )
      })
      .map((e) => new Date(e.startDatetime).toISOString().slice(0, 10))
  )

  const avgSeverity =
    recentWindow.length > 0
      ? recentWindow.reduce((sum, e) => sum + (e.severity ?? 0), 0) / recentWindow.length
      : 0

  const riskLevel =
    recentWindow.length >= 8 || avgSeverity >= 7
      ? ('high' as const)
      : recentWindow.length >= 4 || avgSeverity >= 5
        ? ('medium' as const)
        : ('low' as const)

  return {
    recentEpisodes: recentWindow.length,
    migraineDays: migraineDaySet.size,
    riskLevel,
  }
}
