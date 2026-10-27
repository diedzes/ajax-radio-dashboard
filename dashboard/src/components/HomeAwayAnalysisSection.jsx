import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './HomeAwayAnalysisSection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber } from '../utils/format'

function HomeAwayAnalysisSection({ data }) {
  if (!data || !data.home_away || data.home_away.length === 0) {
    return (
      <div className="section">
        <h2>Luisteraars thuis en uit</h2>
        <p>Nog geen data beschikbaar.</p>
      </div>
    )
  }

  const chartData = data.home_away.map(item => ({
    home_away: item.home_away,
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section home-away-analysis-section">
      <div className="section-header-row">
        <h2>Luisteraars thuis en uit</h2>
      </div>
      
      <div className="section-content">
        <div className="table-container" id="home-away-analysis-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thuis/uit</th>
                <th>Wedstrijden</th>
                <th>Gem. luisteraars</th>
                <th>Mediaan</th>
                <th>Laagste</th>
                <th>Hoogste</th>
              </tr>
            </thead>
            <tbody>
              {data.home_away.map((item, index) => (
                <tr key={index}>
                  <td className="type-cell">{item.home_away}</td>
                  <td>{item.matches_count}</td>
                  <td className="avg-cell">{formatNumber(item.avg)}</td>
                  <td>{formatNumber(item.median)}</td>
                  <td>{formatNumber(item.min)}</td>
                  <td>{formatNumber(item.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="home_away" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip 
                formatter={(value) => [formatNumber(value), 'Gem. luisteraars']}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
              <Bar dataKey="avg" fill={COLORS.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default HomeAwayAnalysisSection
