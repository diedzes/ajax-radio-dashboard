// Seizoenen lopen van 1 juli t/m 30 juni. Dit is de enige plek in de app waar dat staat.
// (De pipeline heeft dezelfde regel in analyze_matchdays.py: season_for_date / season_date_range.)

export const ALL_SEASONS = 'all'

// "2026-10-25" -> "2026/2027"
export const seasonForDate = (iso) => {
  if (!iso) return null
  const year = Number(String(iso).slice(0, 4))
  const month = Number(String(iso).slice(5, 7))
  if (!year || !month) return null
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

// "2026/2027" -> { start: "2026-07-01", end: "2027-06-30" }
export const seasonRange = (season) => {
  const [startYear, endYear] = String(season).split('/')
  return { start: `${startYear}-07-01`, end: `${endYear}-06-30` }
}

// "2026/2027" -> "26/27"
export const seasonShort = (season) => {
  if (season === ALL_SEASONS) return 'Alle seizoenen'
  const [startYear, endYear] = String(season).split('/')
  return `${startYear.slice(-2)}/${endYear.slice(-2)}`
}

export const currentSeason = () => seasonForDate(new Date().toISOString().slice(0, 10))

// Werkt voor ISO-datums ("2026-10-25"), tijdstempels en maanden ("2026-10").
export const isInSeason = (dateLike, season) => {
  if (season === ALL_SEASONS) return true
  if (!dateLike) return false
  const value = String(dateLike).slice(0, 10)
  const { start, end } = seasonRange(season)
  return value >= start.slice(0, value.length) && value <= end.slice(0, value.length)
}

// Alle seizoenen die in de data voorkomen plus het huidige, nieuwste eerst.
export const seasonsInData = (dates) => {
  const seasons = new Set([currentSeason()])
  dates.forEach((date) => {
    const season = seasonForDate(date)
    if (season) seasons.add(season)
  })
  return [...seasons].sort().reverse()
}
