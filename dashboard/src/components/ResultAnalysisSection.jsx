import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './ResultAnalysisSection.css'

function ResultAnalysisSection({ data }) {
  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="section">
        <h2>Average Listeners by Result</h2>
        <p>No result data available</p>
      </div>
    )
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getResultLabel = (result) => {
    const labels = { 'W': 'Win', 'D': 'Draw', 'L': 'Loss' }
    return labels[result] || result
  }

  const chartData = data.results.map(item => ({
    result: getResultLabel(item.result),
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section result-analysis-section">
      <h2>Average Listeners by Result</h2>
      
      <div className="section-content">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Matches</th>
                <th>Avg Listeners</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item, index) => (
                <tr key={index}>
                  <td className="result-cell">
                    <span className={`result-badge result-${item.result.toLowerCase()}`}>
                      {item.result}
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
          <h3>Average Listeners by Result</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="result" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatNumber(value)}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="avg" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ResultAnalysisSection
