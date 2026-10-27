import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './KickoffBlocksSection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber } from '../utils/format'

function KickoffBlocksSection({ data }) {
  if (!data || data.length === 0) {
    return <div><h2>Luisteraars per aftraptijd</h2><p>Nog geen data beschikbaar.</p></div>
  }

  return (
    <div className="kickoff-blocks-section">
      <h2>Luisteraars per aftraptijd</h2>
      <p className="section-subtitle">Gemiddeld aantal luisteraars per tijdsblok</p>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kickoff_block" />
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
  )
}

export default KickoffBlocksSection
