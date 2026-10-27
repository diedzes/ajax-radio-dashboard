import React from 'react'
import './Top5GamesSection.css'
import {
  formatDateWithDay,
  formatNumber,
  shortCompetition,
  RESULT_SHORT,
  RESULT_LABEL,
  RESULT_CLASS
} from '../utils/format'

// "2026/2027" -> "Seizoen 26/27"
const seasonLabel = (season) => {
  const [start, end] = season.split('/')
  return end ? `Seizoen ${start.slice(-2)}/${end.slice(-2)}` : season
}

function Top5GamesSection({ data }) {
  // Nieuwste seizoen bovenaan; nieuwe seizoenen uit de pipeline verschijnen vanzelf.
  const seasons = Object.keys(data || {})
    .filter((season) => Array.isArray(data[season]))
    .sort()
    .reverse()

  if (seasons.length === 0) {
    return (
      <div className="section">
        <h2>Top 5 per seizoen</h2>
        <p>Nog geen data beschikbaar.</p>
      </div>
    )
  }

  const renderSeasonTable = (season, matches) => (
    <div className="season-section" key={season}>
      <h3>{seasonLabel(season)}</h3>
      {matches.length === 0 ? (
        <p className="muted">Nog geen wedstrijden met luistercijfers in dit seizoen.</p>
      ) : (
        <table className="top5-table" id={`top5-${season.replace('/', '-')}-table`}>
          <thead>
            <tr>
              <th>#</th>
              <th>Datum</th>
              <th>Wedstrijd</th>
              <th>Uitslag</th>
              <th>Commentatoren</th>
              <th>Zender</th>
              <th className="num">Luisteraars</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr key={`${match.date}-${match.match_name}`}>
                <td className="rank-cell">{index + 1}</td>
                <td>
                  {formatDateWithDay(match.date)}
                  {match.time ? <span className="cell-sub">{match.time}</span> : null}
                </td>
                <td>
                  <span className="match-name">{match.match_name || '—'}</span>
                  <span className="cell-sub">{shortCompetition(match.competition)}</span>
                </td>
                <td>
                  {match.result ? (
                    <span className={`result-badge ${RESULT_CLASS[match.result] || ''}`} title={RESULT_LABEL[match.result]}>
                      {RESULT_SHORT[match.result] || match.result}
                      {match.score ? <span className="result-score">{match.score}</span> : null}
                    </span>
                  ) : (
                    match.score || '—'
                  )}
                </td>
                <td>{match.commentators || '—'}</td>
                <td>{match.tv_channel || '—'}</td>
                <td className="listeners-cell num">{formatNumber(match.listeners)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="section top5-games-section">
      <h2>Top 5 per seizoen</h2>
      <div className="seasons-container">{seasons.map((season) => renderSeasonTable(season, data[season]))}</div>
    </div>
  )
}

export default Top5GamesSection
