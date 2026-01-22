# Data Model Proposal for Ajax Radio Dashboard

## Executive Summary

This document outlines the data model for the Ajax Radio dashboard, which will integrate data from:
1. **Public API**: Daily listener counts (aggregated data)
2. **Google Sheet**: Show-level metadata (labels, content type, etc.)

## Current API Structure Analysis

### API Endpoint
- **URL**: `http://ajaxradio.westeurope.azurecontainer.io/all_shows/`
- **Format**: HTML table (not JSON)
- **Data Available**: 595 records covering June 2024 to January 2026

### Current API Data Fields
```json
{
  "date": "2026-01-20T00:00:00",  // ISO 8601 timestamp
  "listeners": 16199              // Integer count
}
```

### Key Observations
- **Data Type**: Daily aggregated listener counts
- **Date Range**: 2024-06-01 to 2026-01-20
- **Total Records**: 595 days
- **Total Listeners**: 3,190,437 (cumulative)
- **Average Listeners/Day**: ~5,362

### Limitations
- The API provides **daily aggregates**, not individual show data
- No show-level details (duration, content type, show name, etc.)
- No way to distinguish between different shows on the same day
- This suggests the API may be aggregating multiple shows per day

## Proposed Unified Data Model

### Core Entities

#### 1. Daily Listener Stats (from API)
```python
DailyListenerStats = {
    "date": str,              # ISO 8601 date: "2026-01-20"
    "listeners": int,          # Total listeners for that day
    "source": str,             # "api" to track data origin
    "fetched_at": datetime    # When data was retrieved
}
```

#### 2. Show Metadata (from Google Sheet)
```python
ShowMetadata = {
    "show_id": str,            # Unique identifier (could be date-based or custom)
    "date": str,               # ISO 8601 date: "2026-01-20"
    "show_name": str,          # Name of the show
    "duration_minutes": float, # Duration in minutes (nullable)
    "content_type": str,       # e.g., "Live", "Podcast", "Replay"
    "labels": List[str],       # Array of labels/tags
    "host": str,              # Show host (nullable)
    "description": str,       # Show description (nullable)
    "source": str,            # "google_sheet" to track data origin
    "updated_at": datetime     # Last update timestamp
}
```

#### 3. Enriched Show Record (Combined)
```python
EnrichedShow = {
    # From API
    "date": str,
    "listeners": int,
    
    # From Google Sheet
    "show_id": str,
    "show_name": str,
    "duration_minutes": float,
    "content_type": str,
    "labels": List[str],
    "host": str,
    "description": str,
    
    # Computed/Enriched
    "listeners_per_minute": float,  # listeners / duration_minutes
    "day_of_week": str,             # "Monday", "Tuesday", etc.
    "month": str,                   # "January", "February", etc.
    "year": int,
    "week_number": int,
    
    # Metadata
    "data_completeness": str,        # "full", "api_only", "sheet_only"
    "last_updated": datetime
}
```

### Data Integration Strategy

#### Challenge: One-to-Many Relationship
The API provides **daily aggregates**, but Google Sheets may have **multiple shows per day**. We need to handle this mismatch.

#### Solution Options:

**Option A: Date-Based Matching (Simple)**
- Match Google Sheet shows to API data by date
- If multiple shows exist on one day, distribute listeners proportionally or use the primary show
- **Pros**: Simple, works with current API structure
- **Cons**: Loss of granularity, assumes all shows on a day share listeners

**Option B: Show-Level API (If Available)**
- Check if there's a show-level endpoint (e.g., `/shows/{id}` or `/shows?date=YYYY-MM-DD`)
- **Pros**: More accurate, preserves show-level data
- **Cons**: May not exist

**Option C: Hybrid Approach (Recommended)**
- Use daily aggregates for trend analysis
- Use Google Sheet metadata for show categorization
- Create separate metrics:
  - **Daily trends**: Use API data directly
  - **Show analysis**: Use Google Sheet data with estimated/assigned listener counts
- **Pros**: Flexible, works with current limitations
- **Cons**: Requires data reconciliation logic

## Recommended Data Model Schema

### Database/Storage Structure

