import React from 'react'
import './Top5GamesSection.css'

function Top5GamesSection({ data }) {
  if (!data || (!data['2024/2025'] && !data['2025/2026'])) {
    return (
      <div className="section">
        <h2>Top 5 Games by Season</h2>
        <p>No data available</p>
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

  const renderSeasonTable = (season, matches) => {
    if (!matches || matches.length === 0) {
      return (
        <div className="season-section">
          <h3>{season}</h3>
          <p>No data available for this season</p>
        </div>
      )
    }

    return (
      <div className="season-section">
        <h3>{season}</h3>
        <table className="top5-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Date</th>
              <th>Day</th>
              <th>Time</th>
              <th>Match</th>
              <th>Commentators</th>
              <th>TV Channel</th>
              <th>Score</th>
              <th>Result</th>
              <th>Listeners</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr key={index}>
                <td className="rank-cell">{index + 1}</td>
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
                <td className="listeners-cell">{match.listeners ? match.listeners.toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="section top5-games-section">
      <h2>Top 5 Games by Season</h2>
      <div className="seasons-container">
        {data['2024/2025'] && renderSeasonTable('2024/2025', data['2024/2025'])}
        {data['2025/2026'] && renderSeasonTable('2025/2026', data['2025/2026'])}
      </div>
    </div>
  )
}

export default Top5GamesSection
