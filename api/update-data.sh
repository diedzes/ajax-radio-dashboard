#!/bin/bash
# Script to update data - can be called from cron or webhook

cd "$(dirname "$0")/.."

echo "$(date): Starting data update..."

# Update data
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

echo "$(date): Data update complete"
