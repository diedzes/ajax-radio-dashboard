import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './ResultAnalysisSection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber, RESULT_LABEL, RESULT_SHORT } from '../utils/format'

function ResultAnalysisSection({ data }) {
  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="section">
        <h2>Luisteraars per uitslag</h2>
        <p>Nog geen data beschikbaar.</p>
      </div>
    )
  }

  const getResultLabel = (result) => RESULT_LABEL[result] || result

  const chartData = data.results.map(item => ({
    result: getResultLabel(item.result),
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section result-analysis-section">
      <div className="section-header-row">
        <h2>Luisteraars per uitslag</h2>
      </div>
      
      <div className="section-content">
        <div className="table-container" id="result-analysis-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Uitslag</th>
                <th>Wedstrijden</th>
                <th>Gem. luisteraars</th>
                <th>Mediaan</th>
                <th>Laagste</th>
                <th>Hoogste</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item, index) => (
                <tr key={index}>
                  <td className="result-cell">
                    <span className={`result-badge result-${item.result.toLowerCase()}`}>
                      {RESULT_SHORT[item.result] || item.result}
                    </span>
                  </td>
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
              <XAxis dataKey="result" />
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

export default ResultAnalysisSection
