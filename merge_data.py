#!/usr/bin/env python3
"""
Script to merge API listener data with Google Sheets match data
Creates merged_matchdays.json for analysis
"""
import json
import os
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

import requests


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


TEAM_ALIASES = {
    # PSV
    "psv": "psv",
    "psv eindhoven": "psv",
    "psv eind hoven": "psv",
    "philips sport vereniging": "psv",
    "philips sv": "psv",
    "psv eindhoven eindhoven": "psv",
    # Feyenoord
    "feyenoord": "feyenoord",
    "feyenoord rotterdam": "feyenoord",
    "stadionclub feyenoord": "feyenoord",
    "feyenoord 1": "feyenoord",
    # NEC
    "nec": "nec",
    "nec nijmegen": "nec",
    "nijmegen eendracht combinatie": "nec",
    "nijmegen ec": "nec",
    # Ajax
    "ajax": "ajax",
    "afc ajax": "ajax",
    "ajax amsterdam": "ajax",
    "amsterdamsche football club ajax": "ajax",
    "amsterdamsche fc ajax": "ajax",
    # Sparta
    "sparta": "sparta",
    "sparta rotterdam": "sparta",
    "sparta rdam": "sparta",
    "sparta r dam": "sparta",
    # AZ
    "az": "az",
    "az alkmaar": "az",
    "az 67": "az",
    "az 67 alkmaar": "az",
    "az alkmaar zaanstreek": "az",
    # Twente
    "twente": "twente",
    "fc twente": "twente",
    "fc twente enschede": "twente",
    "twente enschede": "twente",
    # Groningen
    "groningen": "groningen",
    "fc groningen": "groningen",
    "groningen fc": "groningen",
    # Zwolle
    "zwolle": "zwolle",
    "pec": "zwolle",
    "pec zwolle": "zwolle",
    "zwolle pec": "zwolle",
    # Heerenveen
    "heerenveen": "heerenveen",
    "sc heerenveen": "heerenveen",
    "sportclub heerenveen": "heerenveen",
    "heerenveen sc": "heerenveen",
    # Sittard
    "sittard": "sittard",
    "fortuna": "sittard",
    "fortuna sittard": "sittard",
    "fortuna sittard nl": "sittard",
    # Utrecht
    "utrecht": "utrecht",
    "fc utrecht": "utrecht",
    "utrecht fc": "utrecht",
    # Excelsior
    "excelsior": "excelsior",
    "excelsior rotterdam": "excelsior",
    "sbv excelsior": "excelsior",
    # Go Ahead
    "go ahead": "go ahead",
    "go ahead eagles": "go ahead",
    "go ahead eagles deventer": "go ahead",
    "go ahead deventer": "go ahead",
    "g a eagles": "go ahead",
    # Volendam
    "volendam": "volendam",
    "fc volendam": "volendam",
    "volendam fc": "volendam",
    # Heracles
    "heracles": "heracles",
    "heracles almelo": "heracles",
    # NAC
    "nac": "nac",
    "nac breda": "nac",
    "n a c": "nac",
    "n a c breda": "nac",
    "noad advendo combinatie": "nac",
    # Telstar
    "telstar": "telstar",
    "telstar ijmuiden": "telstar"
}


