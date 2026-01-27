#!/usr/bin/env python3
"""
Script to merge API listener data with Google Sheets match data
Creates merged_matchdays.json for analysis
"""
import json
from datetime import datetime
from typing import List, Dict, Any, Optional


def load_api_data(filepath: str = 'api_data_full.json') -> Dict[str, int]:
    """Load API data and create date -> listeners mapping"""
    date_listeners = {}
    
    # Try to load from file first
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both full data and sample data structures
        if isinstance(data, list):
            # Direct list of records
            records = data
        elif 'sample_data' in data:
            records = data['sample_data']
        elif 'metadata' in data:
            # Check if metadata has the full data structure
            if 'sample_data' in data:
                records = data['sample_data']
            else:
                records = []
        else:
            records = []
        
        # Create date -> listeners mapping
        for record in records:
            date_str = record.get('date', '') or record.get('date_parsed', '')
            if date_str:
                # Normalize date to YYYY-MM-DD format
                try:
                    # Handle ISO format with time
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str.replace('T00:00:00', ''))
                    else:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                    date_key = date_obj.strftime('%Y-%m-%d')
                    listeners = record.get('listeners', 0)
                    if isinstance(listeners, (int, float)):
                        date_listeners[date_key] = int(listeners)
                except (ValueError, AttributeError):
                    continue
        
        # Don't skip if we have data - use what we have
        if len(date_listeners) > 0:
            print(f"  Loaded {len(date_listeners)} dates with listener data from file")
            return date_listeners
        
        return date_listeners
    except FileNotFoundError:
        print(f"  File not found, will fetch fresh data.")
        return {}
    except Exception as e:
        print(f"  Error loading from file: {e}, will fetch fresh data.")
        return {}


def fetch_fresh_api_data() -> Dict[str, int]:
    """Fetch fresh data from API if sample file doesn't exist"""
    try:
        from explore_api import fetch_api_data, parse_html_data
        print("Fetching fresh API data...")
        html = fetch_api_data('http://ajaxradio.westeurope.azurecontainer.io/all_shows/')
        data = parse_html_data(html)
        
        date_listeners = {}
        for record in data:
            date_str = record.get('date', '')
            if date_str:
                try:
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str.replace('T00:00:00', ''))
                    else:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                    date_key = date_obj.strftime('%Y-%m-%d')
                    listeners = record.get('listeners', 0)
                    if isinstance(listeners, (int, float)):
                        date_listeners[date_key] = int(listeners)
                except (ValueError, AttributeError):
                    continue
        
        return date_listeners
    except Exception as e:
        print(f"Error fetching fresh API data: {e}")
        return {}


