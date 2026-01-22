import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './CommentatorsSection.css'

function CommentatorsSection({ data }) {
  if (!data || data.length === 0) {
    return <div>No commentator data available</div>
  }

  // Top 10 for chart
  const top10 = data.slice(0, 10)

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="commentators-section">
      <h2>Commentators Performance</h2>
      
      <div className="section-content">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matches</th>
                <th>Avg</th>
                <th>Median</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="name-cell">{item.commentator}</td>
                  <td>{item.matches_count}</td>
                  <td>{formatNumber(item.avg)}</td>
                  <td>{formatNumber(item.median)}</td>
                  <td>{formatNumber(item.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <h3>Top 10 Commentators - Average Listeners</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top10} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="commentator" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatNumber(value)}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="avg" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default CommentatorsSection
