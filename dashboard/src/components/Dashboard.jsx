import React, { useState, useEffect } from 'react'
import AllMatchesOverview from './AllMatchesOverview'
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
    weekday: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
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
          weekdayRes
        ] = await Promise.all([
          fetch('/output/all_matches.json'),
          fetch('/output/top5_games.json'),
          fetch('/output/commentator_duos.json'),
          fetch('/output/by_result.json'),
          fetch('/output/by_home_away.json'),
          fetch('/output/by_tv_category.json'),
          fetch('/output/commentators_full_credit.json'),
          fetch('/output/kickoff_blocks.json'),
          fetch('/output/weekday.json')
        ])

        if (!allMatchesRes.ok || !top5GamesRes.ok || !commentatorDuosRes.ok || 
            !byResultRes.ok || !byHomeAwayRes.ok || !byTVCategoryRes.ok ||
            !commentatorsRes.ok || !kickoffRes.ok || !weekdayRes.ok) {
          throw new Error('Failed to load data files')
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
          weekdayData
        ] = await Promise.all([
          allMatchesRes.json(),
          top5GamesRes.json(),
          commentatorDuosRes.json(),
          byResultRes.json(),
          byHomeAwayRes.json(),
          byTVCategoryRes.json(),
          commentatorsRes.json(),
          kickoffRes.json(),
          weekdayRes.json()
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
          weekday: weekdayData.weekdays || []
        })
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>Ajax Radio Dashboard</h1>
        <p>Loading data...</p>
      </div>
    )
  }

  if (error) {
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
      <header>
        <h1>Ajax Radio Dashboard</h1>
        <nav className="dashboard-nav">
          <a href="#all-matches" onClick={(e) => { e.preventDefault(); scrollToSection('all-matches') }}>
            All Matches
          </a>
          <a href="#top5-games" onClick={(e) => { e.preventDefault(); scrollToSection('top5-games') }}>
            Top 5 Games
          </a>
          <a href="#commentator-duos" onClick={(e) => { e.preventDefault(); scrollToSection('commentator-duos') }}>
            Commentator Duos
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
          <a href="#commentators" onClick={(e) => { e.preventDefault(); scrollToSection('commentators') }}>
            Commentators
          </a>
          <a href="#kickoff-blocks" onClick={(e) => { e.preventDefault(); scrollToSection('kickoff-blocks') }}>
            Kickoff Blocks
          </a>
          <a href="#weekday" onClick={(e) => { e.preventDefault(); scrollToSection('weekday') }}>
            Weekday
          </a>
        </nav>
      </header>

      <section className="dashboard-section" id="all-matches">
        <AllMatchesOverview data={data.allMatches} />
      </section>

      <section className="dashboard-section" id="top5-games">
        <Top5GamesSection data={data.top5Games} />
      </section>

      <section className="dashboard-section" id="commentator-duos">
        <CommentatorDuosSection data={data.commentatorDuos} />
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

      <section className="dashboard-section" id="commentators">
        <CommentatorsSection data={data.commentators} />
      </section>

      <section className="dashboard-section" id="kickoff-blocks">
        <KickoffBlocksSection data={data.kickoffBlocks} />
      </section>

      <section className="dashboard-section" id="weekday">
        <WeekdaySection data={data.weekday} />
      </section>
    </div>
  )
}

export default Dashboard
