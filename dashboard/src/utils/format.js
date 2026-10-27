// Gedeelde weergave-helpers, zodat datums, getallen en uitslagen overal hetzelfde ogen.

const parseIsoDate = (iso) => {
  if (!iso) return null
  const date = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

// "25 okt 2026"
export const formatDate = (iso) => {
  const date = parseIsoDate(iso)
  return date ? date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

// "zo 25 okt 2026"
export const formatDateWithDay = (iso) => {
  const date = parseIsoDate(iso)
  return date
    ? date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
}

// "okt 2026" voor maanden als "2026-10"
export const formatMonth = (yearMonth) => {
  const date = parseIsoDate(`${yearMonth}-15`)
  return date ? date.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }) : '—'
}

export const formatNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? '—'
    : Math.round(Number(value)).toLocaleString('nl-NL')

export const formatEuro = (value) =>
  value
    ? new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    : '—'

// Data gebruikt W/D/L; we tonen Winst/Gelijk/Verlies als W/G/V.
export const RESULT_SHORT = { W: 'W', D: 'G', L: 'V' }
export const RESULT_LABEL = { W: 'Winst', D: 'Gelijk', L: 'Verlies' }
export const RESULT_CLASS = { W: 'result-win', D: 'result-draw', L: 'result-loss' }

export const WEEKDAY_NL = {
  Monday: 'Maandag',
  Tuesday: 'Dinsdag',
  Wednesday: 'Woensdag',
  Thursday: 'Donderdag',
  Friday: 'Vrijdag',
  Saturday: 'Zaterdag',
  Sunday: 'Zondag'
}

export const shortCompetition = (name) =>
  (name || '')
    .replace(/^(VriendenLoterij|Eurojackpot|Toto) /, '')
    .replace(/^UEFA /, '')
    .replace('Vriendschappelijke wedstrijd', 'Vriendschappelijk')
    .trim()
