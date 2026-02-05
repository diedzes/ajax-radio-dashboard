import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ExportPdfButton from './ExportPdfButton'
import './FutureMatchesSection.css'

function FutureMatchesSection({ data, recentPredictions }) {
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

  const chartMatches = recentPredictions?.matches || []
  const chartData = chartMatches.map((match) => ({
    label: formatDate(match.date),
    matchName: match.match_name || 'N/A',
    actual: match.listeners || 0,
    predicted: match.predicted_listeners || 0
  }))

  return (
    <div className="section future-matches-section">
      <div className="section-header-row">
        <div>
          <h2>Future Matches</h2>
          <p className="section-subtitle">predicted listeners</p>
        </div>
        <ExportPdfButton targetId="future-matches-table" filename="future-matches.pdf" />
      </div>
      <div className="matches-table-container" id="future-matches-table">
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
              <th>PosEre</th>
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

      {chartData.length > 0 ? (
        <div className="future-matches-chart">
          <h3>Last 10 Matches: Predicted vs Actual</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [Number(value).toLocaleString(), name]}
                labelFormatter={(label, items) =>
                  items && items[0] ? `${label} • ${items[0].payload.matchName}` : label
                }
              />
              <Line type="monotone" dataKey="predicted" stroke="#c8102e" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#111111" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}

export default FutureMatchesSection
