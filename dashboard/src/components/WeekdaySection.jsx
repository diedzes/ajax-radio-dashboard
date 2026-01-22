import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './WeekdaySection.css'

function WeekdaySection({ data }) {
  if (!data || data.length === 0) {
    return <div>No weekday data available</div>
  }

  // Define weekday order (Mon-Sun)
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Sort data by weekday order
  const sortedData = [...data].sort((a, b) => {
    const indexA = weekdayOrder.indexOf(a.weekday)
    const indexB = weekdayOrder.indexOf(b.weekday)
    return indexA - indexB
  })

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="weekday-section">
      <h2>Weekday Performance</h2>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekday" />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatNumber(value)}
              labelStyle={{ color: '#333' }}
            />
            <Bar dataKey="avg" fill="#ed6c02" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default WeekdaySection
