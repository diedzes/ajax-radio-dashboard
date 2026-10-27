import React, { useState, useMemo, useEffect } from 'react'
import MatchDetailModal from './MatchDetailModal'
import {
  formatDateWithDay,
  formatNumber,
  formatEuro,
  shortCompetition,
  RESULT_SHORT,
  RESULT_LABEL,
  RESULT_CLASS
} from '../utils/format'
import './AllMatchesOverview.css'

function AllMatchesOverview({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [detailByDate, setDetailByDate] = useState({})
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => {
        const byDate = {}
        for (const m of json.matches || []) {
          byDate[m.date] = m
        }
        setDetailByDate(byDate)
      })
      .catch(() => setDetailByDate({}))
  }, [])

  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="section">
        <h2>Alle wedstrijden</h2>
        <p>Nog geen wedstrijddata beschikbaar.</p>
      </div>
    )
  }

  // Media value: gebaseerd op advertentie-bereik (aantal luisteraars dat lang
  // genoeg luisterde om een pre-roll te kwalificeren) als we die data hebben
  // voor deze wedstrijd. Anders valt terug op het ruwe dagcijfer, net als
  // voorheen voor wedstrijden zonder CDN-detaildata.
  const calculateMediaValue = (match) => {
    const detail = detailByDate[match.date]
    const base = detail?.preroll?.bereik ?? match.listeners
    if (!base) return 0
    return (base / 1000) * 25
  }

  const handleSort = (key) => {
    // Getallen en datum eerst van hoog naar laag, tekst eerst A-Z.
    const numeric = ['date', 'listeners', 'mediaValue'].includes(key)
    let direction = numeric ? 'desc' : 'asc'
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }
    setSortConfig({ key, direction })
  }

  const sortedMatches = useMemo(() => {
    const sorted = [...data.matches]
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle date sorting
      if (sortConfig.key === 'date') {
        aVal = a.date || ''
        bVal = b.date || ''
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      // Handle numeric sorting (listeners, media value, peak concurrent)
      if (sortConfig.key === 'listeners' || sortConfig.key === 'mediaValue') {
        aVal = sortConfig.key === 'mediaValue'
          ? calculateMediaValue(a)
          : (a.listeners || 0)
        bVal = sortConfig.key === 'mediaValue'
          ? calculateMediaValue(b)
          : (b.listeners || 0)
        return sortConfig.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal
      }

      // Handle string sorting
      aVal = (aVal || '').toString().toLowerCase()
      bVal = (bVal || '').toString().toLowerCase()

      if (sortConfig.direction === 'asc') {
        return aVal.localeCompare(bVal)
      } else {
        return bVal.localeCompare(aVal)
      }
    })
    return sorted
  }, [data.matches, sortConfig, detailByDate])

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="sort-icon" aria-hidden="true">↕&#xFE0E;</span>
    }
    return <span className="sort-icon is-active" aria-hidden="true">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  const maxListeners = Math.max(...data.matches.map((m) => m.listeners || 0), 1)

  const sortHeader = (key, label, className = '') => (
    <th
      className={`sortable ${className}`}
      onClick={() => handleSort(key)}
      aria-sort={sortConfig.key === key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      {label}
      {getSortIcon(key)}
    </th>
  )

  const resultBadge = (match) =>
    match.result ? (
      <span className={`result-badge ${RESULT_CLASS[match.result] || ''}`} title={RESULT_LABEL[match.result]}>
        {RESULT_SHORT[match.result] || match.result}
        {match.score ? <span className="result-score">{match.score}</span> : null}
      </span>
    ) : (
      <span className="muted">{match.score || '—'}</span>
    )

  return (
    <div className="section all-matches-overview">
      <div className="section-header-row">
        <div>
          <h2>Alle wedstrijden</h2>
          <p className="section-subtitle">
            Sinds juli 2024 · klik op een wedstrijd met <span className="detail-dot" aria-hidden="true" /> voor streamingdetails
          </p>
        </div>
      </div>

      <div className="matches-table-container" id="all-matches-table">
        <table className="matches-table">
          <thead>
            <tr>
              {sortHeader('date', 'Datum')}
              {sortHeader('match_name', 'Wedstrijd')}
              {sortHeader('result', 'Uitslag')}
              <th>Commentatoren</th>
              {sortHeader('tv_channel', 'Zender')}
              {sortHeader('listeners', 'Luisteraars', 'num')}
              {sortHeader('mediaValue', 'Mediawaarde', 'num')}
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((match) => {
              const hasDetail = Boolean(detailByDate[match.date])
              const mediaValue = calculateMediaValue(match)
              return (
                <tr
                  key={`${match.date}-${match.match_name}`}
                  className={hasDetail ? 'row-has-detail' : ''}
                  onClick={hasDetail ? () => setSelectedMatch(match) : undefined}
                  title={hasDetail ? 'Klik voor streamingdetails' : undefined}
                >
                  <td className="date-cell">
                    {formatDateWithDay(match.date)}
                    {match.time ? <span className="cell-sub">{match.time}</span> : null}
                  </td>
                  <td className="match-cell">
                    <span className="match-name">
                      {match.match_name || '—'}
                      {hasDetail ? <span className="detail-dot" aria-label="streamingdetails beschikbaar" /> : null}
                    </span>
                    <span className="cell-sub">
                      {shortCompetition(match.competition)}
                      {match.home_away ? ` · ${match.home_away}` : ''}
                    </span>
                  </td>
                  <td>{resultBadge(match)}</td>
                  <td className="commentators-cell">{match.commentators || '—'}</td>
                  <td>{match.tv_channel || '—'}</td>
                  <td className="num">
                    <div className="listeners-value">{formatNumber(match.listeners)}</div>
                    {match.listeners ? (
                      <div className="listeners-bar" aria-hidden="true">
                        <div style={{ width: `${(match.listeners / maxListeners) * 100}%` }} />
                      </div>
                    ) : null}
                  </td>
                  <td className="num media-value-cell">{formatEuro(mediaValue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Op mobiel: kaartjes in plaats van de tabel */}
      <ul className="match-cards">
        {sortedMatches.map((match) => {
          const hasDetail = Boolean(detailByDate[match.date])
          return (
            <li
              key={`${match.date}-${match.match_name}`}
              className={hasDetail ? 'has-detail' : ''}
              onClick={hasDetail ? () => setSelectedMatch(match) : undefined}
            >
              <div className="match-card-main">
                <span className="match-name">
                  {match.match_name || '—'}
                  {hasDetail ? <span className="detail-dot" aria-hidden="true" /> : null}
                </span>
                <span className="cell-sub">
                  {formatDateWithDay(match.date)} · {shortCompetition(match.competition)}
                </span>
                <span className="cell-sub">{match.commentators || ''}</span>
              </div>
              <div className="match-card-side">
                {resultBadge(match)}
                <span className="listeners-value">{formatNumber(match.listeners)}</span>
              </div>
            </li>
          )
        })}
      </ul>

      {selectedMatch ? (
        <MatchDetailModal
          date={selectedMatch.date}
          matchName={selectedMatch.match_name}
          onClose={() => setSelectedMatch(null)}
        />
      ) : null}
    </div>
  )
}

export default AllMatchesOverview
