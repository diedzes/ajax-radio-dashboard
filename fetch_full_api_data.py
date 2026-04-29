#!/usr/bin/env python3
"""
Fetch full API data and save it
"""
import requests
from bs4 import BeautifulSoup
import json
import csv
import io
from datetime import datetime
from typing import List, Dict, Any

PRIMARY_API_URL = 'https://stajaxradioprod.blob.core.windows.net/luistercijfers/luistercijfers.csv'
FALLBACK_API_URL = 'http://ajaxradio.westeurope.azurecontainer.io/all_shows/'


def fetch_api_data(url: str) -> str:
    """Fetch HTML data from the API"""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.text

def parse_html_data(html: str) -> List[Dict[str, Any]]:
    """Parse HTML table and extract data."""
    soup = BeautifulSoup(html, 'html.parser')
    table = soup.find('table', {'id': 'allShows'})
    
    if not table:
        return []
    
    rows = table.find('tbody').find_all('tr')
    data = []
    
    for row in rows:
        cells = row.find_all('td')
        if len(cells) >= 2:
            datum = cells[0].text.strip()
            luisteraars = cells[1].text.strip()
            
            # Parse date
            try:
                date_obj = datetime.fromisoformat(datum.replace('T00:00:00', ''))
            except:
                date_obj = None
            
            data.append({
                'date': datum,
                'date_parsed': date_obj.isoformat() if date_obj else None,
                'listeners': int(luisteraars) if luisteraars.isdigit() else 0
            })
    
    return data


def parse_csv_data(content: str) -> List[Dict[str, Any]]:
    """Parse CSV payload and extract date/listener rows."""
    sample = content[:1024]
    delimiter = ','
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')
        delimiter = dialect.delimiter
    except csv.Error:
        pass

    reader = csv.reader(io.StringIO(content), delimiter=delimiter)
    data = []
    for row in reader:
        if len(row) < 2:
            continue
        datum = (row[0] or '').strip()
        luisteraars_raw = (row[1] or '').strip()
        if not datum:
            continue
        if datum.lower() in {'date', 'datum'}:
            continue

        listeners_digits = ''.join(ch for ch in luisteraars_raw if ch.isdigit())
        listeners = int(listeners_digits) if listeners_digits else 0
        try:
            date_obj = datetime.fromisoformat(datum.replace('T00:00:00', ''))
        except ValueError:
            date_obj = None

        data.append({
            'date': datum,
            'date_parsed': date_obj.isoformat() if date_obj else None,
            'listeners': listeners
        })
    return data


def parse_api_data(content: str) -> List[Dict[str, Any]]:
    """Parse API payload as HTML table or CSV."""
    if '<table' in content.lower():
        return parse_html_data(content)
    return parse_csv_data(content)

if __name__ == '__main__':
    print("Fetching full API data...")
    payload = None
    source_url = None
    try:
        payload = fetch_api_data(PRIMARY_API_URL)
        source_url = PRIMARY_API_URL
    except requests.RequestException as exc:
        print(f"Warning: failed to fetch primary API data ({exc}). Trying fallback URL.")
        try:
            payload = fetch_api_data(FALLBACK_API_URL)
            source_url = FALLBACK_API_URL
        except requests.RequestException as fallback_exc:
            print(f"Warning: failed to fetch fallback API data ({fallback_exc}). Using cached file if available.")
            try:
                with open('api_data_full.json', 'r', encoding='utf-8') as f:
                    json.load(f)
                print("Found cached api_data_full.json; continuing.")
                exit(0)
            except (FileNotFoundError, json.JSONDecodeError):
                print("No cached api_data_full.json available.")
                exit(0)
    
    print(f"Parsing API data from {source_url}...")
    data = parse_api_data(payload)
    
    print(f"Extracted {len(data)} records")
    
    # Save all data
    with open('api_data_full.json', 'w') as f:
        json.dump(data, f, indent=2, default=str)
    
    print(f"Saved {len(data)} records to 'api_data_full.json'")
    
    # Also update the sample file with full data structure
    dates_2024 = [r for r in data if r.get('date', '').startswith('2024')]
    dates_2025 = [r for r in data if r.get('date', '').startswith('2025')]
    dates_2026 = [r for r in data if r.get('date', '').startswith('2026')]
    
    print(f"\nData by year:")
    print(f"  2024: {len(dates_2024)} records")
    print(f"  2025: {len(dates_2025)} records")
    print(f"  2026: {len(dates_2026)} records")
