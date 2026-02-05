import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ExportPdfButton from './ExportPdfButton'
import './TVCategoryAnalysisSection.css'

function TVCategoryAnalysisSection({ data }) {
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="section">
        <h2>Average Listeners by TV Channel Category</h2>
        <p>No TV category data available</p>
      </div>
    )
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const chartData = data.categories.map(item => ({
    category: item.category,
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section tv-category-analysis-section">
      <div className="section-header-row">
        <h2>Average Listeners by TV Channel Category</h2>
        <ExportPdfButton targetId="tv-category-analysis-table" filename="tv-category-analysis.pdf" />
      </div>
      <p className="section-description">
        Categorization: Half-open (ZIGGO), Open (ESPN/ESPN1), Paid (all other)
      </p>
      
      <div className="section-content">
        <div className="table-container" id="tv-category-analysis-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Matches</th>
                <th>Avg Listeners</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((item, index) => (
                <tr key={index}>
                  <td className="category-cell">
                    <span className={`category-badge category-${item.category.toLowerCase().replace('-', '')}`}>
                      {item.category}
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
          <h3>Average Listeners by TV Channel Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatNumber(value)}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="avg" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TVCategoryAnalysisSection
