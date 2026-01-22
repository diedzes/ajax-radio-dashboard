#!/usr/bin/env python3
"""
Script to explore the API structure and extract data
"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import List, Dict, Any

def fetch_api_data(url: str) -> str:
    """Fetch HTML data from the API"""
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def parse_html_data(html: str) -> List[Dict[str, Any]]:
    """Parse HTML table and extract data"""
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
    api_url = 'http://ajaxradio.westeurope.azurecontainer.io/all_shows/'
    
    print("Fetching data from API...")
    html = fetch_api_data(api_url)
    
    print("Parsing HTML data...")
    data = parse_html_data(html)
    
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
