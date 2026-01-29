import React, { useMemo } from 'react'
import './PodcastSection.css'

function PodcastSection({ episodes, monthly }) {
  const episodeList = episodes?.episodes || []
  const monthlyList = monthly?.months || []

  const sortedEpisodes = useMemo(() => {
    return [...episodeList].sort((a, b) => {
      const aDate = a?.published_at ? Date.parse(a.published_at) : 0
      const bDate = b?.published_at ? Date.parse(b.published_at) : 0
      return bDate - aDate
    })
  }, [episodeList])

  const sortedMonthly = useMemo(() => {
    return [...monthlyList].sort((a, b) => {
      const aKey = a?.month || ''
      const bKey = b?.month || ''
      return aKey.localeCompare(bKey)
    })
  }, [monthlyList])

  const maxMonthly = useMemo(() => {
    if (!sortedMonthly.length) return 0
    return Math.max(...sortedMonthly.map((item) => item.downloads || 0))
  }, [sortedMonthly])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const parsed = Date.parse(dateStr)
    if (Number.isNaN(parsed)) return dateStr
    return new Date(parsed).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="section podcast-section">
      <h2>Podcast</h2>
      <p className="section-subtitle">episodes and monthly results</p>

      <div className="podcast-grid">
        <div className="podcast-panel">
          <h3>Episodes</h3>
          {sortedEpisodes.length === 0 ? (
            <p>No episode data available</p>
          ) : (
            <div className="matches-table-container">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Published</th>
                    <th>Duration</th>
                    <th>Downloads (24m)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEpisodes.map((episode) => (
                    <tr key={episode.id}>
                      <td>{episode.title || 'N/A'}</td>
                      <td>{formatDate(episode.published_at)}</td>
                      <td>{episode.duration_in_mmss || 'N/A'}</td>
                      <td className="downloads-cell">
                        {episode.total_downloads?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="podcast-panel">
          <h3>Monthly Results</h3>
          {sortedMonthly.length === 0 ? (
            <p>No monthly analytics available</p>
          ) : (
            <div className="podcast-monthly-list">
              {sortedMonthly.map((month) => {
                const width = maxMonthly
                  ? Math.round((month.downloads / maxMonthly) * 100)
                  : 0
                return (
                  <div className="podcast-monthly-row" key={month.month}>
                    <div className="podcast-month-label">{month.month}</div>
                    <div className="podcast-month-bar">
                      <span style={{ width: `${width}%` }} />
                    </div>
                    <div className="podcast-month-value">
                      {month.downloads?.toLocaleString() || '0'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PodcastSection
