import React, { useState, useEffect } from 'react'
import AllMatchesOverview from './AllMatchesOverview'
import FutureMatchesSection from './FutureMatchesSection'
import PodcastSection from './PodcastSection'
import Top5GamesSection from './Top5GamesSection'
import CommentatorDuosSection from './CommentatorDuosSection'
import ResultAnalysisSection from './ResultAnalysisSection'
import HomeAwayAnalysisSection from './HomeAwayAnalysisSection'
import TVCategoryAnalysisSection from './TVCategoryAnalysisSection'
import KickoffBlocksSection from './KickoffBlocksSection'
import WeekdaySection from './WeekdaySection'
import EngagementSection from './EngagementSection'
import PlatformMixTrendSection from './PlatformMixTrendSection'
import GeoTrendSection from './GeoTrendSection'
import { exportElementToPdf } from '../utils/exportPdf'
import sportSoundsLogo from '../assets/sport-sounds-wordmark-black.png'
import ajaxCrest from '../assets/ajax-crest.png'
import './Dashboard.css'

const RADIO_TABS = [
  { id: 'overzicht', label: 'Overzicht', title: 'Ajax Radio' },
  { id: 'wedstrijden', label: 'Wedstrijden', title: 'Wedstrijden' },
  { id: 'analyse', label: 'Analyse', title: 'Analyse' },
  { id: 'streaming', label: 'Streaming', title: 'Streaming' }
]

// Oude ankerlinks (van vóór de tabbladen) blijven werken: ze openen het juiste tabblad.
const LEGACY_ANCHORS = {
  'all-matches': 'wedstrijden',
  'future-matches': 'wedstrijden',
  'top5-games': 'overzicht',
  'by-result': 'analyse',
  'by-home-away': 'analyse',
  'by-tv-category': 'analyse',
  'kickoff-blocks': 'analyse',
  weekday: 'analyse',
  'commentator-duos': 'analyse',
  engagement: 'streaming',
  'platform-mix-trend': 'streaming',
  'geo-trend': 'streaming'
}