def load_sheet_data(filepath: str = 'google_sheet_data.json') -> List[Dict[str, Any]]:
    """Load Google Sheets data"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle different data structures
        if 'all_data' in data:
            return data['all_data']
        elif isinstance(data, list):
            return data
        else:
            return []
    except FileNotFoundError:
        print(f"Warning: {filepath} not found. Run fetch_google_sheet.py first.")
        return []
    except Exception as e:
        print(f"Error loading sheet data: {e}")
        return []


def extract_commentators(record: Dict[str, Any]) -> List[str]:
    """Extract commentators list from sheet record"""
    commentators = []
    
    # Try different field names - prioritize commentator1/commentator2
    comm1 = record.get('commentator1') or record.get('Commentator 1')
    comm2 = record.get('commentator2') or record.get('Commentator 2')
    
    if comm1 and comm1 != "N.v.t.":
        commentators.append(str(comm1).strip())
    if comm2 and comm2 != "N.v.t.":
        commentators.append(str(comm2).strip())
    
    # If no commentators found, try host field (might be combined)
    if not commentators and 'host' in record and record['host']:
        # Host might be "Name1 & Name2" format
        host_str = str(record['host']).strip()
        if host_str and host_str != "N.v.t.":
            if ' & ' in host_str:
                commentators.extend([h.strip() for h in host_str.split(' & ')])
            else:
                commentators.append(host_str)
    
    # Filter out None, empty strings, and "N.v.t."
    commentators = [c for c in commentators if c and c != "N.v.t." and c.strip() and c.lower() != "n.v.t."]
    
    # Fix encoding issues (CornÃ© -> Corné)
    fixed_commentators = []
    for c in commentators:
        # Fix common encoding issues
        c = c.replace('Ã©', 'é').replace('Ã¨', 'è').replace('Ã', 'à')
        fixed_commentators.append(c)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_commentators = []
    for c in fixed_commentators:
        if c not in seen:
            seen.add(c)
            unique_commentators.append(c)
    
    return unique_commentators


def merge_data(api_data: Dict[str, int], sheet_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge API and sheet data by date, with deduplication"""
    merged = []
    seen_matches = set()  # Track duplicates by (date, match_name)
    
    for sheet_record in sheet_data:
        date = sheet_record.get('date', '')
        if not date:
            continue
        
        # Normalize date
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            date_key = date_obj.strftime('%Y-%m-%d')
        except (ValueError, AttributeError):
            continue
        
        # Extract match name for deduplication
        match_name = sheet_record.get('match', '') or sheet_record.get('show_name', '')
        unique_key = (date_key, match_name)
        
        # Skip if we've seen this match before
        if unique_key in seen_matches:
            continue
        
        seen_matches.add(unique_key)
        
        # Get listeners from API data (may be None if not found)
        listeners = api_data.get(date_key)
        
        # Extract kickoff time
        kickoff = sheet_record.get('time', '')
        if not kickoff:
            kickoff = None
        
        # Extract competition
        competition = sheet_record.get('competition', '')
        if not competition:
            competition = sheet_record.get('content_type', '')
        
        # Extract commentators
        commentators = extract_commentators(sheet_record)
        
        # Skip matches without commentators
        if not commentators or len(commentators) == 0:
            continue
        
        # Extract TV channel
        tv_channel = sheet_record.get('tv_channel', '')
        
        # Extract home/away
        home_away = sheet_record.get('home_away', '')
        
        # Extract score and result from sheet
        uitslag = sheet_record.get('uitslag', '')
        # Fix encoding issue: replace en-dash/em-dash and encoding artifacts with regular dash
        if uitslag:
            import re
            # Handle various dash characters and encoding issues
            uitslag = uitslag.replace('–', '-').replace('—', '-')
            # Fix Unicode en-dash and em-dash
            uitslag = uitslag.replace('\u2013', '-').replace('\u2014', '-')
            # Fix the specific 'â' encoding issue - replace any non-digit, non-dash character with dash
            uitslag = re.sub(r'[^\d\-]', '-', uitslag)
            # Clean up multiple dashes
            uitslag = re.sub(r'-+', '-', uitslag)
        result = sheet_record.get('result', '')
        
        # Create merged record
        merged_record = {
            'date': date_key,
            'listeners': listeners,
            'kickoff': kickoff,
            'competition': competition,
            'commentators': commentators,
            'tv_channel': tv_channel if tv_channel else None,
            'match_name': match_name,
            'home_away': home_away,
            'score': uitslag if uitslag else None,
            'result': result.upper() if result else None  # W, D, or L
        }
        
        merged.append(merged_record)
    
    # Sort by date
    merged.sort(key=lambda x: x['date'])
    
    return merged


def main():
    print("Merging API and Google Sheets data...")
    print("-" * 60)
    
    # Load API data
    print("Loading API data...")
    api_data = load_api_data()
    if not api_data:
        print("  No API data found in file, fetching fresh...")
        api_data = fetch_fresh_api_data()
    
    if api_data:
        print(f"  Loaded {len(api_data)} dates with listener data")
    else:
        print("  Warning: No API data available")
    
    # Load Google Sheets data
    print("\nLoading Google Sheets data...")
    sheet_data = load_sheet_data()
    if sheet_data:
        print(f"  Loaded {len(sheet_data)} match records")
    else:
        print("  Error: No Google Sheets data found")
        print("  Please run: python3 fetch_google_sheet.py")
        return
    
    # Merge data
    print("\nMerging data...")
    merged = merge_data(api_data, sheet_data)
    
    # Statistics
    with_listeners = sum(1 for m in merged if m['listeners'] is not None)
    without_listeners = len(merged) - with_listeners
    
    print(f"  Total merged records: {len(merged)}")
    print(f"  Records with listener data: {with_listeners}")
    print(f"  Records without listener data: {without_listeners}")
    
    # Save merged data
    output_file = 'merged_matchdays.json'
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved {len(merged)} records to {output_file}")
    
    # Show sample
    print("\nSample records (first 3):")
    for i, record in enumerate(merged[:3], 1):
        print(f"\n{i}. Date: {record['date']}")
        print(f"   Listeners: {record['listeners']}")
        print(f"   Kickoff: {record['kickoff']}")
        print(f"   Competition: {record['competition']}")
        print(f"   Commentators: {record['commentators']}")


if __name__ == '__main__':
    main()
