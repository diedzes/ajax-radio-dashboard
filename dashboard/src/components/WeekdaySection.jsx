import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './WeekdaySection.css'
import { COLORS, TOOLTIP_LABEL_STYLE } from '../theme'
import { formatNumber, WEEKDAY_NL } from '../utils/format'

function WeekdaySection({ data }) {
  if (!data || data.length === 0) {
    return <div><h2>Luisteraars per weekdag</h2><p>Nog geen data beschikbaar.</p></div>
  }

  // Define weekday order (Mon-Sun)
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Sort data by weekday order
  const sortedData = [...data]
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday))
    .map((item) => ({ ...item, weekdayLabel: WEEKDAY_NL[item.weekday] || item.weekday }))

  return (
    <div className="weekday-section">
      <h2>Luisteraars per weekdag</h2>
      <p className="section-subtitle">Gemiddeld aantal luisteraars per dag van de week</p>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekdayLabel" />
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

export default WeekdaySection
