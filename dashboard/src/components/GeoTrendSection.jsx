import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './GeoTrendSection.css'

function GeoTrendSection() {
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
      <div className="section geo-trend-section">
        <h2>Nederland vs. Buitenland</h2>
        <p>Laden...</p>
      </div>
    )
  }

  const withData = matches.filter((m) => m.geo && m.geo.labels)

  if (withData.length === 0) {
    return (
      <div className="section geo-trend-section">
        <h2>Nederland vs. Buitenland</h2>
        <p>Nog geen wedstrijden met CDN-detaildata verwerkt.</p>
      </div>
    )
  }

  const chartData = withData.map((m) => {
    const nlIndex = m.geo.labels.indexOf('Nederland')
    const nlPct = nlIndex >= 0 ? m.geo.values[nlIndex] : 0
    return {
      label: formatDate(m.date),
      matchName: m.match_name,
      Nederland: nlPct,
      Buitenland: Math.round((100 - nlPct) * 10) / 10
    }
  })

  return (
    <div className="section geo-trend-section">
      <h2>Nederland vs. Buitenland</h2>
      <p className="section-subtitle">% luisteraars uit Nederland t.o.v. buitenland, chronologisch (alleen wedstrijden met CDN-detaildata)</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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
          <Line type="monotone" dataKey="Nederland" stroke="#c8102e" strokeWidth={2} />
          <Line type="monotone" dataKey="Buitenland" stroke="#111111" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GeoTrendSection
