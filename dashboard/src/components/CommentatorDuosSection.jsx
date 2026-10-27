import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './CommentatorDuosSection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber } from '../utils/format'

function CommentatorDuosSection({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'avg', direction: 'desc' })

  if (!data || !data.duos || data.duos.length === 0) {
    return (
      <div className="section">
        <h2>Commentatorenduo's</h2>
        <p>Nog geen data beschikbaar.</p>
      </div>
    )
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
      return <span className="sort-icon" aria-hidden="true">↕&#xFE0E;</span>
    }
    return <span className="sort-icon is-active" aria-hidden="true">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  // Top 15 for chart
  const top15 = sortedDuos.slice(0, 15)

  return (
    <div className="section commentator-duos-section">
      <div className="section-header-row">
        <h2>Commentatorenduo's</h2>
      </div>
      <p className="section-description">
        Gemiddeld aantal luisteraars per duo (volgorde van de namen maakt niet uit)
      </p>
      
      <div className="section-content">
        <div className="table-container" id="commentator-duos-table">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('duo')}>
                  Duo {getSortIcon('duo')}
                </th>
                <th className="sortable" onClick={() => handleSort('matches_count')}>
                  Wedstrijden {getSortIcon('matches_count')}
                </th>
                <th className="sortable" onClick={() => handleSort('avg')}>
                  Gem. luisteraars {getSortIcon('avg')}
                </th>
                <th className="sortable" onClick={() => handleSort('median')}>
                  Mediaan {getSortIcon('median')}
                </th>
                <th className="sortable" onClick={() => handleSort('max')}>
                  Hoogste {getSortIcon('max')}
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
          <h3>Top 15 duo's: gemiddeld aantal luisteraars</h3>
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

export default CommentatorDuosSection
