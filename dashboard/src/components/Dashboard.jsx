import React, { useState, useEffect } from 'react'
import AllMatchesOverview from './AllMatchesOverview'
import FutureMatchesSection from './FutureMatchesSection'
import PodcastSection from './PodcastSection'
import Top5GamesSection from './Top5GamesSection'
import CommentatorDuosSection from './CommentatorDuosSection'
import ResultAnalysisSection from './ResultAnalysisSection'
import HomeAwayAnalysisSection from './HomeAwayAnalysisSection'
import TVCategoryAnalysisSection from './TVCategoryAnalysisSection'
import CommentatorsSection from './CommentatorsSection'
import KickoffBlocksSection from './KickoffBlocksSection'
import WeekdaySection from './WeekdaySection'
import './Dashboard.css'

function Dashboard() {
  const [data, setData] = useState({
    allMatches: null,
    top5Games: null,
    commentatorDuos: null,
    byResult: null,
    byHomeAway: null,
    byTVCategory: null,
    commentators: null,
    kickoffBlocks: null,
    weekday: null,
    futureMatches: null,
    podcastEpisodes: null,
    podcastMonthly: null,
    podcastApps: null
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('radio')

  const loadData = async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    const cacheBuster = `?t=${Date.now()}`

    try {
      const [
        allMatchesRes,
        top5GamesRes,
        commentatorDuosRes,
        byResultRes,
        byHomeAwayRes,
        byTVCategoryRes,
        commentatorsRes,
        kickoffRes,
        weekdayRes,
        futureMatchesRes,
        podcastEpisodesRes,
        podcastMonthlyRes,
        podcastAppsRes
      ] = await Promise.all([
        fetch(`/output/all_matches.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/top5_games.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/commentator_duos.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/by_result.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/by_home_away.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/by_tv_category.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/commentators_full_credit.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/kickoff_blocks.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/weekday.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/future_matches.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_episodes.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_monthly.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_apps.json${cacheBuster}`, { cache: 'no-store' })
      ])

      if (!allMatchesRes.ok || !top5GamesRes.ok || !commentatorDuosRes.ok ||
          !byResultRes.ok || !byHomeAwayRes.ok || !byTVCategoryRes.ok ||
          !commentatorsRes.ok || !kickoffRes.ok || !weekdayRes.ok || !futureMatchesRes.ok) {
        throw new Error('Failed to load data files')
      }
      if (!podcastEpisodesRes.ok || !podcastMonthlyRes.ok || !podcastAppsRes.ok) {
        throw new Error('Failed to load podcast data files')
      }

      const [
        allMatchesData,
        top5GamesData,
        commentatorDuosData,
        byResultData,
        byHomeAwayData,
        byTVCategoryData,
        commentatorsData,
        kickoffData,
        weekdayData,
        futureMatchesData,
        podcastEpisodesData,
        podcastMonthlyData,
        podcastAppsData
      ] = await Promise.all([
        allMatchesRes.json(),
        top5GamesRes.json(),
        commentatorDuosRes.json(),
        byResultRes.json(),
        byHomeAwayRes.json(),
        byTVCategoryRes.json(),
        commentatorsRes.json(),
        kickoffRes.json(),
        weekdayRes.json(),
        futureMatchesRes.json(),
        podcastEpisodesRes.json(),
        podcastMonthlyRes.json(),
        podcastAppsRes.json()
      ])

      setData({
        allMatches: allMatchesData,
        top5Games: top5GamesData,
        commentatorDuos: commentatorDuosData,
        byResult: byResultData,
        byHomeAway: byHomeAwayData,
        byTVCategory: byTVCategoryData,
        commentators: commentatorsData.commentators || [],
        kickoffBlocks: kickoffData.kickoff_blocks || [],
        weekday: weekdayData.weekdays || [],
        futureMatches: futureMatchesData,
        podcastEpisodes: podcastEpisodesData,
        podcastMonthly: podcastMonthlyData,
        podcastApps: podcastAppsData
      })
    } catch (err) {
      setError(err.message)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  const triggerDataUpdate = async () => {
    setUpdating(true)
    setUpdateMessage('')

    try {
      const response = await fetch('/api/refresh-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        let errorMessage = 'Failed to start data update'
        try {
          const payload = await response.json()
          if (payload && payload.message) {
            errorMessage = payload.message
          }
        } catch {
          // Ignore JSON parsing issues
        }
        throw new Error(errorMessage)
      }

      const payload = await response.json().catch(() => ({}))
      const message = payload.message || 'Update started. Data will refresh shortly.'
      setUpdateMessage(message)

      setTimeout(() => {
        loadData({ isRefresh: true })
      }, 15000)
    } catch (err) {
      setUpdateMessage(err.message)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const hasData = Boolean(
    data.allMatches &&
    data.top5Games &&
    data.commentatorDuos &&
    data.byResult &&
    data.byHomeAway &&
    data.byTVCategory &&
    data.commentators &&
    data.kickoffBlocks &&
    data.weekday &&
    data.futureMatches &&
    data.podcastEpisodes &&
    data.podcastMonthly &&
    data.podcastApps
  )

  if (loading && !hasData) {
    return (
      <div className="dashboard-container">
        <h1>Ajax Radio Dashboard</h1>
        <p>Loading data...</p>
      </div>
    )
  }

  if (error && !hasData) {
    return (
      <div className="dashboard-container">
        <h1>Ajax Radio Dashboard</h1>
        <p className="error">Error: {error}</p>
        <p>Make sure the JSON files are in the /output directory</p>
      </div>
    )
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <img
            className="dashboard-logo"
            src="https://burobros.nl/klanten/sportsounds/wp-content/uploads/2026/01/zessenlogo-zwart.png"
            alt="Zessen logo"
          />
          <nav className="dashboard-side-nav">
            <button
              type="button"
              className={activeTab === 'radio' ? 'is-active' : ''}
              onClick={() => setActiveTab('radio')}
            >
              Radio
            </button>
            <button
              type="button"
              className={activeTab === 'podcast' ? 'is-active' : ''}
              onClick={() => setActiveTab('podcast')}
            >
              Podcast
            </button>
          </nav>
        </aside>

        <div className="dashboard-main">
          {activeTab === 'radio' ? (
            <>
              <header>
                <div className="dashboard-header-top">
                  <h1 className="dashboard-title">Ajax Radio Dashboard</h1>
                </div>
                <nav className="dashboard-nav">
                  <a href="#all-matches" onClick={(e) => { e.preventDefault(); scrollToSection('all-matches') }}>
                    All Matches
                  </a>
                  <a href="#future-matches" onClick={(e) => { e.preventDefault(); scrollToSection('future-matches') }}>
                    Future Matches
                  </a>
                  <a href="#top5-games" onClick={(e) => { e.preventDefault(); scrollToSection('top5-games') }}>
                    Top 5 Games
                  </a>
                  <a href="#by-result" onClick={(e) => { e.preventDefault(); scrollToSection('by-result') }}>
                    By Result
                  </a>
                  <a href="#by-home-away" onClick={(e) => { e.preventDefault(); scrollToSection('by-home-away') }}>
                    Home/Away
                  </a>
                  <a href="#by-tv-category" onClick={(e) => { e.preventDefault(); scrollToSection('by-tv-category') }}>
                    TV Categories
                  </a>
                  <a href="#kickoff-blocks" onClick={(e) => { e.preventDefault(); scrollToSection('kickoff-blocks') }}>
                    Kickoff Blocks
                  </a>
                  <a href="#weekday" onClick={(e) => { e.preventDefault(); scrollToSection('weekday') }}>
                    Weekday
                  </a>
                  <a href="#commentators" onClick={(e) => { e.preventDefault(); scrollToSection('commentators') }}>
                    Commentators
                  </a>
                  <a href="#commentator-duos" onClick={(e) => { e.preventDefault(); scrollToSection('commentator-duos') }}>
                    Commentator Duos
                  </a>
                </nav>
              </header>

              <section className="dashboard-section" id="all-matches">
                <AllMatchesOverview data={data.allMatches} />
              </section>

              <section className="dashboard-section" id="future-matches">
                <FutureMatchesSection data={data.futureMatches} />
              </section>

              <section className="dashboard-section" id="top5-games">
                <Top5GamesSection data={data.top5Games} />
              </section>

              <section className="dashboard-section" id="by-result">
                <ResultAnalysisSection data={data.byResult} />
              </section>

              <section className="dashboard-section" id="by-home-away">
                <HomeAwayAnalysisSection data={data.byHomeAway} />
              </section>

              <section className="dashboard-section" id="by-tv-category">
                <TVCategoryAnalysisSection data={data.byTVCategory} />
              </section>

              <section className="dashboard-section" id="kickoff-blocks">
                <KickoffBlocksSection data={data.kickoffBlocks} />
              </section>

              <section className="dashboard-section" id="weekday">
                <WeekdaySection data={data.weekday} />
              </section>

              <section className="dashboard-section" id="commentators">
                <CommentatorsSection data={data.commentators} />
              </section>

              <section className="dashboard-section" id="commentator-duos">
                <CommentatorDuosSection data={data.commentatorDuos} />
              </section>
            </>
          ) : (
            <>
              <header>
                <div className="dashboard-header-top">
                  <h1 className="dashboard-title">Ajax Podcast Dashboard</h1>
                </div>
              </header>

              <section className="dashboard-section" id="podcast">
                <PodcastSection
                  episodes={data.podcastEpisodes}
                  monthly={data.podcastMonthly}
                  apps={data.podcastApps}
                />
              </section>
            </>
          )}

          <div className="dashboard-refresh-footer">
            <button
              type="button"
              className="refresh-button"
              onClick={triggerDataUpdate}
              disabled={loading || refreshing || updating}
              aria-busy={updating || refreshing}
            >
              {updating ? 'Starting Update...' : 'Refresh Data'}
            </button>
            {error ? <p className="error">Refresh failed: {error}</p> : null}
            {updateMessage ? (
              <p className={`status-message ${updateMessage.startsWith('Failed') ? 'error' : ''}`}>
                {updateMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
