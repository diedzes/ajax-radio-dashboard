import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './HomeAwayAnalysisSection.css'

function HomeAwayAnalysisSection({ data }) {
  if (!data || !data.home_away || data.home_away.length === 0) {
    return (
      <div className="section">
        <h2>Average Listeners by Home/Away</h2>
        <p>No home/away data available</p>
      </div>
    )
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const chartData = data.home_away.map(item => ({
    home_away: item.home_away,
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section home-away-analysis-section">
      <h2>Average Listeners by Home/Away</h2>
      
      <div className="section-content">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Matches</th>
                <th>Avg Listeners</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
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
          <h3>Average Listeners by Home/Away</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="home_away" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatNumber(value)}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="avg" fill="#9c27b0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default HomeAwayAnalysisSection
