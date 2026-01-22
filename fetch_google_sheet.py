#!/usr/bin/env python3
"""
Script to fetch and parse Google Sheets data
"""
import json
import re
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
import requests

# Google Sheet ID from the URL
SHEET_ID = "1OHAe_neJVg2eLjn54jWkSbTTQKNfWyP-sDbtDRAWuJc"
# Sheets to fetch (tab names in the Google Sheet)
SHEET_NAMES = ["Ajax Radio 25/26", "Ajax Radio 24/25"]

def get_sheet_gid(sheet_name: str) -> Optional[str]:
    """Get the gid (grid ID) for a sheet by name"""
    # Try to fetch the sheet metadata to find the gid
    # For now, we'll try common gids or use the sheet name parameter
    # Google Sheets API v4 would be better, but for CSV export we can try different approaches
    return None  # Will need to be determined

def get_csv_url(sheet_name: str) -> str:
    """Get CSV export URL for a specific sheet"""
    # Google Sheets allows exporting by sheet name using the 'sheet' parameter
    # URL encode the sheet name
    import urllib.parse
    encoded_name = urllib.parse.quote(sheet_name)
    return f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&sheet={encoded_name}"


def parse_dd_mm_yyyy_date(date_str: str) -> Optional[str]:
    """
    Parse DD/MM/YYYY date format to ISO format 'YYYY-MM-DD'
    Examples: '7/12/2025' -> '2025-12-07', '16/07/2025' -> '2025-07-16'
    """
    if not date_str or date_str.strip() == "":
        return None
    
    date_str = date_str.strip()
    
    # Try DD/MM/YYYY format
    # Handle both '7/12/2025' and '16/07/2025' formats
    match = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', date_str)
    if match:
        try:
            day = int(match.group(1))
            month = int(match.group(2))
            year = int(match.group(3))
            date_obj = datetime(year, month, day)
            return date_obj.strftime('%Y-%m-%d')
        except ValueError:
            return None
    
    return None


def parse_dutch_date(date_str: str, year: Optional[int] = None, sheet_name: Optional[str] = None) -> Optional[str]:
    """
    Parse Dutch date format like 'za., 12 jul.' to ISO format '2024-07-12'
    If sheet_name is provided, extract year from it (e.g., "25/26" -> 2025, "24/25" -> 2024)
    This is kept for backward compatibility, but DD/MM/YYYY format is preferred now.
    """
    # First try DD/MM/YYYY format
    dd_mm_yyyy_result = parse_dd_mm_yyyy_date(date_str)
    if dd_mm_yyyy_result:
        return dd_mm_yyyy_result
    
    # Determine year from sheet name if provided
    if year is None and sheet_name:
        # Extract season from sheet name like "Ajax Radio 25/26" -> 2025, "Ajax Radio 24/25" -> 2024
        season_match = re.search(r'(\d{2})/(\d{2})', sheet_name)
        if season_match:
            year_start = int(season_match.group(1))
            # Convert 2-digit year to 4-digit (assuming 20xx)
            year = 2000 + year_start
    
    if not date_str or date_str.strip() == "":
        return None
    
    # Remove day abbreviation (za., wo., etc.)
    date_str = re.sub(r'^[a-z]+\.?\s*,?\s*', '', date_str.strip(), flags=re.IGNORECASE)
    
    # Dutch month mapping
    dutch_months = {
        'jan': 1, 'feb': 2, 'mrt': 3, 'maa': 3, 'apr': 4, 'mei': 5,
        'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12
    }
    
    # Extract day and month
    match = re.match(r'(\d+)\s+([a-z]+)\.?', date_str, re.IGNORECASE)
    if not match:
        return None
    
    day = int(match.group(1))
    month_str = match.group(2).lower()[:3]
    
    if month_str not in dutch_months:
        return None
    
    month = dutch_months[month_str]
    
    try:
        date_obj = datetime(year, month, day)
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return None


def fetch_google_sheet(sheet_name: str) -> str:
    """Fetch Google Sheet as CSV for a specific sheet"""
    url = get_csv_url(sheet_name)
    response = requests.get(url, allow_redirects=True)
    response.raise_for_status()
    return response.text

