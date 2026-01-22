#!/usr/bin/env python3
import json

# Check Google Sheet data
with open('google_sheet_data.json', 'r') as f:
    sheet_data = json.load(f)

all_data = sheet_data.get('all_data', [])
print(f"Total records in google_sheet_data.json: {len(all_data)}")

# Check by sheet
by_sheet = {}
for r in all_data:
    sheet = r.get('sheet_name', 'unknown')
    by_sheet[sheet] = by_sheet.get(sheet, 0) + 1

print("\nRecords by sheet:")
for k, v in by_sheet.items():
    print(f"  {k}: {v}")

# Check by year
dates_2024 = [r for r in all_data if r.get('date', '').startswith('2024')]
dates_2025 = [r for r in all_data if r.get('date', '').startswith('2025')]
dates_2026 = [r for r in all_data if r.get('date', '').startswith('2026')]

print(f"\nBy year:")
print(f"  2024: {len(dates_2024)}")
print(f"  2025: {len(dates_2025)}")
print(f"  2026: {len(dates_2026)}")

if dates_2024:
    print(f"\nFirst 5 2024 dates:")
    for r in sorted(dates_2024, key=lambda x: x.get('date', ''))[:5]:
        print(f"  {r.get('date')}: {r.get('match', 'N/A')}")

# Check merged data
print("\n" + "="*60)
with open('merged_matchdays.json', 'r') as f:
    merged_data = json.load(f)

print(f"Total records in merged_matchdays.json: {len(merged_data)}")

# Check listeners
with_listeners = [r for r in merged_data if r.get('listeners') is not None]
print(f"Records with listeners: {len(with_listeners)}")
print(f"Records without listeners: {len(merged_data) - len(with_listeners)}")

# Check by year in merged data
merged_2024 = [r for r in merged_data if r.get('date', '').startswith('2024')]
merged_2025 = [r for r in merged_data if r.get('date', '').startswith('2025')]
merged_2026 = [r for r in merged_data if r.get('date', '').startswith('2026')]

print(f"\nMerged data by year:")
print(f"  2024: {len(merged_2024)}")
print(f"  2025: {len(merged_2025)}")
print(f"  2026: {len(merged_2026)}")
