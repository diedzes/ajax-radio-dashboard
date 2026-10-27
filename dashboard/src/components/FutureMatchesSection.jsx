import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './FutureMatchesSection.css'
import { COLORS } from '../theme'
import { formatDate, formatDateWithDay, formatNumber, shortCompetition } from '../utils/format'

function FutureMatchesSection({ data, recentPredictions }) {
  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="section future-matches-section">
        <h2>Komende wedstrijden</h2>
        <p>Er staan nog geen wedstrijden met commentatoren in de agenda.</p>
      </div>
    )
  }

  const chartData = (recentPredictions?.matches || []).map((match) => ({
    label: formatDate(match.date),
    matchName: match.match_name || '',
    actual: match.listeners || 0,
    predicted: match.predicted_listeners || 0
  }))

  return (
    <div className="section future-matches-section">
      <div className="section-header-row">
        <div>
          <h2>Komende wedstrijden</h2>
          <p className="section-subtitle">Voorspeld aantal luisteraars op basis van eerdere wedstrijden</p>
        </div>
      </div>
      <div className="matches-table-container" id="future-matches-table">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Wedstrijd</th>
              <th>Commentatoren</th>
              <th>Zender</th>
              <th className="num">Stand tegenstander</th>
              <th className="num">Voorspelling</th>
            </tr>
          </thead>
          <tbody>
            {data.matches.map((match) => (
              <tr key={`${match.date}-${match.match_name}`}>
                <td className="date-cell">
                  {formatDateWithDay(match.date)}
                  {match.time ? <span className="cell-sub">{match.time}</span> : null}
                </td>
                <td className="match-cell">
                  <span className="match-name">{match.match_name || '—'}</span>
                  <span className="cell-sub">
                    {shortCompetition(match.competition)}
                    {match.home_away ? ` · ${match.home_away}` : ''}
                  </span>
                </td>
                <td className="commentators-cell">{match.commentators || '—'}</td>
                <td>{match.tv_channel || <span className="muted">Nog niet bekend</span>}</td>
                <td className="num">
                  {Number.isInteger(match.opponent_position) ? `${match.opponent_position}e` : '—'}
                </td>
                <td className="num listeners-value">{formatNumber(match.predicted_listeners)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 ? (
        <div className="future-matches-chart">
          <h3>Laatste 10 wedstrijden: voorspeld vs. werkelijk</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip
                formatter={(value, name) => [formatNumber(value), name]}
                labelFormatter={(label, items) =>
                  items && items[0] ? `${label} · ${items[0].payload.matchName}` : label
                }
              />
              <Legend />
              <Line type="monotone" dataKey="predicted" name="Voorspeld" stroke={COLORS.red} strokeWidth={2} />
              <Line type="monotone" dataKey="actual" name="Werkelijk" stroke={COLORS.ink} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}

export default FutureMatchesSection
