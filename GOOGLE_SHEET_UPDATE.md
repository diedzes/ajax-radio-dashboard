# Google Sheet Update Summary

## Changes Made

### 1. Updated Google Sheet Source
- **Old Sheet ID**: `1j4qnbS_cBbHXDMkJivM6mWBNUeUKGOWLiDw7JQ2Jgyc` (Luistercijfers)
- **New Sheet ID**: `1OHAe_neJVg2eLjn54jWkSbTTQKNfWyP-sDbtDRAWuJc` (Ajax Audio Agenda)
- **Reason**: All data (including TV column) is now in one consolidated sheet

### 2. Updated Sheet Tab Names
- **Old**: `["2025/2026", "2024/2025"]`
- **New**: `["Ajax Radio 25/26", "Ajax Radio 24/25"]`
- Matches the actual tab names in the Google Sheet

### 3. Added DD/MM/YYYY Date Parsing
- **New Function**: `parse_dd_mm_yyyy_date()`
- **Format Support**: 
  - `7/12/2025` → `2025-12-07`
  - `16/07/2025` → `2025-07-16`
  - `8/3/2025` → `2025-03-08`
- **Priority**: DD/MM/YYYY format is tried first, then falls back to Dutch format for backward compatibility

### 4. TV Column Extraction
- TV column extraction was already implemented
- Now extracts from the same sheet (no need to fetch from separate sheet)
- Column name: "TV" (case-insensitive)

## Updated Files

1. **fetch_google_sheet.py**
   - Updated `SHEET_ID` to new consolidated sheet
   - Updated `SHEET_NAMES` to match actual tab names
   - Added `parse_dd_mm_yyyy_date()` function
   - Updated date parsing to try DD/MM/YYYY first
   - TV column extraction already working

## How to Use

1. **Fetch updated data**:
   ```bash
   cd /Users/diederikvanzessen/dashboard_project
   python3 fetch_google_sheet.py
   ```

2. **Merge with API data**:
   ```bash
   python3 merge_data.py
   ```

3. **Generate analysis**:
   ```bash
   python3 analyze_matchdays.py
   ```

4. **Start dashboard**:
   ```bash
   cd dashboard
   npm run dev
   ```

## Date Format Examples

The script now handles these date formats (in order of priority):

1. **DD/MM/YYYY** (new format): `7/12/2025`, `16/07/2025`, `8/3/2025`
2. **Dutch abbreviated**: `za., 12 jul.` (with year context from sheet name)
3. **Dutch full**: `4 augustus 2023`

## Notes

- The script maintains backward compatibility with old date formats
- TV channel data is now extracted from the same sheet as match data
- All data is consolidated in one Google Sheet for easier maintenance
