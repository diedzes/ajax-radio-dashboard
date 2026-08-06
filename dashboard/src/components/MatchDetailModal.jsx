import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './MatchDetailModal.css'

const PLATFORM_FALLBACK_COLORS = ['#d2122e', '#f4a6b3', '#f7c8d0', '#9ca3af', '#111111']
const QUALITY_FALLBACK_COLORS = ['#2e9e5b', '#e2a13a', '#d2122e', '#9ca3af']

function formatNum(value) {
  return typeof value === 'number' ? value.toLocaleString('nl-NL') : 'N/A'
}

function MatchDetailModal({ date, matchName, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/output/match_details/${date}.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Geen detaildata beschikbaar voor deze wedstrijd')
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setDetail(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [date])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const concurrencyData = detail?.concurrency?.map(([label, value]) => ({ label, value })) || []
  const platformData = detail?.platform?.labels?.map((label, i) => ({
    name: label,
    value: detail.platform.values[i],
    color: detail.platform.colors?.[i] || PLATFORM_FALLBACK_COLORS[i % PLATFORM_FALLBACK_COLORS.length]
  })) || []
  const geoData = detail?.geo?.labels?.map((label, i) => ({
    name: label,
    value: detail.geo.values[i]
  })) || []
  const qualityData = detail?.quality?.labels?.map((label, i) => ({
    name: label,
    value: detail.quality.values[i],
    color: detail.quality.colors?.[i] || QUALITY_FALLBACK_COLORS[i % QUALITY_FALLBACK_COLORS.length]
  })) || []

  return (
    <div className="match-detail-overlay" onClick={onClose}>
      <div className="match-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="match-detail-header">
          <div>
            <h2>{matchName || 'Wedstrijddetail'}</h2>
            <p className="match-detail-sub">{date}</p>
          </div>
          <button type="button" className="match-detail-close" onClick={onClose} aria-label="Sluiten">
            &times;
          </button>
        </div>

        <div className="match-detail-body">
          {loading ? <p className="match-detail-loading">Laden...</p> : null}

          {!loading && error ? (
            <div className="match-detail-empty">
              <p>Voor deze wedstrijd is geen CDN-detaildata beschikbaar (alleen ruwe streaminglogs vanaf 21 juli 2026 worden automatisch verwerkt).</p>
              <p>Alleen het dagcijfer is bekend voor deze wedstrijd.</p>
            </div>
          ) : null}

          {!loading && !error && detail ? (
            <>
              <div className="match-detail-kpis">
                <div className="kpi-card">
                  <div className="kpi-label">Luisteraars</div>
                  <div className="kpi-value">{formatNum(detail.listeners)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Piekmoment</div>
                  <div className="kpi-value">{detail.peakHour || 'N/A'}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Piek gelijktijdig</div>
                  <div className="kpi-value">{formatNum(detail.peakValue)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Succesratio</div>
                  <div className="kpi-value">{detail.successRate != null ? `${detail.successRate}%` : 'N/A'}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Bandbreedte</div>
                  <div className="kpi-value">{detail.bandwidth || 'N/A'}</div>
                </div>
              </div>

              <div className="match-detail-chart-block">
                <h3>Gelijktijdige luisteraars per minuut</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={concurrencyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" interval={Math.max(0, Math.floor(concurrencyData.length / 12) - 1)} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatNum(value), 'Gelijktijdig']} />
                    <Area type="monotone" dataKey="value" stroke="#c8102e" fill="#c8102e" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="match-detail-charts-grid">
                <div className="match-detail-chart-block">
                  <h3>Platform</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={platformData} dataKey="value" nameKey="name" outerRadius={80} label={(d) => `${d.value}%`}>
                        {platformData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="match-detail-chart-block">
                  <h3>Geografie</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit="%" />
                      <YAxis type="category" dataKey="name" width={90} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="value" fill="#111111" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="match-detail-chart-block">
                  <h3>Streamkwaliteit (HTTP-status)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={qualityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit="%" />
                      <YAxis type="category" dataKey="name" width={110} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="value">
                        {qualityData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {detail.preroll ? (
                <div className="match-detail-chart-block">
                  <h3>Pre-roll advertentiesimulatie (5 sec.)</h3>
                  <div className="match-detail-kpis">
                    <div className="kpi-card">
                      <div className="kpi-label">Bereik</div>
                      <div className="kpi-value">{formatNum(detail.preroll.bereik)}</div>
                      <div className="kpi-sub">{detail.preroll.bereikPct}% van luisteraars</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Impressies</div>
                      <div className="kpi-value">{formatNum(detail.preroll.impressies)}</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Frequentie</div>
                      <div className="kpi-value">{detail.preroll.freq}x</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Completion rate</div>
                      <div className="kpi-value">{detail.preroll.completion}%</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal
