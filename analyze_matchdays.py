#!/usr/bin/env python3
"""
Analysis script for merged matchdays data
Analyzes commentators, kickoff times, and weekday performance
"""
import json
import csv
import os
import re
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from statistics import median, mean

import requests


def load_merged_data(filepath: str) -> List[Dict[str, Any]]:
    """Load merged matchdays JSON data"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def parse_kickoff(kickoff: str) -> Optional[int]:
    """Parse kickoff time 'HH:MM' to minutes since midnight"""
    if not kickoff or not isinstance(kickoff, str):
        return None
    try:
        parts = kickoff.split(':')
        if len(parts) != 2:
            return None
        hours = int(parts[0])
        minutes = int(parts[1])
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        return None


def get_kickoff_block(kickoff_minutes: Optional[int]) -> Optional[str]:
    """Categorize kickoff time into blocks"""
    if kickoff_minutes is None:
        return None
    
    if 12 * 60 <= kickoff_minutes < 15 * 60:  # 12:00-14:59
        return "12:00-14:59"
    elif 15 * 60 <= kickoff_minutes < 18 * 60:  # 15:00-17:59
        return "15:00-17:59"
    elif 18 * 60 <= kickoff_minutes < 20 * 60:  # 18:00-19:59
        return "18:00-19:59"
    elif 20 * 60 <= kickoff_minutes < 21 * 60:  # 20:00-20:59
        return "20:00-20:59"
    elif kickoff_minutes >= 21 * 60:  # 21:00+
        return "21:00+"
    else:
        return "Other"


def get_weekday(date_str: str) -> Optional[str]:
    """Get weekday name from date string (YYYY-MM-DD)"""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%A')
    except (ValueError, AttributeError):
        return None


def is_future_date(date_str: str, today: date) -> bool:
    """Return True if date_str is after today (YYYY-MM-DD)."""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date() > today
    except (ValueError, TypeError):
        return False


def get_commentator_duo(commentators: List[str]) -> str:
    """Create a stable commentator duo label."""
    if not commentators:
        return "Unknown"
    if len(commentators) == 1:
        return f"Solo: {commentators[0]}"
    if len(commentators) == 2:
        sorted_pair = sorted(commentators)
        return f"{sorted_pair[0]} & {sorted_pair[1]}"
    return "Multi"


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
    "az 67": "az",
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


def fetch_eredivisie_standings() -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        print("Warning: FOOTBALL_DATA_TOKEN not set. Skipping standings fetch.")
        return [], {}

    url = "https://api.football-data.org/v4/competitions/DED/standings"
    headers = {"X-Auth-Token": token}

    try:
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"Warning: failed to fetch Eredivisie standings ({exc})")
        return [], {}

    standings = payload.get("standings", [])
    total = next((s for s in standings if s.get("type") == "TOTAL"), None)
    table = (total or {}).get("table", [])
    entries = []
    mapping = {}
    for row in table:
        position = row.get("position")
        team = row.get("team", {}) or {}
        name = team.get("shortName") or team.get("name") or team.get("tla")
        if not isinstance(position, int) or not name:
            continue
        entries.append({"position": position, "team": name})
        normalized = normalize_team_name(name)
        if normalized:
            mapping[normalized] = position
    return entries, mapping


def add_opponent_positions(records: List[Dict[str, Any]],
                           standings_map: Dict[str, int]) -> None:
    for record in records:
        opponent = extract_opponent(record.get("match_name"))
        if not opponent:
            record["opponent"] = None
            record["opponent_position"] = None
            continue
        normalized = normalize_team_name(opponent)
        record["opponent"] = opponent
        record["opponent_position"] = standings_map.get(normalized)


def build_feature_schema(records: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Build categorical feature schema from training records."""
    schema = {
        'kickoff_block': set(),
        'weekday': set(),
        'home_away': set(),
        'tv_category': set(),
        'commentator_duo': set()
    }

    for record in records:
        kickoff_minutes = parse_kickoff(record.get('kickoff'))
        kickoff_block = get_kickoff_block(kickoff_minutes) or "Unknown"
        weekday = get_weekday(record.get('date', '')) or "Unknown"
        home_away = record.get('home_away') or "Unknown"
        tv_category = categorize_tv_channel(record.get('tv_channel')) or "Unknown"
        duo = get_commentator_duo(record.get('commentators', []))

        schema['kickoff_block'].add(kickoff_block)
        schema['weekday'].add(weekday)
        schema['home_away'].add(home_away)
        schema['tv_category'].add(tv_category)
        schema['commentator_duo'].add(duo)

    # Ensure unknown bucket exists
    for key in schema:
        schema[key].add("Unknown")

    return {key: sorted(values) for key, values in schema.items()}


def encode_record(record: Dict[str, Any], schema: Dict[str, List[str]]) -> List[float]:
    """Encode record into feature vector with one-hot categories."""
    kickoff_minutes = parse_kickoff(record.get('kickoff'))
    kickoff_block = get_kickoff_block(kickoff_minutes) or "Unknown"
    weekday = get_weekday(record.get('date', '')) or "Unknown"
    home_away = record.get('home_away') or "Unknown"
    tv_category = categorize_tv_channel(record.get('tv_channel')) or "Unknown"
    duo = get_commentator_duo(record.get('commentators', []))
    opponent_position = record.get('opponent_position')
    opponent_position_value = float(opponent_position) if isinstance(opponent_position, int) else 0.0

    features = [1.0]  # intercept
    features.append(opponent_position_value)

    for key, value in [
        ('kickoff_block', kickoff_block),
        ('weekday', weekday),
        ('home_away', home_away),
        ('tv_category', tv_category),
        ('commentator_duo', duo)
    ]:
        categories = schema.get(key, ["Unknown"])
        if value not in categories:
            value = "Unknown"
        features.extend([1.0 if value == category else 0.0 for category in categories])

    return features


def transpose(matrix: List[List[float]]) -> List[List[float]]:
    return [list(row) for row in zip(*matrix)]


