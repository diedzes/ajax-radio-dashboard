import React, { useEffect, useState } from 'react'
import './EngagementSection.css'

function EngagementSection() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => setMatches(json.matches || []))
      .catch(() => setMatches([]))
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (matches === null) {
    return (
      <div className="section engagement-section">
        <h2>Beste Doorluisterwaarde</h2>
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
        <h2>Beste Doorluisterwaarde</h2>
        <p className="section-subtitle">% luisteraars dat minstens 5 seconden bleef hangen (pre-roll simulatie)</p>
        <p>Nog geen wedstrijden met CDN-detaildata verwerkt.</p>
      </div>
    )
  }

  return (
    <div className="section engagement-section">
      <h2>Beste Doorluisterwaarde</h2>
      <p className="section-subtitle">% luisteraars dat minstens 5 seconden bleef hangen (pre-roll simulatie) - hoe hoger, hoe minder "wegklikkers"</p>
      <table className="engagement-table">
        <thead>
          <tr>
            <th>Rank</th>
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
              <td>{m.match_name || 'N/A'}</td>
              <td className="completion-cell">{m.preroll.completion}%</td>
              <td>{m.preroll.bereikPct}% ({m.preroll.bereik?.toLocaleString()})</td>
              <td>{m.listeners ? m.listeners.toLocaleString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EngagementSection
