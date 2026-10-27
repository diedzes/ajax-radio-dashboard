import React, { useEffect, useState } from 'react'
import './EngagementSection.css'
import { formatDate, formatNumber } from '../utils/format'
import { ALL_SEASONS, isInSeason } from '../utils/season'

function EngagementSection({ season = ALL_SEASONS }) {
  const [allMatches, setAllMatches] = useState(null)

  useEffect(() => {
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => setAllMatches(json.matches || []))
      .catch(() => setAllMatches([]))
  }, [])

  const matches = allMatches === null ? null : allMatches.filter((m) => isInSeason(m.date, season))

  if (matches === null) {
    return (
      <div className="section engagement-section">
        <h2>Beste doorluisterwaarde</h2>
        <p>Laden...</p>
      </div>
    )
  }

  const ranked = matches
    .filter((m) => m.preroll && typeof m.preroll.completion === 'number')
    .sort((a, b) => b.preroll.completion - a.preroll.completion)
    .slice(0, 10)

  if (ranked.length === 0) {
    return (
      <div className="section engagement-section">
        <h2>Beste doorluisterwaarde</h2>
        <p className="section-subtitle">% luisteraars dat minstens 5 seconden bleef hangen (pre-roll simulatie)</p>
        <p>Geen wedstrijden met streamingdata in deze selectie.</p>
      </div>
    )
  }

  return (
    <div className="section engagement-section">
      <h2>Beste doorluisterwaarde</h2>
      <p className="section-subtitle">Top 10: % luisteraars dat minstens 5 seconden bleef hangen (pre-roll simulatie). Hoe hoger, hoe minder wegklikkers.</p>
      <table className="engagement-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Datum</th>
            <th>Wedstrijd</th>
            <th>Doorluisterwaarde</th>
            <th>Bereik</th>
            <th>Luisteraars</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((m, i) => (
            <tr key={m.date}>
              <td className="rank-cell">{i + 1}</td>
              <td>{formatDate(m.date)}</td>
              <td>{m.match_name || '—'}</td>
              <td className="completion-cell">{m.preroll.completion}%</td>
              <td>{m.preroll.bereikPct}% ({formatNumber(m.preroll.bereik)})</td>
              <td>{formatNumber(m.listeners)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EngagementSection
