import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './CommentatorDuosSection.css'

function CommentatorDuosSection({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'avg', direction: 'desc' })

  if (!data || !data.duos || data.duos.length === 0) {
    return (
      <div className="section">
        <h2>Commentator Duos Performance</h2>
        <p>No commentator duo data available</p>
      </div>
    )
  }

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedDuos = useMemo(() => {
    const sorted = [...data.duos]
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      
      if (typeof aVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      aVal = (aVal || '').toString().toLowerCase()
      bVal = (bVal || '').toString().toLowerCase()
      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })
    return sorted
  }, [data.duos, sortConfig])

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  // Top 15 for chart
  const top15 = sortedDuos.slice(0, 15)

  return (
    <div className="section commentator-duos-section">
      <h2>Commentator Duos Performance</h2>
      <p className="section-description">
        Average listeners per commentator duo (order doesn't matter)
      </p>
      
      <div className="section-content">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('duo')}>
                  Duo {getSortIcon('duo')}
                </th>
                <th className="sortable" onClick={() => handleSort('matches_count')}>
                  Matches {getSortIcon('matches_count')}
                </th>
                <th className="sortable" onClick={() => handleSort('avg')}>
                  Avg Listeners {getSortIcon('avg')}
                </th>
                <th className="sortable" onClick={() => handleSort('median')}>
                  Median {getSortIcon('median')}
                </th>
                <th className="sortable" onClick={() => handleSort('max')}>
                  Max {getSortIcon('max')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDuos.map((item, index) => (
                <tr key={index}>
                  <td className="name-cell">{item.duo}</td>
                  <td>{item.matches_count}</td>
                  <td className="avg-cell">{formatNumber(item.avg)}</td>
                  <td>{formatNumber(item.median)}</td>
                  <td>{formatNumber(item.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <h3>Top 15 Commentator Duos - Average Listeners</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top15} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="duo" 
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
              />
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

export default CommentatorDuosSection
