import React, { useState, useEffect, useMemo } from 'react'
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
import { analyzeMatches, top5BySeason } from '../utils/analysis'
import { ALL_SEASONS, currentSeason as getCurrentSeason, isInSeason, seasonShort, seasonsInData } from '../utils/season'
import { formatDateWithDay, formatNumber } from '../utils/format'
import sportSoundsLogo from '../assets/sport-sounds-wordmark-black.png'
import ajaxCrest from '../assets/ajax-crest.png'
import './Dashboard.css'

const SEASON_STORAGE_KEY = 'dashboardSeason'

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
    futureMatches: null,
    recentPredictions: null,
    podcastEpisodes: null,
    podcastMonthly: null,
    podcastApps: null,
    meta: null
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [error, setError] = useState(null)
  const [view, setView] = useState(() => readHash())
  const [exporting, setExporting] = useState(false)
  const [season, setSeason] = useState(() => {
    try {
      return localStorage.getItem(SEASON_STORAGE_KEY) || getCurrentSeason()
    } catch {
      return getCurrentSeason()
    }
  })

  const chooseSeason = (value) => {
    setSeason(value)
    try {
      localStorage.setItem(SEASON_STORAGE_KEY, value)
    } catch {
      // niet opslaan is geen probleem
    }
  }

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
    const getJson = async (file) => {
      const response = await fetch(`/output/${file}${cacheBuster}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`${file} kon niet worden geladen`)
      return response.json()
    }

    try {
      // Analyses en top 5 rekent de app zelf uit all_matches.json, zodat ze per seizoen kunnen.
      const [allMatches, futureMatches, recentPredictions, podcastEpisodes, podcastMonthly, podcastApps] =
        await Promise.all([
          getJson('all_matches.json'),
          getJson('future_matches.json'),
          getJson('recent_predictions.json'),
          getJson('podcast_episodes.json'),
          getJson('podcast_monthly.json'),
          getJson('podcast_apps.json')
        ])
      // meta.json (tijdstip van de laatste pipeline-run) is optioneel.
      const meta = await getJson('meta.json').catch(() => null)

      setData({ allMatches, futureMatches, recentPredictions, podcastEpisodes, podcastMonthly, podcastApps, meta })
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
        let errorMessage = 'Starten van de update is mislukt.'
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
      const message = payload.message || 'Update gestart. De nieuwe cijfers staan over een paar minuten live.'
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

  const allMatchList = data.allMatches?.matches || []
  const seasonOptions = useMemo(() => seasonsInData(allMatchList.map((match) => match.date)), [allMatchList])
  const thisSeason = getCurrentSeason()
  const activeSeason = season === ALL_SEASONS || seasonOptions.includes(season) ? season : thisSeason

  const seasonMatches = useMemo(
    () => allMatchList.filter((match) => isInSeason(match.date, activeSeason)),
    [allMatchList, activeSeason]
  )
  const analyses = useMemo(() => analyzeMatches(seasonMatches), [seasonMatches])
  const top5 = useMemo(() => {
    const all = top5BySeason(allMatchList)
    return activeSeason === ALL_SEASONS ? all : { [activeSeason]: all[activeSeason] || [] }
  }, [allMatchList, activeSeason])

  const hasData = Boolean(
    data.allMatches &&
    data.futureMatches &&
    data.recentPredictions &&
    data.podcastEpisodes &&
    data.podcastMonthly &&
    data.podcastApps
  )

  if (loading && !hasData) {
    return (
      <div className="dashboard-container dashboard-message">
        <h1>Ajax Radio Dashboard</h1>
        <p>Cijfers laden…</p>
      </div>
    )
  }

  if (error && !hasData) {
    return (
      <div className="dashboard-container dashboard-message">
        <h1>Ajax Radio Dashboard</h1>
        <p className="error">Fout: {error}</p>
        <p>Controleer of de JSON-bestanden in /output staan.</p>
      </div>
    )
  }

  const seasonLabel = seasonShort(activeSeason)
  const radioListenersTotal = seasonMatches.reduce((sum, match) => sum + (match.listeners || 0), 0)
  const radioMatchesWithListeners = seasonMatches.filter((match) => match.listeners).length
  const radioAverage = radioMatchesWithListeners ? radioListenersTotal / radioMatchesWithListeners : 0
  const bestMatch = seasonMatches.reduce((best, match) => ((match.listeners || 0) > (best?.listeners || 0) ? match : best), null)

  const podcastListenersTotal = (data.podcastMonthly?.months || []).reduce(
    (sum, month) => (isInSeason(month?.month, activeSeason) ? sum + (month.downloads || 0) : sum),
    0
  )

  const totalListeners = radioListenersTotal + podcastListenersTotal
  const isCurrentSeason = activeSeason === thisSeason || activeSeason === ALL_SEASONS
  const nextMatch = isCurrentSeason ? data.futureMatches?.matches?.[0] || null : null

  const updatedAt = data.meta?.generated_at ? new Date(data.meta.generated_at) : null
  const updatedLabel =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : null

  const activeRadioTab = RADIO_TABS.find((tab) => tab.id === view.tab) || RADIO_TABS[0]
  const pageTitle = view.product === 'podcast' ? 'Ajax Podcast' : activeRadioTab.title
  const kicker = `${view.product === 'podcast' ? 'Podcast' : 'Radio'} · ${seasonLabel}`

  const handleExport = async () => {
    const element = document.getElementById('dashboard-content')
    if (!element) return
    setExporting(true)
    try {
      // PDF-bibliotheken pas laden bij de eerste export; dat scheelt laadtijd voor iedereen.
      const { exportElementToPdf } = await import('../utils/exportPdf')
      const name = view.product === 'podcast' ? 'podcast' : view.tab
      const seasonPart = activeSeason === ALL_SEASONS ? 'alle-seizoenen' : seasonLabel.replace('/', '-')
      const today = new Date().toISOString().slice(0, 10)
      await exportElementToPdf(element, `ajax-radio-${name}-${seasonPart}-${today}.pdf`)
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
              <AllMatchesOverview data={{ matches: seasonMatches }} seasonLabel={seasonLabel} />
            </section>
            {isCurrentSeason ? (
              <section className="dashboard-section" id="future-matches">
                <FutureMatchesSection data={data.futureMatches} recentPredictions={data.recentPredictions} />
              </section>
            ) : null}
          </>
        )
      case 'analyse':
        return (
          <>
            <section className="dashboard-section" id="by-result">
              <ResultAnalysisSection data={analyses.byResult} />
            </section>
            <section className="dashboard-section" id="by-home-away">
              <HomeAwayAnalysisSection data={analyses.byHomeAway} />
            </section>
            <section className="dashboard-section" id="by-tv-category">
              <TVCategoryAnalysisSection data={analyses.byTVCategory} />
            </section>
            <section className="dashboard-section" id="kickoff-blocks">
              <KickoffBlocksSection data={analyses.kickoffBlocks} />
            </section>
            <section className="dashboard-section" id="weekday">
              <WeekdaySection data={analyses.weekday} />
            </section>
            <section className="dashboard-section" id="commentator-duos">
              <CommentatorDuosSection data={analyses.commentatorDuos} />
            </section>
          </>
        )
      case 'streaming':
        return (
          <>
            <section className="dashboard-section" id="engagement">
              <EngagementSection season={activeSeason} />
            </section>
            <section className="dashboard-section" id="platform-mix-trend">
              <PlatformMixTrendSection season={activeSeason} />
            </section>
            <section className="dashboard-section" id="geo-trend">
              <GeoTrendSection season={activeSeason} />
            </section>
          </>
        )
      default:
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-tile">
                <div className="kpi-label">Totaal bereik</div>
                <div className="kpi-value">{formatNumber(totalListeners)}</div>
                <div className="kpi-meta">Radio + podcast · {seasonLabel}</div>
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
                <div className="kpi-meta">{seasonLabel}</div>
              </div>
              {nextMatch ? (
                <a className="kpi-tile kpi-tile-link" href="#wedstrijden">
                  <div className="kpi-label">Volgende wedstrijd</div>
                  <div className="kpi-value">{formatNumber(nextMatch.predicted_listeners)}</div>
                  <div className="kpi-meta">
                    {nextMatch.match_name} · {formatDateWithDay(nextMatch.date)} · voorspeld
                  </div>
                </a>
              ) : (
                <div className="kpi-tile">
                  <div className="kpi-label">Beste wedstrijd</div>
                  <div className="kpi-value">{formatNumber(bestMatch?.listeners)}</div>
                  <div className="kpi-meta">
                    {bestMatch ? `${bestMatch.match_name} · ${formatDateWithDay(bestMatch.date)}` : 'Geen wedstrijden'}
                  </div>
                </div>
              )}
            </div>
            <section className="dashboard-section" id="top5-games">
              <Top5GamesSection data={top5} />
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

          <select
            className="season-select"
            value={activeSeason}
            onChange={(event) => chooseSeason(event.target.value)}
            aria-label="Seizoen"
          >
            {seasonOptions.map((option) => (
              <option key={option} value={option}>
                Seizoen {seasonShort(option)}
              </option>
            ))}
            <option value={ALL_SEASONS}>Alle seizoenen</option>
          </select>

          {updatedLabel ? (
            <span className="topbar-updated" title="Laatste keer dat de cijfers zijn opgehaald">
              Bijgewerkt {updatedLabel}
            </span>
          ) : null}

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
            <PodcastSection episodes={data.podcastEpisodes} monthly={data.podcastMonthly} apps={data.podcastApps} season={activeSeason} />
          </section>
        ) : (
          renderRadioTab()
        )}
      </main>
    </div>
  )
}

export default Dashboard
