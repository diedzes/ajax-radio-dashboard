import React, { useState, useMemo, useEffect } from 'react'
import ExportPdfButton from './ExportPdfButton'
import MatchDetailModal from './MatchDetailModal'
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
        <h2>All Matches Overview</h2>
        <p>No match data available</p>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const getResultClass = (result) => {
    if (result === 'W') return 'result-win'
    if (result === 'D') return 'result-draw'
    if (result === 'L') return 'result-loss'
    return ''
  }

  const getResultLabel = (result) => {
    if (result === 'W') return 'W'
    if (result === 'D') return 'D'
    if (result === 'L') return 'L'
    return '-'
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
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

      if (sortConfig.key === 'peakValue') {
        aVal = detailByDate[a.date]?.peakValue ?? -1
        bVal = detailByDate[b.date]?.peakValue ?? -1
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
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
      return '↕️'
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="section all-matches-overview">
      <div className="section-header-row">
        <div>
          <h2>All Matches Overview</h2>
          <p className="section-subtitle">from july 2024</p>
        </div>
        <ExportPdfButton targetId="all-matches-table" filename="all-matches.pdf" />
      </div>
      <div className="matches-table-container" id="all-matches-table">
        <table className="matches-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('date')}>
                Date {getSortIcon('date')}
              </th>
              <th className="sortable" onClick={() => handleSort('weekday')}>
                Day {getSortIcon('weekday')}
              </th>
              <th className="sortable" onClick={() => handleSort('time')}>
                Time {getSortIcon('time')}
              </th>
              <th className="sortable" onClick={() => handleSort('match_name')}>
                Match {getSortIcon('match_name')}
              </th>
              <th>
                Commentators
              </th>
              <th className="sortable" onClick={() => handleSort('tv_channel')}>
                TV Channel {getSortIcon('tv_channel')}
              </th>
              <th className="sortable" onClick={() => handleSort('score')}>
                Score {getSortIcon('score')}
              </th>
              <th className="sortable" onClick={() => handleSort('result')}>
                Result {getSortIcon('result')}
              </th>
              <th className="sortable" onClick={() => handleSort('listeners')}>
                Listeners {getSortIcon('listeners')}
              </th>
              <th className="sortable" onClick={() => handleSort('peakValue')}>
                Piek gelijktijdig {getSortIcon('peakValue')}
              </th>
              <th className="sortable" onClick={() => handleSort('mediaValue')}>
                Media Value {getSortIcon('mediaValue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((match, index) => {
              const detail = detailByDate[match.date]
              const hasDetail = Boolean(detail)
              return (
              <tr
                key={index}
                className={hasDetail ? 'row-has-detail' : ''}
                onClick={hasDetail ? () => setSelectedMatch(match) : undefined}
                title={hasDetail ? 'Klik voor gedetailleerde streamingdata' : undefined}
              >
                <td>
                  {formatDate(match.date)}
                  {hasDetail ? <span className="detail-dot" aria-hidden="true" /> : null}
                </td>
                <td>{match.weekday || 'N/A'}</td>
                <td>{match.time || 'N/A'}</td>
                <td>{match.match_name || 'N/A'}</td>
                <td>{match.commentators || 'N/A'}</td>
                <td>{match.tv_channel || 'N/A'}</td>
                <td>{match.score || 'N/A'}</td>
                <td>
                  <span className={`result-badge ${getResultClass(match.result)}`}>
                    {getResultLabel(match.result)}
                  </span>
                </td>
                <td>{match.listeners ? match.listeners.toLocaleString() : 'N/A'}</td>
                <td>
                  {detail?.peakValue
                    ? `${detail.peakValue.toLocaleString()}${detail.peakHour ? ` (${detail.peakHour})` : ''}`
                    : 'N/A'}
                </td>
                <td className="media-value-cell">
                  {calculateMediaValue(match) ? formatCurrency(calculateMediaValue(match)) : 'N/A'}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
