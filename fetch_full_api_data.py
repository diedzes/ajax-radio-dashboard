#!/usr/bin/env python3
"""
Fetch full API data and save it
"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def fetch_api_data(url: str) -> str:
    """Fetch HTML data from the API"""
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def parse_html_data(html: str):
    """Parse HTML table and extract data"""
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

if __name__ == '__main__':
    api_url = 'http://ajaxradio.westeurope.azurecontainer.io/all_shows/'
    
    print("Fetching full API data...")
    html = fetch_api_data(api_url)
    
    print("Parsing HTML data...")
    data = parse_html_data(html)
    
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