def fetch_all_sheets() -> Dict[str, str]:
    """Fetch all specified sheets"""
    sheets_data = {}
    for sheet_name in SHEET_NAMES:
        try:
            print(f"Fetching sheet: {sheet_name}...")
            csv_content = fetch_google_sheet(sheet_name)
            sheets_data[sheet_name] = csv_content
            print(f"  Fetched {len(csv_content)} characters")
        except Exception as e:
            print(f"  Error fetching {sheet_name}: {e}")
            sheets_data[sheet_name] = ""
    return sheets_data


def parse_csv_data(csv_content: str, sheet_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Parse CSV content into structured data using proper CSV parser"""
    if not csv_content.strip():
        return []
    
    # Use Python's csv module to properly handle quoted fields
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    if len(rows) < 2:
        return []
    
    # Detect header structure
    header = [h.strip().lower() for h in rows[0]]
    
    # Check which format we have
    # Format 1: Datum, Wedstrijd, Thuis/Uit, Tijd, Competitie, Commentator 1, Commentator 2, Vakantie?
    # Format 2: (empty), Dag, Datum, Wedstrijd weekend, Host, Co-host, Productie, Items, Prijs
    
    data = []
    for row in rows[1:]:  # Skip header
        if not row or len(row) < 3:
            continue
        
        # Initialize variables
        datum = ""
        wedstrijd = ""
        thuis_uit = ""
        tijd = ""
        competitie = ""
        commentator1 = ""
        commentator2 = ""
        vakantie = ""
        items = ""
        tv_channel = ""
        uitslag = ""
        result = ""
        
        # Try Format 1 (Ajax Audio Agenda / Luistercijfers)
        if 'datum' in header and 'wedstrijd' in header:
            datum_idx = header.index('datum')
            wedstrijd_idx = header.index('wedstrijd')
            thuis_uit_idx = header.index('thuis/uit') if 'thuis/uit' in header else -1
            tijd_idx = header.index('tijd') if 'tijd' in header else -1
            competitie_idx = header.index('competitie') if 'competitie' in header else -1
            comm1_idx = header.index('commentator 1') if 'commentator 1' in header else -1
            comm2_idx = header.index('commentator 2') if 'commentator 2' in header else -1
            tv_idx = header.index('tv') if 'tv' in header else -1
            uitslag_idx = header.index('uitslag') if 'uitslag' in header else -1
            result_idx = header.index('w/d/l') if 'w/d/l' in header else -1
            
            datum = row[datum_idx].strip() if datum_idx < len(row) else ""
            wedstrijd = row[wedstrijd_idx].strip() if wedstrijd_idx < len(row) else ""
            thuis_uit = row[thuis_uit_idx].strip() if thuis_uit_idx >= 0 and thuis_uit_idx < len(row) else ""
            tijd = row[tijd_idx].strip() if tijd_idx >= 0 and tijd_idx < len(row) else ""
            competitie = row[competitie_idx].strip() if competitie_idx >= 0 and competitie_idx < len(row) else ""
            commentator1 = row[comm1_idx].strip() if comm1_idx >= 0 and comm1_idx < len(row) else ""
            commentator2 = row[comm2_idx].strip() if comm2_idx >= 0 and comm2_idx < len(row) else ""
            tv_channel = row[tv_idx].strip() if tv_idx >= 0 and tv_idx < len(row) else ""
            uitslag = row[uitslag_idx].strip() if uitslag_idx >= 0 and uitslag_idx < len(row) else ""
            # Fix encoding issue: replace en-dash/em-dash and encoding artifacts with regular dash
            if uitslag:
                # Handle various dash characters and encoding issues
                uitslag = uitslag.replace('–', '-').replace('—', '-').replace('â', '-')
                # Fix common encoding issues from CSV
                uitslag = uitslag.replace('\u2013', '-').replace('\u2014', '-')  # Unicode en-dash and em-dash
                # Fix the specific 'â' encoding issue
                import re
                uitslag = re.sub(r'[^\d\-]', '-', uitslag)  # Replace any non-digit, non-dash with dash
                # Clean up multiple dashes
                uitslag = re.sub(r'-+', '-', uitslag)
            result = row[result_idx].strip() if result_idx >= 0 and result_idx < len(row) else ""
        
        # Try Format 2 (Podcast/Show format)
        elif 'datum' in header and 'wedstrijd weekend' in header:
            datum_idx = header.index('datum')
            wedstrijd_idx = header.index('wedstrijd weekend')
            host_idx = header.index('host') if 'host' in header else -1
            cohost_idx = header.index('co-host') if 'co-host' in header else -1
            items_idx = header.index('items') if 'items' in header else -1
            
            datum = row[datum_idx].strip() if datum_idx < len(row) else ""
            wedstrijd = row[wedstrijd_idx].strip() if wedstrijd_idx < len(row) else ""
            commentator1 = row[host_idx].strip() if host_idx >= 0 and host_idx < len(row) else ""
            commentator2 = row[cohost_idx].strip() if cohost_idx >= 0 and cohost_idx < len(row) else ""
            items = row[items_idx].strip() if items_idx >= 0 and items_idx < len(row) else ""
            thuis_uit = ""
            tijd = ""
            competitie = items if items else ""  # Use items as competition/labels
            # Parse items as labels
            if items:
                labels_from_items = [item.strip() for item in items.split(',')]
                competitie = labels_from_items[0] if labels_from_items else ""
        
        else:
            # Unknown format, skip
            continue
        
        # Skip rows with no date or match
        if not datum or not wedstrijd:
            continue
        
        # Parse date - try multiple formats
        date_iso = None
        # Try DD/MM/YYYY format first (new format)
        date_iso = parse_dd_mm_yyyy_date(datum)
        # If that fails, try Dutch format, passing sheet_name for year context
        if not date_iso:
            date_iso = parse_dutch_date(datum, sheet_name=sheet_name)
        # If that fails, try ISO format or other formats
        if not date_iso:
            # Try parsing as "4 augustus 2023" format
            try:
                # Dutch month names
                dutch_months_full = {
                    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4,
                    'mei': 5, 'juni': 6, 'juli': 7, 'augustus': 8,
                    'september': 9, 'oktober': 10, 'november': 11, 'december': 12
                }
                parts = datum.lower().split()
                if len(parts) >= 3:
                    day = int(parts[0])
                    month_str = parts[1]
                    year = int(parts[2])
                    if month_str in dutch_months_full:
                        month = dutch_months_full[month_str]
                        date_obj = datetime(year, month, day)
                        date_iso = date_obj.strftime('%Y-%m-%d')
            except:
                pass
        
        if not date_iso:
            continue
        
        # Create labels from competition, items, and home/away
        labels = []
        if items and ',' in items:
            # If items is a comma-separated list, use those as labels
            labels = [item.strip() for item in items.split(',')]
        else:
            if competitie:
                labels.append(competitie)
            if thuis_uit:
                labels.append(f"Thuis" if thuis_uit == "Thuis" else "Uit")
        
        # Combine commentators as hosts
        hosts = []
        if commentator1 and commentator1 != "N.v.t.":
            hosts.append(commentator1)
        if commentator2 and commentator2 != "N.v.t.":
            hosts.append(commentator2)
        host = " & ".join(hosts) if hosts else None
        
        # Generate show_id
        show_id = f"match_{date_iso}_{wedstrijd.replace(' ', '_').replace('-', '_')[:30]}"
        
        data.append({
            'show_id': show_id,
            'date': date_iso,
            'date_raw': datum,
            'show_name': wedstrijd,
            'match': wedstrijd,
            'home_away': thuis_uit,
            'time': tijd,
            'competition': competitie,
            'content_type': competitie,  # Use competition as content type
            'labels': labels,
            'host': host,
            'commentator1': commentator1 if commentator1 != "N.v.t." else None,
            'commentator2': commentator2 if commentator2 != "N.v.t." else None,
            'tv_channel': tv_channel if tv_channel else None,
            'uitslag': uitslag if uitslag else None,
            'result': result.upper() if result else None,  # W, D, or L
            'is_vacation': vakantie.strip() != "" if vakantie else False,
            'description': f"{wedstrijd} ({competitie})" if competitie else wedstrijd
        })
    
    return data


def analyze_sheet_structure(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze the Google Sheet data structure"""
    if not data:
        return {}
    
    # Count by competition
    competitions = {}
    for record in data:
        comp = record.get('competition', 'Unknown')
        competitions[comp] = competitions.get(comp, 0) + 1
    
    # Count by home/away
    home_away = {'Thuis': 0, 'Uit': 0}
    for record in data:
        ha = record.get('home_away', '')
        if ha in home_away:
            home_away[ha] += 1
    
    # Date range
    dates = [d['date'] for d in data if d.get('date')]
    date_range = {
        'earliest': min(dates) if dates else None,
        'latest': max(dates) if dates else None,
        'total_days': len(set(dates))
    }
    
    # Unique commentators
    commentators = set()
    for record in data:
        if record.get('commentator1'):
            commentators.add(record['commentator1'])
        if record.get('commentator2'):
            commentators.add(record['commentator2'])
    
    return {
        'total_records': len(data),
        'unique_dates': len(set(d['date'] for d in data)),
        'competitions': competitions,
        'home_away_distribution': home_away,
        'date_range': date_range,
        'unique_commentators': sorted(list(commentators)),
        'sample_records': data[:5] if len(data) >= 5 else data
    }


if __name__ == '__main__':
    print("Fetching Google Sheet data from specified sheets...")
    print(f"Sheets to fetch: {', '.join(SHEET_NAMES)}\n")
    
    try:
        # Fetch all sheets
        sheets_data = fetch_all_sheets()
        
        # Parse each sheet
        all_data = []
        sheet_analyses = {}
        seen_matches = set()  # Track duplicates by (date, match_name)
        
        for sheet_name, csv_content in sheets_data.items():
            if not csv_content:
                print(f"\nSkipping {sheet_name} - no data")
                continue
                
            print(f"\n{'='*60}")
            print(f"Parsing sheet: {sheet_name}")
            print(f"{'='*60}")
            print(f"First 300 chars: {csv_content[:300]}")
            
            data = parse_csv_data(csv_content, sheet_name=sheet_name)
            print(f"Parsed {len(data)} records from {sheet_name}")
            
            if data:
                analysis = analyze_sheet_structure(data)
                sheet_analyses[sheet_name] = analysis
                
                # Check date range for this sheet
                dates = [r.get('date', '') for r in data if r.get('date')]
                date_range = f"{min(dates)} to {max(dates)}" if dates else "no dates"
                print(f"  Date range: {date_range}")
                
                # Add sheet name to each record and deduplicate
                duplicates_skipped = 0
                for record in data:
                    record['sheet_name'] = sheet_name
                    
                    # Create unique key from date and match name
                    date = record.get('date', '')
                    match_name = record.get('match', '') or record.get('show_name', '')
                    unique_key = (date, match_name)
                    
                    # Skip if we've seen this exact match before (same date + same match name)
                    # But allow different sheets to have matches on the same date if they're different matches
                    if unique_key in seen_matches:
                        duplicates_skipped += 1
                        continue
                    
                    seen_matches.add(unique_key)
                    all_data.append(record)
                
                if duplicates_skipped > 0:
                    print(f"  Skipped {duplicates_skipped} duplicate records")
        
        # Combined analysis
        print(f"\n{'='*60}")
        print("COMBINED DATA STRUCTURE ANALYSIS")
        print(f"{'='*60}")
        combined_analysis = analyze_sheet_structure(all_data)
        combined_analysis['by_sheet'] = sheet_analyses
        print(json.dumps(combined_analysis, indent=2, default=str))
        
        print(f"\n{'='*60}")
        print("SAMPLE DATA (first 5 records)")
        print(f"{'='*60}")
        for record in all_data[:5]:
            print(json.dumps(record, indent=2, default=str))
        
        # Save parsed data
        with open('google_sheet_data.json', 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': combined_analysis,
                'all_data': all_data,
                'sheets_fetched': list(sheets_data.keys())
            }, f, indent=2, default=str, ensure_ascii=False)
        
        print(f"\nTotal records: {len(all_data)}")
        print(f"Data saved to 'google_sheet_data.json'")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
