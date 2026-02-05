import React, { useMemo, useState } from 'react'
import ExportPdfButton from './ExportPdfButton'
import './PodcastSection.css'

const APP_COLORS = [
  '#c8102e',
  '#111111',
  '#e0a500',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
  '#ef4444',
  '#64748b'
]

function PodcastSection({ episodes, monthly, apps }) {
  const episodeList = episodes?.episodes || []
  const monthlyList = monthly?.months || []
  const appList = apps?.apps || []
  const [episodeSort, setEpisodeSort] = useState({ key: 'published_at', direction: 'desc' })
  const [monthlySort, setMonthlySort] = useState({ key: 'month', direction: 'desc' })

  const parseDuration = (duration) => {
    if (typeof duration === 'number') return duration
    if (!duration) return 0
    const parts = String(duration).split(':').map((value) => Number.parseInt(value, 10))
    if (parts.some(Number.isNaN)) return 0
    return parts.reduce((total, part) => total * 60 + part, 0)
  }

  const getEpisodeSortValue = (episode, key) => {
    switch (key) {
      case 'title':
        return (episode?.title || '').toLowerCase()
      case 'published_at':
        return episode?.published_at ? Date.parse(episode.published_at) : 0
      case 'duration':
        return parseDuration(episode?.duration_in_seconds || episode?.duration_in_mmss)
      case 'downloads':
        return episode?.total_downloads || 0
      default:
        return 0
    }
  }

  const toggleEpisodeSort = (key, defaultDirection = 'asc') => {
    setEpisodeSort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: defaultDirection }
    })
  }

  const toggleMonthlySort = (key, defaultDirection = 'asc') => {
    setMonthlySort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: defaultDirection }
    })
  }

  const getSortIndicator = (current, key) => {
    if (current.key !== key) return ''
    return current.direction === 'asc' ? '▲' : '▼'
  }

  const sortedEpisodes = useMemo(() => {
    const list = [...episodeList]
    list.sort((a, b) => {
      const aValue = getEpisodeSortValue(a, episodeSort.key)
      const bValue = getEpisodeSortValue(b, episodeSort.key)
      if (aValue < bValue) return episodeSort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return episodeSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [episodeList, episodeSort])

  const sortedMonthly = useMemo(() => {
    const list = [...monthlyList]
    list.sort((a, b) => {
      const aValue = monthlySort.key === 'downloads' ? (a?.downloads || 0) : (a?.month || '')
      const bValue = monthlySort.key === 'downloads' ? (b?.downloads || 0) : (b?.month || '')
      if (aValue < bValue) return monthlySort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return monthlySort.direction === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [monthlyList, monthlySort])

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

  const appTotal = useMemo(() => {
    return appList.reduce((sum, item) => sum + (item.downloads || 0), 0)
  }, [appList])

  const appSegments = useMemo(() => {
    if (!appTotal) return []
    let current = 0
    return appList.map((item, index) => {
      const percentage = ((item.downloads || 0) / appTotal) * 100
      const start = current
      const end = current + percentage
      current = end
      return {
        name: item.name || 'Unknown',
        downloads: item.downloads || 0,
        percentage,
        start,
        end,
        color: APP_COLORS[index % APP_COLORS.length]
      }
    })
  }, [appList, appTotal])

  const appGradient = useMemo(() => {
    if (!appSegments.length) return ''
    const parts = appSegments.map(
      (segment) => `${segment.color} ${segment.start}% ${segment.end}%`
    )
    return `conic-gradient(${parts.join(', ')})`
  }, [appSegments])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="section podcast-section">
      <h2>Podcast</h2>
      <p className="section-subtitle">episodes and monthly results</p>

      <nav className="podcast-top-nav">
        <button type="button" onClick={() => scrollToSection('podcast-episodes')}>
          Episodes
        </button>
        <button type="button" onClick={() => scrollToSection('podcast-monthly')}>
          Monthly results
        </button>
        <button type="button" onClick={() => scrollToSection('podcast-apps')}>
          Podcast app
        </button>
      </nav>

      <div className="podcast-stack">
        <div className="podcast-panel" id="podcast-episodes">
          <div className="section-header-row">
            <h3>Episodes</h3>
            <ExportPdfButton targetId="podcast-episodes-table" filename="podcast-episodes.pdf" />
          </div>
          {sortedEpisodes.length === 0 ? (
            <p>No episode data available</p>
          ) : (
            <div className="matches-table-container" id="podcast-episodes-table">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th
                      aria-sort={episodeSort.key === 'title' ? `${episodeSort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleEpisodeSort('title')}
                      >
                        Title
                        <span className="sort-indicator">{getSortIndicator(episodeSort, 'title')}</span>
                      </button>
                    </th>
                    <th
                      aria-sort={episodeSort.key === 'published_at' ? `${episodeSort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleEpisodeSort('published_at', 'desc')}
                      >
                        Published
                        <span className="sort-indicator">
                          {getSortIndicator(episodeSort, 'published_at')}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={episodeSort.key === 'duration' ? `${episodeSort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleEpisodeSort('duration', 'desc')}
                      >
                        Duration
                        <span className="sort-indicator">{getSortIndicator(episodeSort, 'duration')}</span>
                      </button>
                    </th>
                    <th
                      aria-sort={episodeSort.key === 'downloads' ? `${episodeSort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleEpisodeSort('downloads', 'desc')}
                      >
                        Downloads (24m)
                        <span className="sort-indicator">{getSortIndicator(episodeSort, 'downloads')}</span>
                      </button>
                    </th>
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

        <div className="podcast-panel" id="podcast-monthly">
          <div className="section-header-row">
            <h3>Monthly Results</h3>
            <ExportPdfButton targetId="podcast-monthly-table" filename="podcast-monthly.pdf" />
          </div>
          {sortedMonthly.length === 0 ? (
            <p>No monthly analytics available</p>
          ) : (
            <div className="matches-table-container" id="podcast-monthly-table">
              <table className="matches-table podcast-monthly-table">
                <thead>
                  <tr>
                    <th
                      aria-sort={monthlySort.key === 'month' ? `${monthlySort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleMonthlySort('month', 'desc')}
                      >
                        Month
                        <span className="sort-indicator">{getSortIndicator(monthlySort, 'month')}</span>
                      </button>
                    </th>
                    <th
                      aria-sort={monthlySort.key === 'downloads' ? `${monthlySort.direction}ending` : 'none'}
                    >
                      <button
                        type="button"
                        className="podcast-sort-button"
                        onClick={() => toggleMonthlySort('downloads', 'desc')}
                      >
                        Downloads
                        <span className="sort-indicator">{getSortIndicator(monthlySort, 'downloads')}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthly.map((month) => {
                    const width = maxMonthly
                      ? Math.round((month.downloads / maxMonthly) * 100)
                      : 0
                    return (
                      <tr key={month.month}>
                        <td className="podcast-month-label">{month.month}</td>
                        <td>
                          <div className="podcast-monthly-cell">
                            <div className="podcast-month-bar">
                              <span style={{ width: `${width}%` }} />
                            </div>
                            <div className="podcast-month-value">
                              {month.downloads?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="podcast-panel" id="podcast-apps">
          <h3>Podcast app</h3>
          {appSegments.length === 0 ? (
            <p>No app analytics available</p>
          ) : (
            <div className="podcast-apps-grid">
              <div className="podcast-apps-chart">
                <div
                  className="podcast-apps-circle"
                  style={{ background: appGradient }}
                  aria-label="Podcast app usage chart"
                />
                <div className="podcast-apps-total">
                  {appTotal.toLocaleString()} listens
                </div>
              </div>
              <div className="podcast-apps-legend">
                {appSegments.map((segment) => (
                  <div className="podcast-apps-legend-row" key={segment.name}>
                    <span className="podcast-apps-dot" style={{ background: segment.color }} />
                    <span className="podcast-apps-name">{segment.name}</span>
                    <span className="podcast-apps-percent">
                      {segment.percentage.toFixed(1)}%
                    </span>
                    <span className="podcast-apps-value">
                      {segment.downloads.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PodcastSection
