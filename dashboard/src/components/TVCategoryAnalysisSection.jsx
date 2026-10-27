import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './TVCategoryAnalysisSection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber } from '../utils/format'

function TVCategoryAnalysisSection({ data }) {
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="section">
        <h2>Luisteraars per tv-zender</h2>
        <p>Nog geen data beschikbaar.</p>
      </div>
    )
  }

  // Data gebruikt Engelse categorienamen; alleen de weergave is Nederlands.
  const categoryLabel = (category) => ({ Paid: 'Betaald' }[category] || category)

  const chartData = data.categories.map(item => ({
    category: categoryLabel(item.category),
    avg: item.avg,
    matches: item.matches_count
  }))

  return (
    <div className="section tv-category-analysis-section">
      <div className="section-header-row">
        <h2>Luisteraars per tv-zender</h2>
      </div>
      <p className="section-description">
        Open = ESPN/ESPN1 · Half-open = Ziggo · Betaald = overige zenders
      </p>
      
      <div className="section-content">
        <div className="table-container" id="tv-category-analysis-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Categorie</th>
                <th>Wedstrijden</th>
                <th>Gem. luisteraars</th>
                <th>Mediaan</th>
                <th>Laagste</th>
                <th>Hoogste</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((item, index) => (
                <tr key={index}>
                  <td className="category-cell">
                    <span className={`category-badge category-${item.category.toLowerCase().replace('-', '')}`}>
                      {categoryLabel(item.category)}
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
              <XAxis dataKey="category" />
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

export default TVCategoryAnalysisSection
