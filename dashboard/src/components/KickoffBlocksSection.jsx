import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './KickoffBlocksSection.css'

function KickoffBlocksSection({ data }) {
  if (!data || data.length === 0) {
    return <div>No kickoff block data available</div>
  }

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="kickoff-blocks-section">
      <h2>Kickoff Time Blocks Performance</h2>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kickoff_block" />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatNumber(value)}
              labelStyle={{ color: '#333' }}
            />
            <Bar dataKey="avg" fill="#2e7d32" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default KickoffBlocksSection
