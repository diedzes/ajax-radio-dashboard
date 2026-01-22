#!/usr/bin/env python3
import json

# Check merged data
with open('merged_matchdays.json', 'r') as f:
    merged_data = json.load(f)

print(f"Total matches with listeners: {len(merged_data)}")

# Check by year
by_year = {}
for r in merged_data:
    year = r.get('date', '')[:4]
    by_year[year] = by_year.get(year, 0) + 1

print("\nBy year:")
for k, v in sorted(by_year.items()):
    print(f"  {k}: {v} matches")

# Check date range
dates = [r.get('date') for r in merged_data if r.get('date')]
if dates:
    print(f"\nDate range: {min(dates)} to {max(dates)}")

# Check dashboard files
print("\n" + "="*60)
print("Checking dashboard files...")

try:
    with open('dashboard/public/output/all_matches.json', 'r') as f:
        all_matches = json.load(f)
    matches = all_matches.get('matches', [])
    print(f"all_matches.json: {len(matches)} matches")
    
    # Check by year in dashboard
    by_year_dash = {}
    for m in matches:
        year = m.get('date', '')[:4]
        by_year_dash[year] = by_year_dash.get(year, 0) + 1
    print("Dashboard matches by year:")
    for k, v in sorted(by_year_dash.items()):
        print(f"  {k}: {v} matches")
        
except Exception as e:
    print(f"Error reading dashboard files: {e}")