```python
# Tables/Collections

1. daily_listener_stats
   - date (primary key)
   - listeners
   - source
   - fetched_at

2. show_metadata
   - show_id (primary key)
   - date
   - show_name
   - duration_minutes
   - content_type
   - labels (array)
   - host
   - description
   - source
   - updated_at

3. show_listener_assignments (if needed for reconciliation)
   - show_id (foreign key)
   - date
   - assigned_listeners (calculated)
   - assignment_method (e.g., "proportional", "primary_show")
```

### Data Flow

```
┌─────────────────┐
│   Public API    │
│  (Daily Stats)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Data Fetcher   │
│  (HTML Parser)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Daily Listener  │      │  Google Sheet   │
│     Stats       │      │   (Metadata)    │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └──────────┬─────────────┘
                    ▼
         ┌──────────────────┐
         │  Data Enricher    │
         │  (Merger Logic)   │
         └──────────┬────────┘
                    ▼
         ┌──────────────────┐
         │  Enriched Shows   │
         │   (Dashboard DB)  │
         └──────────────────┘
```

## Metrics & Calculations

### Available Metrics (Based on Requirements)

1. **Number of Shows**
   - Count from Google Sheet metadata
   - Group by: date, month, year, content_type, labels

2. **Total Duration**
   - Sum of `duration_minutes` from Google Sheet
   - Group by: date range, content_type, labels

3. **Content Type Distribution**
   - Count/percentage by `content_type`
   - Trends over time

4. **Listener Trends**
   - Daily, weekly, monthly aggregates from API
   - Average listeners per show (if duration available)
   - Peak listening days

5. **Label Analysis**
   - Most common labels
   - Listener engagement by label
   - Label trends over time

### Calculated Fields

```python
# Time-based aggregations
- daily_stats: Group by date
- weekly_stats: Group by week (year-week)
- monthly_stats: Group by year-month
- yearly_stats: Group by year

# Content-based aggregations
- by_content_type: Group by content_type
- by_label: Group by labels (may need to flatten array)
- by_host: Group by host

# Performance metrics
- avg_listeners_per_show = total_listeners / num_shows
- avg_duration = total_duration / num_shows
- listeners_per_minute = listeners / duration_minutes
```

## Google Sheet Integration Requirements

### Expected Google Sheet Structure

To properly integrate, the Google Sheet should have columns like:

| Date | Show Name | Duration (min) | Content Type | Labels | Host | Description |
|------|-----------|----------------|--------------|--------|------|-------------|
| 2026-01-20 | Morning Show | 120 | Live | News, Sports | John Doe | Daily morning program |
| 2026-01-20 | Evening Talk | 60 | Podcast | Interview | Jane Smith | Evening discussion |

### Matching Strategy

1. **Primary Key**: Use `date` + `show_name` as composite key (or generate unique `show_id`)
2. **Date Format**: Ensure consistent ISO 8601 format (YYYY-MM-DD)
3. **Labels**: Can be comma-separated or separate columns (prefer comma-separated for flexibility)

## Implementation Recommendations

### Phase 1: Data Collection
1. ✅ Parse HTML API (already done)
2. ⏳ Set up Google Sheets API integration
3. ⏳ Create data fetcher/scheduler

### Phase 2: Data Storage
1. Choose storage solution (SQLite for simple, PostgreSQL for production)
2. Create schema based on proposed model
3. Implement data loading scripts

### Phase 3: Data Enrichment
1. Implement date matching logic
2. Handle one-to-many relationships (daily stats → multiple shows)
3. Calculate derived metrics

### Phase 4: Dashboard Preparation
1. Create aggregation views/queries
2. Optimize for time-series queries
3. Prepare data for visualization

## Next Steps

1. **Confirm Google Sheet Structure**: Review actual Google Sheet to validate proposed schema
2. **API Exploration**: Check if show-level endpoints exist
3. **Data Reconciliation**: Decide on strategy for matching daily aggregates to individual shows
4. **Storage Selection**: Choose database/storage solution
5. **ETL Pipeline**: Build data extraction, transformation, and loading pipeline

## Questions to Resolve

1. Does the Google Sheet have one row per show, or can there be multiple shows per day?
2. How should we handle days with multiple shows but only one listener count?
3. Is there a way to get show-level listener data from the API?
4. What's the update frequency for both data sources?
5. Do we need historical data preservation, or just current state?
