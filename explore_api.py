#!/usr/bin/env python3
"""
Script to explore the API structure and extract data
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
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def parse_html_data(html: str) -> List[Dict[str, Any]]:
    """Parse HTML table and extract data."""
    soup = BeautifulSoup(html, 'html.parser')  # Using built-in parser
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

def analyze_data_structure(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze the data structure and provide insights"""
    if not data:
        return {}
    
    total_listeners = sum(d['listeners'] for d in data)
    dates = [d['date'] for d in data if d.get('date')]
    date_range = {
        'earliest': min(dates) if dates else None,
        'latest': max(dates) if dates else None
    }
    
    # Sample records
    sample = data[:5] if len(data) >= 5 else data
    
    return {
        'total_records': len(data),
        'total_listeners': total_listeners,
        'average_listeners_per_day': total_listeners / len(data) if data else 0,
        'date_range': date_range,
        'sample_records': sample,
        'fields': ['date', 'listeners']
    }

if __name__ == '__main__':
    print("Fetching data from API...")
    payload = None
    source_url = None
    try:
        payload = fetch_api_data(PRIMARY_API_URL)
        source_url = PRIMARY_API_URL
    except requests.RequestException as exc:
        print(f"Warning: failed to fetch primary API data ({exc}). Trying fallback URL.")
        payload = fetch_api_data(FALLBACK_API_URL)
        source_url = FALLBACK_API_URL
    
    print(f"Parsing API data from {source_url}...")
    data = parse_api_data(payload)
    
    print(f"\nExtracted {len(data)} records")
    
    print("\nAnalyzing data structure...")
    analysis = analyze_data_structure(data)
    
    print("\n" + "="*60)
    print("DATA STRUCTURE ANALYSIS")
    print("="*60)
    print(json.dumps(analysis, indent=2, default=str))
    
    print("\n" + "="*60)
    print("SAMPLE DATA (first 5 records)")
    print("="*60)
    for record in data[:5]:
        print(json.dumps(record, indent=2, default=str))
    
    # Save parsed data to JSON for reference
    with open('api_data_sample.json', 'w') as f:
        json.dump({
            'metadata': analysis,
            'sample_data': data[:20]  # First 20 records
        }, f, indent=2, default=str)
    
    print(f"\nSample data saved to 'api_data_sample.json'")