def normalize_team_name(name: str) -> str:
    if not name:
        return ""
    cleaned = re.sub(r"[\.\(\)\[\],/’']", " ", name.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    tokens = cleaned.split()
    if tokens and tokens[0] in {"fc", "sc", "sv"} and len(tokens) > 1:
        tokens = tokens[1:]
    normalized = " ".join(tokens)
    return TEAM_ALIASES.get(normalized, normalized)


def extract_opponent(match_name: Optional[str]) -> Optional[str]:
    if not match_name or not isinstance(match_name, str):
        return None
    parts = [part.strip() for part in match_name.split(" - ") if part.strip()]
    if len(parts) != 2:
        return None
    left, right = parts
    left_norm = normalize_team_name(left)
    right_norm = normalize_team_name(right)
    if "ajax" in left_norm:
        return right
    if "ajax" in right_norm:
        return left
    return None


def determine_result(score: str, home_away: str, match_name: str) -> Optional[str]:
    if not score:
        return None

    try:
        parts = score.split('-')
        if len(parts) != 2:
            return None
        home_score = int(parts[0].strip())
        away_score = int(parts[1].strip())

        is_home = home_away == "Thuis"
        if not home_away and match_name:
            is_home = match_name.split(' - ')[0].strip().lower().startswith('ajax')

        if is_home:
            if home_score > away_score:
                return "W"
            if home_score < away_score:
                return "L"
            return "D"
        else:
            if away_score > home_score:
                return "W"
            if away_score < home_score:
                return "L"
            return "D"
    except (ValueError, AttributeError):
        return None


def fetch_ajax_team_id(token: str) -> Optional[int]:
    url = "https://api.football-data.org/v4/teams?name=Ajax"
    headers = {"X-Auth-Token": token}
    try:
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError):
        return None

    teams = payload.get("teams", []) or []
    for team in teams:
        name = (team.get("name") or "").lower()
        if "ajax" in name and "amsterdam" in name:
            return team.get("id")
    for team in teams:
        name = (team.get("name") or "").lower()
        if "ajax" in name:
            return team.get("id")
    return None


def fetch_ajax_match_results(date_from: str, date_to: str) -> Dict[Tuple[str, str], str]:
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        print("  FOOTBALL_DATA_TOKEN not set. Skipping match results fetch.")
        return {}

    team_id = fetch_ajax_team_id(token)
    if not team_id:
        print("  Could not resolve Ajax team id. Skipping match results fetch.")
        return {}

    url = f"https://api.football-data.org/v4/teams/{team_id}/matches"
    headers = {"X-Auth-Token": token}
    params = {
        "status": "FINISHED",
        "dateFrom": date_from,
        "dateTo": date_to
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=20)
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"  Warning: failed to fetch match results ({exc})")
        return {}

    results = {}
    for match in payload.get("matches", []) or []:
        utc_date = match.get("utcDate", "")
        date_key = utc_date.split("T")[0] if utc_date else None
        if not date_key:
            continue

        home_team = match.get("homeTeam", {}) or {}
        away_team = match.get("awayTeam", {}) or {}
        home_name = home_team.get("name")
        away_name = away_team.get("name")
        if not home_name or not away_name:
            continue

        score = match.get("score", {}).get("fullTime", {})
        home_score = score.get("home")
        away_score = score.get("away")
        if home_score is None or away_score is None:
            continue

        home_norm = normalize_team_name(home_name)
        away_norm = normalize_team_name(away_name)
        opponent = away_name if "ajax" in home_norm else home_name
        opponent_norm = normalize_team_name(opponent)

        results[(date_key, opponent_norm)] = f"{home_score}-{away_score}"

    print(f"  Loaded {len(results)} match scores from football-data.org")
    return results


def merge_data(api_data: Dict[str, int], sheet_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge API and sheet data by date, with deduplication"""
    merged = []
    seen_matches = set()  # Track duplicates by (date, match_name)
    dates = [r.get('date', '') for r in sheet_data if r.get('date')]
    date_from = min(dates) if dates else None
    date_to = max(dates) if dates else None
    results_map = fetch_ajax_match_results(date_from, date_to) if date_from and date_to else {}
    
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

        # Fill missing scores/results from football-data.org for Ajax matches
        if not uitslag:
            opponent = extract_opponent(match_name)
            opponent_norm = normalize_team_name(opponent or "")
            score_key = (date_key, opponent_norm)
            if score_key in results_map:
                uitslag = results_map[score_key]
        if not result and uitslag:
            result = determine_result(uitslag, home_away, match_name)
        
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
