# Ajax Radio Dashboard - Data Exploration & Model

## Overview

This project explores the data structure from the Ajax Radio API and proposes a unified data model for building a dashboard that integrates:
1. Daily listener statistics from the public API
2. Show metadata from Google Sheets

## Project Structure

```
dashboard_project/
├── README.md                    # This file
├── DATA_MODEL_PROPOSAL.md      # Comprehensive data model proposal
├── data_models.py              # Python data model implementations
├── explore_api.py              # Script to explore and parse API data
├── requirements.txt            # Python dependencies
└── api_data_sample.json        # Sample parsed API data
```

## API Structure Summary

### Endpoint
- **URL**: `http://ajaxradio.westeurope.azurecontainer.io/all_shows/`
- **Format**: HTML table (requires parsing)
- **Data**: Daily listener counts

### Current Data Fields
- `date`: ISO 8601 timestamp (e.g., "2026-01-20T00:00:00")
- `listeners`: Integer count of listeners for that day

### Statistics
- **Total Records**: 595 days
- **Date Range**: June 1, 2024 to January 20, 2026
- **Total Listeners**: 3,190,437 (cumulative)
- **Average Listeners/Day**: ~5,362

## Key Findings

1. **API provides daily aggregates**, not individual show data
2. **HTML format** requires parsing (not JSON)
3. **One-to-many challenge**: Daily listener counts may represent multiple shows
4. **Google Sheet integration needed** for show-level details (duration, content type, labels)

## Proposed Data Model

### Core Entities

1. **DailyListenerStats** - From API
   - Date, listener count, source metadata

2. **ShowMetadata** - From Google Sheet
   - Show ID, name, duration, content type, labels, host, description

3. **EnrichedShow** - Combined record
   - Merges API and sheet data
   - Includes computed fields (listeners per minute, day of week, etc.)

See `DATA_MODEL_PROPOSAL.md` for detailed schema and integration strategies.

## Quick Start

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Explore API Data
```bash
python explore_api.py
```

This will:
- Fetch data from the API
- Parse the HTML table
- Generate `api_data_sample.json` with sample data
- Display data structure analysis

### Use Data Models
```python
from data_models import DailyListenerStats, ShowMetadata, EnrichedShow

# Create from API data
api_stats = DailyListenerStats(
    date="2026-01-20",
    listeners=16199
)

# Create from Google Sheet
show_meta = ShowMetadata(
    show_id="show_001",
    date="2026-01-20",
    show_name="Morning Show",
    duration_minutes=120.0,
    content_type="Live",
    labels=["News", "Sports"]
)

# Combine into enriched record
enriched = EnrichedShow.from_api_and_sheet(api_stats, show_meta)
print(f"Listeners per minute: {enriched.listeners_per_minute}")
```

## Next Steps

1. **Review Google Sheet Structure**
   - Confirm column names and data format
   - Validate date format consistency
   - Check for multiple shows per day

2. **Implement Google Sheets Integration**
   - Set up Google Sheets API authentication
   - Create data fetcher for sheet metadata

3. **Build Data Pipeline**
   - ETL process to merge API and sheet data
   - Handle data reconciliation (daily aggregates → individual shows)
   - Store in database/storage solution

4. **Design Dashboard Metrics**
   - Number of shows over time
   - Total duration trends
   - Content type distribution
   - Listener engagement by label
   - Time-based aggregations (daily, weekly, monthly)

## Questions to Address

- [ ] What's the exact structure of the Google Sheet?
- [ ] How many shows typically occur per day?
- [ ] How should we distribute daily listener counts across multiple shows?
- [ ] What's the update frequency for both data sources?
- [ ] Do we need historical data preservation?

## Notes

- The API currently returns HTML, not JSON. Consider requesting a JSON endpoint if possible.
- The data model is designed to be flexible and accommodate future API changes.
- The enrichment logic handles missing data gracefully (api_only, sheet_only, or full).
