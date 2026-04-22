import React, { useState, useMemo } from 'react'
import ExportPdfButton from './ExportPdfButton'
import './AllMatchesOverview.css'

function AllMatchesOverview({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="section">
        <h2>All Matches Overview</h2>
        <p>No match data available</p>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const CLUB_LOGOS = {
    ajax: 'https://crests.football-data.org/678.svg',
    psv: 'https://crests.football-data.org/674.svg',
    feyenoord: 'https://crests.football-data.org/675.svg',
    twente: 'https://crests.football-data.org/666.svg',
    az: 'https://crests.football-data.org/682.svg',
    nec: 'https://crests.football-data.org/1915.svg',
    heracles: 'https://crests.football-data.org/683.svg',
    groningen: 'https://crests.football-data.org/677.svg',
    zwolle: 'https://crests.football-data.org/684.svg',
    excelsior: 'https://crests.football-data.org/676.svg',
    sparta: 'https://crests.football-data.org/6806.svg',
    fortuna: 'https://crests.football-data.org/1926.svg',
    heerenveen: 'https://crests.football-data.org/673.svg',
    utrecht: 'https://crests.football-data.org/6761.svg',
    nac: 'https://crests.football-data.org/681.svg',
    'go ahead eagles': 'https://crests.football-data.org/718.svg',
    volendam: 'https://crests.football-data.org/1914.svg',
    olympiacos: 'https://crests.football-data.org/654.svg',
    villarreal: 'https://crests.football-data.org/94.svg',
    panathinaikos: 'https://crests.football-data.org/782.svg',
    vojvodina: 'https://crests.football-data.org/1884.svg',
    'as monaco': 'https://crests.football-data.org/548.svg',
    telstar: 'https://crests.football-data.org/7187.svg'
  }

  const TEAM_ALIASES = {
    nec: 'nec',
    'nec nijmegen': 'nec',
    'n.e.c': 'nec',
    'n.e.c.': 'nec',
    psv: 'psv',
    'psv eindhoven': 'psv',
    az: 'az',
    'az alkmaar': 'az',
    ajax: 'ajax',
    'afc ajax': 'ajax',
    feyenoord: 'feyenoord',
    'feyenoord rotterdam': 'feyenoord',
    twente: 'twente',
    'fc twente': 'twente',
    fortuna: 'fortuna',
    'fortuna sittard': 'fortuna',
    'go ahead': 'go ahead eagles',
    'go ahead eagles': 'go ahead eagles',
    'go ahead eagles deventer': 'go ahead eagles',
    sparta: 'sparta',
    'sparta rotterdam': 'sparta',
    'fc groningen': 'groningen',
    'pec zwolle': 'zwolle',
    'sc heerenveen': 'heerenveen',
    'fc utrecht': 'utrecht',
    'fc volendam': 'volendam',
    'as monaco fc': 'as monaco'
  }

  const normalizeTeamName = (name = '') => {
    const normalized = name
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return TEAM_ALIASES[normalized] || normalized
  }

  const getOpponentTeam = (matchName = '') => {
    const parts = matchName.split(' - ').map((p) => p.trim()).filter(Boolean)
    if (parts.length !== 2) return null
    const [left, right] = parts
    const leftNorm = normalizeTeamName(left)
    const rightNorm = normalizeTeamName(right)
    if (leftNorm.includes('ajax')) return right
    if (rightNorm.includes('ajax')) return left
    return null
  }

  const getLogoUrlForTeam = (teamName = '') => {
    const normalized = normalizeTeamName(teamName)
    if (CLUB_LOGOS[normalized]) return CLUB_LOGOS[normalized]
    const entry = Object.entries(CLUB_LOGOS).find(([key]) => normalized.includes(key))
    return entry ? entry[1] : null
  }

  const getMatchLogoUrls = (matchName = '') => {
    const opponent = getOpponentTeam(matchName)
    const ajaxLogo = CLUB_LOGOS.ajax || null
    const opponentLogo = opponent ? getLogoUrlForTeam(opponent) : null
    return [ajaxLogo, opponentLogo]
  }

  const getResultClass = (result) => {
    if (result === 'W') return 'result-win'
    if (result === 'D') return 'result-draw'
    if (result === 'L') return 'result-loss'
    return ''
  }

  const getResultLabel = (result) => {
    if (result === 'W') return 'W'
    if (result === 'D') return 'D'
    if (result === 'L') return 'L'
    return '-'
  }

  const calculateMediaValue = (listeners) => {
    if (!listeners) return 0
    return (listeners / 1000) * 25
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedMatches = useMemo(() => {
    const sorted = [...data.matches]
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle date sorting
      if (sortConfig.key === 'date') {
        aVal = a.date || ''
        bVal = b.date || ''
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      // Handle numeric sorting (listeners, media value)
      if (sortConfig.key === 'listeners' || sortConfig.key === 'mediaValue') {
        aVal = sortConfig.key === 'mediaValue' 
          ? calculateMediaValue(a.listeners)
          : (a.listeners || 0)
        bVal = sortConfig.key === 'mediaValue'
          ? calculateMediaValue(b.listeners)
          : (b.listeners || 0)
        return sortConfig.direction === 'asc' 
          ? aVal - bVal
          : bVal - aVal
      }

      // Handle string sorting
      aVal = (aVal || '').toString().toLowerCase()
      bVal = (bVal || '').toString().toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aVal.localeCompare(bVal)
      } else {
        return bVal.localeCompare(aVal)
      }
    })
    return sorted
  }, [data.matches, sortConfig])

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="section all-matches-overview">
      <div className="section-header-row">
        <div>
          <h2>All Matches Overview</h2>
          <p className="section-subtitle">from july 2024</p>
        </div>
        <ExportPdfButton targetId="all-matches-table" filename="all-matches.pdf" />
      </div>
      <div className="matches-table-container" id="all-matches-table">
        <table className="matches-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('date')}>
                Date {getSortIcon('date')}
              </th>
              <th className="sortable" onClick={() => handleSort('weekday')}>
                Day {getSortIcon('weekday')}
              </th>
              <th className="sortable" onClick={() => handleSort('time')}>
                Time {getSortIcon('time')}
              </th>
              <th className="logo-header">
                Clubs
              </th>
              <th className="sortable" onClick={() => handleSort('match_name')}>
                Match {getSortIcon('match_name')}
              </th>
              <th>
                Commentators
              </th>
              <th className="sortable" onClick={() => handleSort('tv_channel')}>
                TV Channel {getSortIcon('tv_channel')}
              </th>
              <th className="sortable" onClick={() => handleSort('score')}>
                Score {getSortIcon('score')}
              </th>
              <th className="sortable" onClick={() => handleSort('result')}>
                Result {getSortIcon('result')}
              </th>
              <th className="sortable" onClick={() => handleSort('listeners')}>
                Listeners {getSortIcon('listeners')}
              </th>
              <th className="sortable" onClick={() => handleSort('mediaValue')}>
                Media Value {getSortIcon('mediaValue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((match, index) => {
              const [ajaxLogoUrl, opponentLogoUrl] = getMatchLogoUrls(match.match_name)
              return (
              <tr key={index}>
                <td>{formatDate(match.date)}</td>
                <td>{match.weekday || 'N/A'}</td>
                <td>{match.time || 'N/A'}</td>
                <td className="club-logo-cell">
                  <div className="club-logos-stack" aria-hidden="true">
                    {ajaxLogoUrl ? (
                      <img
                        src={ajaxLogoUrl}
                        alt=""
                        className="club-logo"
                        loading="lazy"
                      />
                    ) : (
                      <span className="club-logo-placeholder" />
                    )}
                    {opponentLogoUrl ? (
                      <img
                        src={opponentLogoUrl}
                        alt=""
                        className="club-logo"
                        loading="lazy"
                      />
                    ) : (
                      <span className="club-logo-placeholder" />
                    )}
                  </div>
                </td>
                <td>{match.match_name || 'N/A'}</td>
                <td>{match.commentators || 'N/A'}</td>
                <td>{match.tv_channel || 'N/A'}</td>
                <td>{match.score || 'N/A'}</td>
                <td>
                  <span className={`result-badge ${getResultClass(match.result)}`}>
                    {getResultLabel(match.result)}
                  </span>
                </td>
                <td>{match.listeners ? match.listeners.toLocaleString() : 'N/A'}</td>
                <td className="media-value-cell">
                  {match.listeners ? formatCurrency(calculateMediaValue(match.listeners)) : 'N/A'}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AllMatchesOverview
