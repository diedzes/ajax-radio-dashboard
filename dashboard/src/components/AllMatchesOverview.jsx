import React, { useState, useMemo } from 'react'
import './AllMatchesOverview.css'

function AllMatchesOverview({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

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
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
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

  const calculateMediaValue = (listeners) => {
    if (!listeners) return 0
    return (listeners / 1000) * 25
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

      // Handle numeric sorting (listeners, media value)
      if (sortConfig.key === 'listeners' || sortConfig.key === 'mediaValue') {
        aVal = sortConfig.key === 'mediaValue' 
          ? calculateMediaValue(a.listeners)
          : (a.listeners || 0)
        bVal = sortConfig.key === 'mediaValue'
          ? calculateMediaValue(b.listeners)
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
  }, [data.matches, sortConfig])

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="section all-matches-overview">
      <h2>All Matches Overview</h2>
      <p className="section-subtitle">from july 2024</p>
      <div className="matches-table-container">
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
              <th className="sortable" onClick={() => handleSort('mediaValue')}>
                Media Value {getSortIcon('mediaValue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((match, index) => (
              <tr key={index}>
                <td>{formatDate(match.date)}</td>
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
                <td className="media-value-cell">
                  {match.listeners ? formatCurrency(calculateMediaValue(match.listeners)) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AllMatchesOverview
