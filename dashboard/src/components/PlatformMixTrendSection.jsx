import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './PlatformMixTrendSection.css'
import { PLATFORM_COLORS } from '../theme'
import { formatDate } from '../utils/format'

const SERIES = [
  { key: 'iOS-app', color: PLATFORM_COLORS['iOS-app'] },
  { key: 'Android-app', color: PLATFORM_COLORS['Android-app'] },
  { key: 'Webbrowser', color: PLATFORM_COLORS['Webbrowser'] },
  { key: 'Relay/herdistributie', color: PLATFORM_COLORS['Relay/herdistributie'] },
  { key: 'Overig', color: PLATFORM_COLORS['Overig'] }
]

function PlatformMixTrendSection() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    fetch(`/output/match_details_summary.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((json) => setMatches(json.matches || []))
      .catch(() => setMatches([]))
  }, [])

  if (matches === null) {
    return (
      <div className="section platform-mix-trend-section">
        <h2>Platform-mix per wedstrijd</h2>
        <p>Laden...</p>
      </div>
    )
  }

  const withData = matches.filter((m) => m.platform && m.platform.labels)

  if (withData.length === 0) {
    return (
      <div className="section platform-mix-trend-section">
        <h2>Platform-mix per wedstrijd</h2>
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
      <h2>Platform-mix per wedstrijd</h2>
      <p className="section-subtitle">% van de luisteraars per platform, chronologisch (alleen wedstrijden met CDN-detaildata)</p>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis unit="%" />
          <Tooltip
            formatter={(value) => `${value}%`}
            labelFormatter={(label, items) =>
              items && items[0] ? `${label} · ${items[0].payload.matchName}` : label
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
