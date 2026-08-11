import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './PlatformMixTrendSection.css'

const SERIES = [
  { key: 'iOS-app', color: '#d2122e' },
  { key: 'Android-app', color: '#9ca3af' },
  { key: 'Webbrowser', color: '#f7c8d0' },
  { key: 'Relay/herdistributie', color: '#111111' },
  { key: 'Overig', color: '#c8c8c8' }
]

function PlatformMixTrendSection() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => setMatches(json.matches || []))
      .catch(() => setMatches([]))
  }, [])

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (matches === null) {
    return (
      <div className="section platform-mix-trend-section">
        <h2>Platform-mix per Wedstrijd</h2>
        <p>Laden...</p>
      </div>
    )
  }

  const withData = matches.filter((m) => m.platform && m.platform.labels)

  if (withData.length === 0) {
    return (
      <div className="section platform-mix-trend-section">
        <h2>Platform-mix per Wedstrijd</h2>
        <p>Nog geen wedstrijden met CDN-detaildata verwerkt.</p>
      </div>
    )
  }

  const chartData = withData.map((m) => {
    const row = { label: formatDate(m.date), matchName: m.match_name }
    m.platform.labels.forEach((label, i) => {
      row[label] = m.platform.values[i]
    })
    return row
  })

  return (
    <div className="section platform-mix-trend-section">
      <h2>Platform-mix per Wedstrijd</h2>
      <p className="section-subtitle">% van de luisteraars per platform, chronologisch (alleen wedstrijden met CDN-detaildata)</p>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis unit="%" />
          <Tooltip
            formatter={(value) => `${value}%`}
            labelFormatter={(label, items) =>
              items && items[0] ? `${label} • ${items[0].payload.matchName}` : label
            }
          />
          <Legend />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stackId="1"
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.85}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlatformMixTrendSection
