# Dashboard Updates Summary

## Overview
This document summarizes the new features added to the Ajax Radio Dashboard.

## New Features

### 1. All Matches Overview
- **Location**: First section in the dashboard
- **Description**: Shows all matches in reverse chronological order (newest first)
- **Fields Displayed**:
  - Date (formatted in Dutch locale)
  - Day of the week
  - Time (kickoff time)
  - Time block (e.g., "12:00-14:59", "15:00-17:59", etc.)
  - Match name
  - Commentators (combined with " & ")
  - TV Channel (from Google Sheets)
  - Score (if available)
  - Result (W/D/L badge with color coding)
  - Listeners count

### 2. Top 5 Games by Season
- **Location**: Second section in the dashboard
- **Description**: Shows the top 5 games by listener count for each season (2024/2025 and 2025/2026)
- **Fields Displayed**: Same as All Matches Overview, plus:
  - Rank (1-5)
  - All metrics from the overview

### 3. Commentator Duos Performance
- **Location**: Third section in the dashboard
- **Description**: Shows average listeners per commentator duo (order doesn't matter)
- **Features**:
  - Table with all duos sorted by average listeners
  - Bar chart showing top 15 duos
  - Shows: Duo name, number of matches, average listeners, median, and max

## Data Updates

### Updated Scripts

1. **fetch_google_sheet.py**
   - Updated to fetch from the correct Google Sheet ID: `1j4qnbS_cBbHXDMkJivM6mWBNUeUKGOWLiDw7JQ2Jgyc`
   - Updated sheet names to: `["2025/2026", "2024/2025"]`
   - Added extraction of TV channel from the "TV" column

2. **merge_data.py**
   - Added TV channel field to merged records
   - Added match_name and home_away fields
   - Added score and result fields (W/D/L) for future population

3. **analyze_matchdays.py**
   - Added `prepare_all_matches()` function to prepare all matches data
   - Added `get_top5_games()` function to get top 5 games per season
   - Generates `all_matches.json` and `top5_games.json` files

4. **fetch_match_scores.py** (NEW)
   - Script to fetch match scores from SofaScore
   - Can load scores from a JSON file (`match_scores.json`)
   - Determines W/D/L result based on score and home/away status
   - Note: SofaScore scraping requires manual implementation or API access

## How to Use

### 1. Update Google Sheets Data
```bash
cd /Users/diederikvanzessen/dashboard_project
python3 fetch_google_sheet.py
```

### 2. Merge Data
```bash
python3 merge_data.py
```

### 3. Add Match Scores (Optional)
Create a `match_scores.json` file with the following format:
```json
[
  { "date": "2024-08-03", "score": "2-1" },
  { "date": "2024-08-10", "score": "3-0" }
]
```

Then run:
```bash
python3 fetch_match_scores.py
```

### 4. Generate Analysis Data
```bash
python3 analyze_matchdays.py
```

This will generate:
- `output/all_matches.json` - All matches data
- `output/top5_games.json` - Top 5 games per season
- `output/commentator_duos.json` - Commentator duos analysis
- Other existing analysis files

### 5. Run Dashboard
```bash
cd dashboard
npm run dev
```

## File Structure

### New React Components
- `dashboard/src/components/AllMatchesOverview.jsx` - All matches overview component
- `dashboard/src/components/AllMatchesOverview.css` - Styling for matches overview
- `dashboard/src/components/Top5GamesSection.jsx` - Top 5 games component
- `dashboard/src/components/Top5GamesSection.css` - Styling for top 5 games
- `dashboard/src/components/CommentatorDuosSection.jsx` - Commentator duos component
- `dashboard/src/components/CommentatorDuosSection.css` - Styling for commentator duos

### Updated Files
- `dashboard/src/components/Dashboard.jsx` - Updated to include new sections
- `dashboard/src/components/Dashboard.css` - Added section styling

## Notes

1. **Match Scores**: The SofaScore scraping is not fully implemented. You can manually add scores to `match_scores.json` and run `fetch_match_scores.py` to populate them.

2. **TV Channel**: The TV channel is extracted from the Google Sheets "TV" column. Make sure the column name is exactly "TV" (case-insensitive).

3. **Time Blocks**: Time blocks are automatically calculated:
   - 12:00-14:59
   - 15:00-17:59
   - 18:00-19:59
   - 20:00-20:59
   - 21:00+

4. **Result Badges**: 
   - W (Win) = Green
   - D (Draw) = Orange
   - L (Loss) = Red

## Future Improvements

- Implement proper SofaScore API integration or scraping
- Add filtering/search functionality to All Matches Overview
- Add export functionality for match data
- Add more detailed statistics per season
