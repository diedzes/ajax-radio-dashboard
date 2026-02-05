import React from 'react'
import './FutureMatchesSection.css'

function FutureMatchesSection({ data }) {
  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="section future-matches-section">
        <h2>Future Matches</h2>
        <p>No future matches available</p>
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

  return (
    <div className="section future-matches-section">
      <h2>Future Matches</h2>
      <p className="section-subtitle">predicted listeners</p>
      <div className="matches-table-container">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Time</th>
              <th>Match</th>
              <th>Commentators</th>
              <th>Home/Away</th>
              <th>TV Category</th>
              <th>Opponent Position</th>
              <th>Predicted Listeners</th>
            </tr>
          </thead>
          <tbody>
            {data.matches.map((match, index) => (
              <tr key={index}>
                <td>{formatDate(match.date)}</td>
                <td>{match.weekday || 'N/A'}</td>
                <td>{match.time || 'N/A'}</td>
                <td>{match.match_name || 'N/A'}</td>
                <td>{match.commentators || 'N/A'}</td>
                <td>{match.home_away || 'N/A'}</td>
                <td>{match.tv_category || 'N/A'}</td>
                <td>{Number.isInteger(match.opponent_position) ? match.opponent_position : 'N/A'}</td>
                <td>{match.predicted_listeners ? match.predicted_listeners.toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FutureMatchesSection