def matmul(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
    result = [[0.0 for _ in range(len(b[0]))] for _ in range(len(a))]
    for i in range(len(a)):
        for k in range(len(b)):
            for j in range(len(b[0])):
                result[i][j] += a[i][k] * b[k][j]
    return result


def invert_matrix(matrix: List[List[float]]) -> Optional[List[List[float]]]:
    size = len(matrix)
    augmented = [row[:] + [1.0 if i == j else 0.0 for j in range(size)] for i, row in enumerate(matrix)]

    for i in range(size):
        pivot = augmented[i][i]
        if abs(pivot) < 1e-9:
            swap_row = None
            for j in range(i + 1, size):
                if abs(augmented[j][i]) > 1e-9:
                    swap_row = j
                    break
            if swap_row is None:
                return None
            augmented[i], augmented[swap_row] = augmented[swap_row], augmented[i]
            pivot = augmented[i][i]

        pivot_inv = 1.0 / pivot
        augmented[i] = [value * pivot_inv for value in augmented[i]]

        for j in range(size):
            if j == i:
                continue
            factor = augmented[j][i]
            augmented[j] = [
                augmented[j][k] - factor * augmented[i][k]
                for k in range(2 * size)
            ]

    return [row[size:] for row in augmented]


def fit_linear_regression(features: List[List[float]], targets: List[float]) -> Optional[List[float]]:
    if not features or len(features) != len(targets):
        return None

    rows = len(features)
    cols = len(features[0])
    if rows <= cols:
        return None

    x = features
    y = [[value] for value in targets]

    xt = transpose(x)
    xtx = matmul(xt, x)
    xtx_inv = invert_matrix(xtx)
    if xtx_inv is None:
        return None
    xty = matmul(xt, y)
    beta = matmul(xtx_inv, xty)
    return [row[0] for row in beta]


def predict_listeners(record: Dict[str, Any],
                      schema: Dict[str, List[str]],
                      coefficients: Optional[List[float]],
                      fallback_average: float,
                      kickoff_averages: Dict[str, float]) -> int:
    if coefficients is None:
        kickoff_minutes = parse_kickoff(record.get('kickoff'))
        kickoff_block = get_kickoff_block(kickoff_minutes) or "Unknown"
        baseline = kickoff_averages.get(kickoff_block, fallback_average)
        return max(0, int(round(baseline)))

    features = encode_record(record, schema)
    prediction = sum(weight * value for weight, value in zip(coefficients, features))
    if prediction < 0:
        prediction = 0
    return int(round(prediction))


def analyze_commentators(data: List[Dict[str, Any]], split_credit: bool = False) -> Dict[str, Any]:
    """Analyze commentator performance"""
    # Collect listener counts per commentator
    commentator_stats = defaultdict(list)
    commentator_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        commentators = record.get('commentators', [])
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        # Skip if no commentators
        if not commentators or not isinstance(commentators, list):
            continue
        
        # Filter out None/empty commentators
        valid_commentators = [c for c in commentators if c and isinstance(c, str)]
        if not valid_commentators:
            continue
        
        if split_credit:
            # Divide listeners equally among commentators
            credit_per_commentator = listeners / len(valid_commentators)
            for commentator in valid_commentators:
                commentator_stats[commentator].append(credit_per_commentator)
                commentator_matches[commentator] += 1
        else:
            # Full credit to each commentator
            for commentator in valid_commentators:
                commentator_stats[commentator].append(listeners)
                commentator_matches[commentator] += 1
    
    # Compute statistics
    results = []
    for commentator, listener_counts in commentator_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'commentator': commentator,
            'matches_count': commentator_matches[commentator],
            'min': int(min(listener_counts)),
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by avg descending
    results.sort(key=lambda x: x['avg'], reverse=True)
    
    return {
        'excluded_null_listeners': excluded_count,
        'commentators': results[:20]  # Top 20
    }


def analyze_commentator_duos(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze commentator duos (pairs)"""
    duo_stats = defaultdict(list)
    duo_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        commentators = record.get('commentators', [])
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        # Skip if not exactly 2 commentators
        if not commentators or not isinstance(commentators, list):
            continue
        
        valid_commentators = [c for c in commentators if c and isinstance(c, str)]
        if len(valid_commentators) != 2:
            continue
        
        # Create sorted pair key
        duo_key = tuple(sorted(valid_commentators))
        duo_str = f"{duo_key[0]} & {duo_key[1]}"
        
        duo_stats[duo_str].append(listeners)
        duo_matches[duo_str] += 1
    
    # Compute statistics
    results = []
    for duo, listener_counts in duo_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'duo': duo,
            'matches_count': duo_matches[duo],
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by avg descending
    results.sort(key=lambda x: x['avg'], reverse=True)
    
    return {
        'excluded_null_listeners': excluded_count,
        'duos': results
    }


def analyze_kickoff_exact(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze performance by exact kickoff time"""
    kickoff_stats = defaultdict(list)
    kickoff_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        kickoff = record.get('kickoff')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        if not kickoff:
            continue
        
        kickoff_stats[kickoff].append(listeners)
        kickoff_matches[kickoff] += 1
    
    # Compute statistics
    results = []
    for kickoff, listener_counts in kickoff_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'kickoff': kickoff,
            'matches_count': kickoff_matches[kickoff],
            'min': int(min(listener_counts)),
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by kickoff time
    results.sort(key=lambda x: x['kickoff'])
    
    return {
        'excluded_null_listeners': excluded_count,
        'kickoff_times': results
    }


def analyze_kickoff_blocks(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze performance by kickoff time blocks"""
    block_stats = defaultdict(list)
    block_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        kickoff = record.get('kickoff')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        kickoff_minutes = parse_kickoff(kickoff)
        block = get_kickoff_block(kickoff_minutes)
        
        if not block:
            continue
        
        block_stats[block].append(listeners)
        block_matches[block] += 1
    
    # Compute statistics
    results = []
    for block, listener_counts in block_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'kickoff_block': block,
            'matches_count': block_matches[block],
            'min': int(min(listener_counts)),
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by avg descending
    results.sort(key=lambda x: x['avg'], reverse=True)
    
    return {
        'excluded_null_listeners': excluded_count,
        'kickoff_blocks': results
    }


def analyze_weekday(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze performance by weekday"""
    weekday_stats = defaultdict(list)
    weekday_matches = defaultdict(int)
    
    excluded_count = 0
    
    # Define weekday order
    weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for record in data:
        listeners = record.get('listeners')
        date = record.get('date')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        weekday = get_weekday(date)
        if not weekday:
            continue
        
        weekday_stats[weekday].append(listeners)
        weekday_matches[weekday] += 1
    
    # Compute statistics
    results = []
    for weekday, listener_counts in weekday_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'weekday': weekday,
            'matches_count': weekday_matches[weekday],
            'min': int(min(listener_counts)),
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by weekday order
    results.sort(key=lambda x: weekday_order.index(x['weekday']) if x['weekday'] in weekday_order else 99)
    
    return {
        'excluded_null_listeners': excluded_count,
        'weekdays': results
    }


def save_json(data: Dict[str, Any], filepath: str):
    """Save data as JSON"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def save_csv(data: Dict[str, Any], filepath: str, list_key: str):
    """Save data as CSV"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    items = data.get(list_key, [])
    if not items:
        return
    
    fieldnames = list(items[0].keys())
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)


def print_console_report(data: List[Dict[str, Any]], analyses: Dict[str, Dict[str, Any]]):
    """Print console report"""
    total_matchdays = len(data)
    excluded_count = sum(1 for r in data if r.get('listeners') is None)
    included_count = total_matchdays - excluded_count
    
    print("\n" + "="*70)
    print("MATCHDAY ANALYSIS REPORT")
    print("="*70)
    print(f"\nTotal matchdays: {total_matchdays}")
    print(f"Excluded (null listeners): {excluded_count}")
    print(f"Included in analysis: {included_count}")
    
    # Top 10 Commentators (Full Credit)
    print("\n" + "-"*70)
    print("TOP 10 COMMENTATORS (Full Credit)")
    print("-"*70)
    commentators_full = analyses['commentators_full']['commentators'][:10]
    for i, c in enumerate(commentators_full, 1):
        print(f"{i:2d}. {c['commentator']:20s} | Matches: {c['matches_count']:3d} | "
              f"Avg: {c['avg']:8.2f} | Median: {c['median']:6d} | Max: {c['max']:6d}")
    
    # Top 10 Kickoff Blocks
    print("\n" + "-"*70)
    print("TOP 10 KICKOFF BLOCKS")
    print("-"*70)
    kickoff_blocks = analyses['kickoff_blocks']['kickoff_blocks'][:10]
    for i, kb in enumerate(kickoff_blocks, 1):
        print(f"{i:2d}. {kb['kickoff_block']:15s} | Matches: {kb['matches_count']:3d} | "
              f"Avg: {kb['avg']:8.2f} | Median: {kb['median']:6d} | Max: {kb['max']:6d}")
    
    # Weekday Ranking
    print("\n" + "-"*70)
    print("WEEKDAY RANKING (by average listeners)")
    print("-"*70)
    weekdays = sorted(analyses['weekday']['weekdays'], key=lambda x: x['avg'], reverse=True)
    for i, wd in enumerate(weekdays, 1):
        print(f"{i:2d}. {wd['weekday']:12s} | Matches: {wd['matches_count']:3d} | "
              f"Avg: {wd['avg']:8.2f} | Median: {wd['median']:6d} | Max: {wd['max']:6d}")
    
    print("\n" + "="*70)


def prepare_all_matches(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prepare all matches data for dashboard overview"""
    matches = []
    
    for record in data:
        date = record.get('date', '')
        kickoff = record.get('kickoff', '')
        weekday = get_weekday(date)
        
        commentators = record.get('commentators', [])
        commentator_str = " & ".join(commentators) if commentators else "N/A"
        
        match_data = {
            'date': date,
            'weekday': weekday,
            'time': kickoff,
            'match_name': record.get('match_name', ''),
            'commentators': commentator_str,
            'listeners': record.get('listeners'),
            'competition': record.get('competition', ''),
            'tv_channel': record.get('tv_channel'),
            'score': record.get('score'),
            'result': record.get('result'),  # W, D, or L
            'home_away': record.get('home_away', '')
        }
        matches.append(match_data)
    
    # Sort by date descending (reverse chronological)
    matches.sort(key=lambda x: x['date'], reverse=True)
    
    return matches


def get_top5_games(data: List[Dict[str, Any]], season: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get top 5 games by listeners for a season"""
    # Filter by season if provided
    filtered_data = data
    if season:
        # Determine date range based on season
        # 2024/2025: dates from 2024-07-01 to 2025-06-30
        # 2025/2026: dates from 2025-07-01 to 2026-06-30
        if season == "2024/2025":
            start_date = "2024-07-01"
            end_date = "2025-06-30"
        elif season == "2025/2026":
            start_date = "2025-07-01"
            end_date = "2026-06-30"
        else:
            start_date = None
            end_date = None
        
        if start_date and end_date:
            filtered_data = [
                r for r in data
                if r.get('date', '') >= start_date and r.get('date', '') <= end_date
            ]
    
    # Filter to only matches with listeners
    matches_with_listeners = [
        r for r in filtered_data
        if r.get('listeners') is not None
    ]
    
    # Sort by listeners descending
    matches_with_listeners.sort(key=lambda x: x.get('listeners', 0), reverse=True)
    
    # Get top 5 and format
    top5 = []
    for record in matches_with_listeners[:5]:
        date = record.get('date', '')
        kickoff = record.get('kickoff', '')
        kickoff_minutes = parse_kickoff(kickoff)
        kickoff_block = get_kickoff_block(kickoff_minutes)
        weekday = get_weekday(date)
        
        commentators = record.get('commentators', [])
        commentator_str = " & ".join(commentators) if commentators else "N/A"
        
        match_data = {
            'date': date,
            'weekday': weekday,
            'time': kickoff,
            'match_name': record.get('match_name', ''),
            'commentators': commentator_str,
            'listeners': record.get('listeners'),
            'competition': record.get('competition', ''),
            'tv_channel': record.get('tv_channel'),
            'score': record.get('score'),
            'result': record.get('result'),
            'home_away': record.get('home_away', '')
        }
        top5.append(match_data)
    
    return top5


def analyze_by_result(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze average listeners by match result (W/D/L)"""
    result_stats = defaultdict(list)
    result_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        result = record.get('result')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        # Skip if no result
        if not result or result not in ['W', 'D', 'L']:
            continue
        
        result_stats[result].append(listeners)
        result_matches[result] += 1
    
    # Compute statistics
    results = []
    for result, listener_counts in result_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'result': result,
            'matches_count': result_matches[result],
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'min': int(min(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by result: W, D, L
    result_order = {'W': 0, 'D': 1, 'L': 2}
    results.sort(key=lambda x: result_order.get(x['result'], 99))
    
    return {
        'excluded_null_listeners': excluded_count,
        'results': results
    }


def analyze_by_home_away(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze average listeners by home/away"""
    home_away_stats = defaultdict(list)
    home_away_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        home_away = record.get('home_away', '')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        # Normalize home/away
        if home_away.lower() in ['thuis', 'home']:
            ha_key = 'Thuis'
        elif home_away.lower() in ['uit', 'away']:
            ha_key = 'Uit'
        else:
            continue
        
        home_away_stats[ha_key].append(listeners)
        home_away_matches[ha_key] += 1
    
    # Compute statistics
    results = []
    for ha, listener_counts in home_away_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'home_away': ha,
            'matches_count': home_away_matches[ha],
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'min': int(min(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by home_away: Thuis, Uit
    ha_order = {'Thuis': 0, 'Uit': 1}
    results.sort(key=lambda x: ha_order.get(x['home_away'], 99))
    
    return {
        'excluded_null_listeners': excluded_count,
        'home_away': results
    }


def categorize_tv_channel(tv_channel: Optional[str]) -> Optional[str]:
    """Categorize TV channel into Half-open, Open, or Paid"""
    if not tv_channel:
        return None
    
    tv_lower = tv_channel.strip().upper()
    
    # Half-open: ZIGGO
    if 'ZIGGO' in tv_lower:
        return 'Half-open'
    
    # Open: ESPN or ESPN1 (including "ESPN 1" with space)
    # Check for ESPN1 or "ESPN 1" (with or without space)
    if tv_lower.startswith('ESPN'):
        # Remove spaces for comparison
        tv_no_space = tv_lower.replace(' ', '')
        if tv_no_space == 'ESPN' or tv_no_space == 'ESPN1':
            return 'Open'
    
    # Paid: all other channels
    return 'Paid'


def analyze_by_tv_category(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze average listeners by TV channel category"""
    category_stats = defaultdict(list)
    category_matches = defaultdict(int)
    
    excluded_count = 0
    
    for record in data:
        listeners = record.get('listeners')
        tv_channel = record.get('tv_channel', '')
        
        # Skip if no listeners data
        if listeners is None:
            excluded_count += 1
            continue
        
        # Categorize TV channel
        category = categorize_tv_channel(tv_channel)
        if not category:
            continue
        
        category_stats[category].append(listeners)
        category_matches[category] += 1
    
    # Compute statistics
    results = []
    for category, listener_counts in category_stats.items():
        if not listener_counts:
            continue
        
        results.append({
            'category': category,
            'matches_count': category_matches[category],
            'avg': round(mean(listener_counts), 2),
            'median': int(median(listener_counts)),
            'min': int(min(listener_counts)),
            'max': int(max(listener_counts))
        })
    
    # Sort by category: Half-open, Open, Paid
    category_order = {'Half-open': 0, 'Open': 1, 'Paid': 2}
    results.sort(key=lambda x: category_order.get(x['category'], 99))
    
    return {
        'excluded_null_listeners': excluded_count,
        'categories': results
    }


def main():
    input_file = 'merged_matchdays.json'
    output_dir = 'dashboard/public/output'
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        print("Please create merged_matchdays.json with the required fields:")
        print("  - date (YYYY-MM-DD)")
        print("  - listeners (int or null)")
        print("  - kickoff (HH:MM)")
        print("  - competition (string)")
        print("  - commentators (array of strings)")
        return
    
    print("Loading merged matchdays data...")
    data = load_merged_data(input_file)
    print(f"Loaded {len(data)} records")

    today = datetime.utcnow().date()
    past_records = [r for r in data if not is_future_date(r.get('date', ''), today)]
    future_records = [r for r in data if is_future_date(r.get('date', ''), today)]
    print(f"Past records: {len(past_records)}")
    print(f"Future records: {len(future_records)}")
    
    print("\nFetching latest Eredivisie standings...")
    standings, standings_map = fetch_eredivisie_standings()
    print(f"Standings entries: {len(standings)}")
    add_opponent_positions(past_records, standings_map)
    add_opponent_positions(future_records, standings_map)

    print("\nRunning analyses...")
    
    # A) Commentators analysis
    print("  - Analyzing commentators (full credit)...")
    commentators_full = analyze_commentators(past_records, split_credit=False)
    
    print("  - Analyzing commentators (split credit)...")
    commentators_split = analyze_commentators(past_records, split_credit=True)
    
    print("  - Analyzing commentator duos...")
    commentator_duos = analyze_commentator_duos(past_records)
    
    # B) Kickoff analysis
    print("  - Analyzing exact kickoff times...")
    kickoff_exact = analyze_kickoff_exact(past_records)
    
    print("  - Analyzing kickoff blocks...")
    kickoff_blocks = analyze_kickoff_blocks(past_records)
    
    # C) Weekday analysis
    print("  - Analyzing weekdays...")
    weekday = analyze_weekday(past_records)
    
    # D) All matches overview
    print("  - Preparing all matches overview...")
    all_matches = prepare_all_matches(past_records)
    
    # E) Top 5 games by season
    print("  - Preparing top 5 games...")
    top5_2024_2025 = get_top5_games(past_records, "2024/2025")
    top5_2025_2026 = get_top5_games(past_records, "2025/2026")
    top5_games = {
        '2024/2025': top5_2024_2025,
        '2025/2026': top5_2025_2026
    }
    
    # F) Analyze by result (W/D/L)
    print("  - Analyzing by result (W/D/L)...")
    by_result = analyze_by_result(past_records)
    
    # G) Analyze by home/away
    print("  - Analyzing by home/away...")
    by_home_away = analyze_by_home_away(past_records)
    
    # H) Analyze by TV channel category
    print("  - Analyzing by TV channel category...")
    by_tv_category = analyze_by_tv_category(past_records)

    # Predictions for future matches
    print("  - Predicting listeners for future matches...")
    training_records = [r for r in past_records if r.get('listeners') is not None]
    schema = build_feature_schema(training_records) if training_records else {
        'kickoff_block': ["Unknown"],
        'weekday': ["Unknown"],
        'home_away': ["Unknown"],
        'tv_category': ["Unknown"],
        'commentator_duo': ["Unknown"]
    }

    training_features = [encode_record(r, schema) for r in training_records]
    training_targets = [r.get('listeners', 0) for r in training_records]
    coefficients = fit_linear_regression(training_features, training_targets)

    overall_average = mean(training_targets) if training_targets else 0
    kickoff_averages = {}
    if training_records:
        kickoff_buckets = defaultdict(list)
        for record in training_records:
            kickoff_minutes = parse_kickoff(record.get('kickoff'))
            kickoff_block = get_kickoff_block(kickoff_minutes) or "Unknown"
            kickoff_buckets[kickoff_block].append(record.get('listeners', 0))
        kickoff_averages = {
            block: mean(values) if values else overall_average
            for block, values in kickoff_buckets.items()
        }

    future_matches = []
    for record in future_records:
        predicted = predict_listeners(record, schema, coefficients, overall_average, kickoff_averages)
        future_matches.append({
            'date': record.get('date', ''),
            'weekday': get_weekday(record.get('date', '')),
            'time': record.get('kickoff'),
            'match_name': record.get('match_name', ''),
            'commentators': " & ".join(record.get('commentators', [])) if record.get('commentators') else "N/A",
            'competition': record.get('competition', ''),
            'tv_channel': record.get('tv_channel'),
            'tv_category': categorize_tv_channel(record.get('tv_channel')) or "Unknown",
            'home_away': record.get('home_away', ''),
            'opponent': record.get('opponent'),
            'opponent_position': record.get('opponent_position'),
            'predicted_listeners': predicted
        })

    recent_predictions = []
    for record in training_records:
        predicted = predict_listeners(record, schema, coefficients, overall_average, kickoff_averages)
        recent_predictions.append({
            'date': record.get('date', ''),
            'match_name': record.get('match_name', ''),
            'listeners': record.get('listeners'),
            'predicted_listeners': predicted
        })
    recent_predictions.sort(key=lambda x: x.get('date', ''), reverse=True)
    recent_predictions = list(reversed(recent_predictions[:10]))
    
    # Save JSON files
    print(f"\nSaving results to {output_dir}/...")
    save_json(commentators_full, f'{output_dir}/commentators_full_credit.json')
    save_json(commentators_split, f'{output_dir}/commentators_split_credit.json')
    save_json(commentator_duos, f'{output_dir}/commentator_duos.json')
    save_json(kickoff_exact, f'{output_dir}/kickoff_exact.json')
    save_json(kickoff_blocks, f'{output_dir}/kickoff_blocks.json')
    save_json(weekday, f'{output_dir}/weekday.json')
    save_json({'matches': all_matches}, f'{output_dir}/all_matches.json')
    save_json(top5_games, f'{output_dir}/top5_games.json')
    save_json(by_result, f'{output_dir}/by_result.json')
    save_json(by_home_away, f'{output_dir}/by_home_away.json')
    save_json(by_tv_category, f'{output_dir}/by_tv_category.json')
    save_json({'matches': future_matches}, f'{output_dir}/future_matches.json')
    save_json({'matches': recent_predictions}, f'{output_dir}/recent_predictions.json')
    
    # Save CSV files
    save_csv(commentators_full, f'{output_dir}/commentators_full_credit.csv', 'commentators')
    save_csv(commentators_split, f'{output_dir}/commentators_split_credit.csv', 'commentators')
    save_csv(commentator_duos, f'{output_dir}/commentator_duos.csv', 'duos')
    save_csv(kickoff_exact, f'{output_dir}/kickoff_exact.csv', 'kickoff_times')
    save_csv(kickoff_blocks, f'{output_dir}/kickoff_blocks.csv', 'kickoff_blocks')
    save_csv(weekday, f'{output_dir}/weekday.csv', 'weekdays')
    
    print("All files saved successfully!")
    
    # Print console report
    analyses = {
        'commentators_full': commentators_full,
        'commentators_split': commentators_split,
        'commentator_duos': commentator_duos,
        'kickoff_exact': kickoff_exact,
        'kickoff_blocks': kickoff_blocks,
        'weekday': weekday
    }
    print_console_report(data, analyses)


if __name__ == '__main__':
    main()
