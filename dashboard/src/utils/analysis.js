// Analyses per seizoen, berekend in de browser uit all_matches.json.
// Zelfde regels als analyze_matchdays.py, zodat "alle seizoenen" dezelfde cijfers geeft als de pipeline.

import { seasonForDate } from './season'

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
const round2 = (value) => Math.round(value * 100) / 100

// Python: int(statistics.median(values))
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  return Math.trunc(value)
}

const withListeners = (matches) => matches.filter((match) => match.listeners !== null && match.listeners !== undefined)

// Groepeert op een sleutel en geeft per groep aantal, gemiddelde, mediaan, laagste en hoogste.
const groupStats = (matches, keyFn, keyName) => {
  const groups = new Map()
  withListeners(matches).forEach((match) => {
    const key = keyFn(match)
    if (!key) return
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(match.listeners)
  })
  return [...groups.entries()].map(([key, values]) => ({
    [keyName]: key,
    matches_count: values.length,
    avg: round2(mean(values)),
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values)
  }))
}

const byOrder = (order, keyName) => (a, b) => {
  const indexA = order.indexOf(a[keyName])
  const indexB = order.indexOf(b[keyName])
  return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
}

export const categorizeTvChannel = (channel) => {
  if (!channel) return null
  const upper = channel.trim().toUpperCase()
  if (upper.includes('ZIGGO')) return 'Half-open'
  const noSpace = upper.replace(/ /g, '')
  if (upper.startsWith('ESPN') && (noSpace === 'ESPN' || noSpace === 'ESPN1')) return 'Open'
  return 'Paid'
}

const kickoffBlock = (time) => {
  const parts = String(time || '').split(':')
  if (parts.length !== 2) return null
  const hours = Number.parseInt(parts[0], 10)
  const minutes = Number.parseInt(parts[1], 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const total = hours * 60 + minutes
  if (total >= 12 * 60 && total < 15 * 60) return '12:00-14:59'
  if (total >= 15 * 60 && total < 18 * 60) return '15:00-17:59'
  if (total >= 18 * 60 && total < 20 * 60) return '18:00-19:59'
  if (total >= 20 * 60 && total < 21 * 60) return '20:00-20:59'
  if (total >= 21 * 60) return '21:00+'
  return 'Other'
}

const homeAway = (value) => {
  const lower = String(value || '').toLowerCase()
  if (lower === 'thuis' || lower === 'home') return 'Thuis'
  if (lower === 'uit' || lower === 'away') return 'Uit'
  return null
}

// all_matches bevat "Naam & Naam" in agendavolgorde; duo's zijn op naam gesorteerd.
const duoKey = (commentators) => {
  const names = String(commentators || '')
    .split(' & ')
    .map((name) => name.trim())
    .filter(Boolean)
  if (names.length !== 2 || names.includes('N/A')) return null
  return [...names].sort().join(' & ')
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const analyzeMatches = (matches) => ({
  byResult: {
    results: groupStats(matches, (m) => (['W', 'D', 'L'].includes(m.result) ? m.result : null), 'result').sort(
      byOrder(['W', 'D', 'L'], 'result')
    )
  },
  byHomeAway: {
    home_away: groupStats(matches, (m) => homeAway(m.home_away), 'home_away').sort(byOrder(['Thuis', 'Uit'], 'home_away'))
  },
  byTVCategory: {
    categories: groupStats(matches, (m) => categorizeTvChannel(m.tv_channel), 'category').sort(
      byOrder(['Half-open', 'Open', 'Paid'], 'category')
    )
  },
  kickoffBlocks: groupStats(matches, (m) => kickoffBlock(m.time), 'kickoff_block').sort((a, b) => b.avg - a.avg),
  weekday: groupStats(matches, (m) => (WEEKDAYS.includes(m.weekday) ? m.weekday : null), 'weekday').sort(
    byOrder(WEEKDAYS, 'weekday')
  ),
  commentatorDuos: {
    duos: groupStats(matches, (m) => duoKey(m.commentators), 'duo')
      .map(({ min, ...rest }) => rest)
      .sort((a, b) => b.avg - a.avg)
  }
})

// Top 5 per seizoen: { "2026/2027": [...], "2025/2026": [...] }
export const top5BySeason = (matches) => {
  const bySeason = {}
  withListeners(matches).forEach((match) => {
    const season = seasonForDate(match.date)
    if (!season || season < '2024/2025') return
    if (!bySeason[season]) bySeason[season] = []
    bySeason[season].push(match)
  })
  Object.keys(bySeason).forEach((season) => {
    bySeason[season] = bySeason[season].sort((a, b) => b.listeners - a.listeners).slice(0, 5)
  })
  return bySeason
}
