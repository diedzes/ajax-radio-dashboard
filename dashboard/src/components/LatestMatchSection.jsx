import React, { useEffect, useMemo, useState } from 'react'
import MatchDetailModal from './MatchDetailModal'
import { formatDateWithDay, formatNumber, shortCompetition, RESULT_LABEL } from '../utils/format'
import { seasonForDate, seasonShort } from '../utils/season'
import './LatestMatchSection.css'

const RESULT_TONE = { W: 'win', D: 'draw', L: 'loss' }

const percentDiff = (value, base) => (base ? ((value - base) / base) * 100 : null)

const formatDiff = (pct) => {
  const rounded = Math.round(pct)
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

// Laatste gespeelde wedstrijd met luistercijfer, los van de seizoenkiezer.
function LatestMatchSection({ matches, recentPredictions }) {
  const [detail, setDetail] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const latest = useMemo(
    () =>
      (matches || [])
        .filter((match) => match.listeners)
        .reduce((last, match) => (!last || match.date > last.date ? match : last), null),
    [matches]
  )

  useEffect(() => {
    if (!latest) return
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => setDetail((json.matches || []).find((m) => m.date === latest.date) || null))
      .catch(() => setDetail(null))
  }, [latest?.date])

  if (!latest) return null

  const season = seasonForDate(latest.date)
  const seasonMatches = (matches || []).filter((m) => m.listeners && seasonForDate(m.date) === season)
  const others = seasonMatches.filter((m) => m !== latest)
  const seasonAverage = others.length ? others.reduce((sum, m) => sum + m.listeners, 0) / others.length : null
  const rank = [...seasonMatches].sort((a, b) => b.listeners - a.listeners).indexOf(latest) + 1

  const prediction = (recentPredictions?.matches || []).find(
    (m) => m.date === latest.date && m.predicted_listeners
  )?.predicted_listeners

  const vsAverage = percentDiff(latest.listeners, seasonAverage)
  const vsPrediction = percentDiff(latest.listeners, prediction)
  const nlShare = detail?.geo?.labels?.indexOf('Nederland')

  const meta = [formatDateWithDay(latest.date), shortCompetition(latest.competition), latest.tv_channel]
    .filter(Boolean)
    .join(' · ')

  const stats = [
    vsAverage !== null && {
      label: `T.o.v. gemiddelde ${seasonShort(season)}`,
      value: formatDiff(vsAverage),
      tone: vsAverage >= 0 ? 'up' : 'down',
      sub: `gem. ${formatNumber(seasonAverage)}`
    },
    prediction && {
      label: 'T.o.v. voorspelling',
      value: formatDiff(vsPrediction),
      tone: vsPrediction >= 0 ? 'up' : 'down',
      sub: `voorspeld ${formatNumber(prediction)}`
    },
    {
      label: `Plek in ${seasonShort(season)}`,
      value: `#${rank}`,
      sub: `van ${seasonMatches.length} wedstrijden`
    },
    detail?.peakValue && {
      label: 'Piek tegelijk',
      value: formatNumber(detail.peakValue),
      sub: detail.peakHour ? `om ${detail.peakHour.replace(/u$/, '')}` : null
    },
    detail?.preroll?.bereik && {
      label: 'Pre-roll bereik',
      value: formatNumber(detail.preroll.bereik),
      sub: nlShare >= 0 ? `${Math.round(detail.geo.values[nlShare])}% uit Nederland` : null
    }
  ].filter(Boolean)

  return (
    <div className="latest-match">
      <div className="latest-match-main">
        <div className="latest-match-kicker">Laatste wedstrijd</div>
        <h2 className="latest-match-title">
          {latest.match_name}
          {latest.score ? (
            <span className={`latest-match-score latest-match-score-${RESULT_TONE[latest.result] || 'none'}`}
              title={RESULT_LABEL[latest.result] || undefined}>
              {latest.score}
            </span>
          ) : null}
        </h2>
        <div className="latest-match-meta">{meta}</div>
        <div className="latest-match-value">{formatNumber(latest.listeners)}</div>
        <div className="latest-match-unit">luisteraars</div>
        {detail ? (
          <button type="button" className="latest-match-button" onClick={() => setShowModal(true)}>
            Bekijk details
          </button>
        ) : null}
      </div>

      <dl className="latest-match-stats">
        {stats.map((stat) => (
          <div className="latest-match-stat" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd className={stat.tone ? `latest-match-${stat.tone}` : undefined}>{stat.value}</dd>
            {stat.sub ? <div className="latest-match-stat-sub">{stat.sub}</div> : null}
          </div>
        ))}
      </dl>

      {showModal ? (
        <MatchDetailModal date={latest.date} matchName={latest.match_name} onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  )
}

export default LatestMatchSection