function readHash(lastRadioTab = 'overzicht') {
  const hash = window.location.hash.slice(1)
  if (hash === 'podcast') return { product: 'podcast', tab: lastRadioTab, lastRadioTab, anchor: null }
  if (RADIO_TABS.some((tab) => tab.id === hash)) return { product: 'radio', tab: hash, lastRadioTab: hash, anchor: null }
  if (LEGACY_ANCHORS[hash]) {
    const tab = LEGACY_ANCHORS[hash]
    return { product: 'radio', tab, lastRadioTab: tab, anchor: hash }
  }
  return { product: 'radio', tab: lastRadioTab, lastRadioTab, anchor: null }
}

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
    recentPredictions: null,
    podcastEpisodes: null,
    podcastMonthly: null,
    podcastApps: null
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [error, setError] = useState(null)
  const [view, setView] = useState(() => readHash())
  const [exporting, setExporting] = useState(false)

  const goTo = (target) => {
    window.location.hash = target
  }

  useEffect(() => {
    const onHashChange = () => {
      setView((current) => readHash(current.lastRadioTab))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Na het laden naar een oud anker scrollen, zodat bestaande links blijven kloppen.
  useEffect(() => {
    if (!view.anchor || loading) return
    // Sommige secties laden hun eigen data en worden pas later hoog; daarom nog eens na een korte pauze.
    const scroll = () => document.getElementById(view.anchor)?.scrollIntoView({ block: 'start' })
    scroll()
    const timer = setTimeout(scroll, 700)
    return () => clearTimeout(timer)
  }, [view, loading])

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
        recentPredictionsRes,
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
        fetch(`/output/recent_predictions.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_episodes.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_monthly.json${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/output/podcast_apps.json${cacheBuster}`, { cache: 'no-store' })
      ])

      if (!allMatchesRes.ok || !top5GamesRes.ok || !commentatorDuosRes.ok ||
          !byResultRes.ok || !byHomeAwayRes.ok || !byTVCategoryRes.ok ||
          !commentatorsRes.ok || !kickoffRes.ok || !weekdayRes.ok || !futureMatchesRes.ok ||
          !recentPredictionsRes.ok) {
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
        recentPredictionsData,
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
        recentPredictionsRes.json(),
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
        recentPredictions: recentPredictionsData,
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
    const storageKey = 'refreshSecret'
    let secret = ''
    try {
      secret = localStorage.getItem(storageKey) || ''
    } catch {
      // localStorage niet beschikbaar; dan elke keer vragen
    }
    if (!secret) {
      secret = (window.prompt('Refresh-code') || '').trim()
      if (!secret) return
    }

    setUpdating(true)
    setUpdateMessage('')

    try {
      const response = await fetch('/api/refresh-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Refresh-Secret': secret
        }
      })

      try {
        if (response.status === 401) {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(storageKey, secret)
        }
      } catch {
        // negeren
      }

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
    data.recentPredictions &&
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

  const currentSeason = '26/27'
  const radioSeasonStart = '2026-07-01'
  const radioSeasonMatches = (data.allMatches?.matches || []).filter(
    (match) => match?.date && match.date >= radioSeasonStart
  )
  const radioListenersTotal = radioSeasonMatches.reduce((sum, match) => sum + (match.listeners || 0), 0)
  const radioMatchesWithListeners = radioSeasonMatches.filter((match) => match.listeners).length
  const radioAverage = radioMatchesWithListeners ? radioListenersTotal / radioMatchesWithListeners : 0

  const podcastSeasonStart = '2026-07'
  const podcastListenersTotal = data.podcastMonthly?.months
    ? data.podcastMonthly.months.reduce((sum, month) => {
        if (!month?.month || month.month < podcastSeasonStart) return sum
        return sum + (month.downloads || 0)
      }, 0)
    : 0

  const totalListeners = radioListenersTotal + podcastListenersTotal
  const nextMatch = data.futureMatches?.matches?.[0] || null
  const formatNumber = (value) => Math.round(value || 0).toLocaleString('nl-NL')
  const formatDate = (iso) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

  const activeRadioTab = RADIO_TABS.find((tab) => tab.id === view.tab) || RADIO_TABS[0]
  const pageTitle = view.product === 'podcast' ? 'Ajax Podcast' : activeRadioTab.title
  const kicker = view.product === 'podcast' ? `Podcast · ${currentSeason}` : `Radio · ${currentSeason}`

  const handleExport = async () => {
    const element = document.getElementById('dashboard-content')
    if (!element) return
    setExporting(true)
    try {
      const name = view.product === 'podcast' ? 'podcast' : view.tab
      const today = new Date().toISOString().slice(0, 10)
      await exportElementToPdf(element, `ajax-radio-${name}-${today}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  const renderRadioTab = () => {
    switch (view.tab) {
      case 'wedstrijden':
        return (
          <>
            <section className="dashboard-section" id="all-matches">
              <AllMatchesOverview data={data.allMatches} />
            </section>
            <section className="dashboard-section" id="future-matches">
              <FutureMatchesSection data={data.futureMatches} recentPredictions={data.recentPredictions} />
            </section>
          </>
        )
      case 'analyse':
        return (
          <>
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
            <section className="dashboard-section" id="commentator-duos">
              <CommentatorDuosSection data={data.commentatorDuos} />
            </section>
          </>
        )
      case 'streaming':
        return (
          <>
            <section className="dashboard-section" id="engagement">
              <EngagementSection />
            </section>
            <section className="dashboard-section" id="platform-mix-trend">
              <PlatformMixTrendSection />
            </section>
            <section className="dashboard-section" id="geo-trend">
              <GeoTrendSection />
            </section>
          </>
        )
      default:
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-tile">
                <div className="kpi-label">Totaal bereik {currentSeason}</div>
                <div className="kpi-value">{formatNumber(totalListeners)}</div>
                <div className="kpi-meta">Radio + podcast</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-label">Radio-luisteraars</div>
                <div className="kpi-value">{formatNumber(radioListenersTotal)}</div>
                <div className="kpi-meta">
                  {radioMatchesWithListeners} wedstrijden · gem. {formatNumber(radioAverage)}
                </div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-label">Podcast-downloads</div>
                <div className="kpi-value">{formatNumber(podcastListenersTotal)}</div>
                <div className="kpi-meta">Sinds juli 2026</div>
              </div>
              <a className="kpi-tile kpi-tile-link" href="#wedstrijden">
                <div className="kpi-label">Volgende wedstrijd</div>
                <div className="kpi-value">{nextMatch ? formatNumber(nextMatch.predicted_listeners) : '—'}</div>
                <div className="kpi-meta">
                  {nextMatch ? `${nextMatch.match_name} · ${formatDate(nextMatch.date)} · voorspeld` : 'Geen wedstrijd gepland'}
                </div>
              </a>
            </div>
            <section className="dashboard-section" id="top5-games">
              <Top5GamesSection data={data.top5Games} />
            </section>
          </>
        )
    }
  }

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <img className="topbar-logo-ss" src={sportSoundsLogo} alt="Sport Sounds" />
            <span className="topbar-x" aria-hidden="true">×</span>
            <img
              className="topbar-logo-ajax"
              src={ajaxCrest}
              alt="AFC Ajax"
            />
          </div>

          <div className="segmented topbar-product" role="group" aria-label="Product">
            <button type="button" aria-pressed={view.product === 'radio'} onClick={() => goTo(view.lastRadioTab)}>
              Radio
            </button>
            <button type="button" aria-pressed={view.product === 'podcast'} onClick={() => goTo('podcast')}>
              Podcast
            </button>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-button"
              onClick={handleExport}
              disabled={exporting}
              title="Huidige tab opslaan als PDF"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
              <span className="topbar-button-label">{exporting ? 'Bezig…' : 'Exporteer'}</span>
            </button>
            <button
              type="button"
              className="topbar-button topbar-button-primary"
              onClick={triggerDataUpdate}
              disabled={loading || refreshing || updating}
              aria-busy={updating || refreshing}
              title="Nieuwe cijfers ophalen"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>
              <span className="topbar-button-label">{updating ? 'Starten…' : 'Ververs'}</span>
            </button>
          </div>
        </div>

        {view.product === 'radio' ? (
          <nav className="subnav" aria-label="Radio">
            {RADIO_TABS.map((tab) => (
              <a key={tab.id} href={`#${tab.id}`} aria-current={view.tab === tab.id ? 'page' : undefined}>
                {tab.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      {error || updateMessage ? (
        <div className="status-bar" role="status">
          {error ? <p className="error">Laden mislukt: {error}</p> : null}
          {updateMessage ? <p className="status-message">{updateMessage}</p> : null}
        </div>
      ) : null}

      <main className="dashboard-main" id="dashboard-content">
        <div className="page-head">
          <p className="page-kicker">{kicker}</p>
          <h1 className="page-title">{pageTitle}</h1>
        </div>

        {view.product === 'podcast' ? (
          <section className="dashboard-section" id="podcast">
            <PodcastSection episodes={data.podcastEpisodes} monthly={data.podcastMonthly} apps={data.podcastApps} />
          </section>
        ) : (
          renderRadioTab()
        )}
      </main>
    </div>
  )
}

export default Dashboard
