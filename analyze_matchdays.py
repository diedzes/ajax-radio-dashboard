#!/usr/bin/env python3
"""
Analysis script for merged matchdays data
Analyzes commentators, kickoff times, and weekday performance
"""
import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict
from statistics import median, mean


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
    
    print("\nRunning analyses...")
    
    # A) Commentators analysis
    print("  - Analyzing commentators (full credit)...")
    commentators_full = analyze_commentators(data, split_credit=False)
    
    print("  - Analyzing commentators (split credit)...")
    commentators_split = analyze_commentators(data, split_credit=True)
    
    print("  - Analyzing commentator duos...")
    commentator_duos = analyze_commentator_duos(data)
    
    # B) Kickoff analysis
    print("  - Analyzing exact kickoff times...")
    kickoff_exact = analyze_kickoff_exact(data)
    
    print("  - Analyzing kickoff blocks...")
    kickoff_blocks = analyze_kickoff_blocks(data)
    
    # C) Weekday analysis
    print("  - Analyzing weekdays...")
    weekday = analyze_weekday(data)
    
    # D) All matches overview
    print("  - Preparing all matches overview...")
    all_matches = prepare_all_matches(data)
    
    # E) Top 5 games by season
    print("  - Preparing top 5 games...")
    top5_2024_2025 = get_top5_games(data, "2024/2025")
    top5_2025_2026 = get_top5_games(data, "2025/2026")
    top5_games = {
        '2024/2025': top5_2024_2025,
        '2025/2026': top5_2025_2026
    }
    
    # F) Analyze by result (W/D/L)
    print("  - Analyzing by result (W/D/L)...")
    by_result = analyze_by_result(data)
    
    # G) Analyze by home/away
    print("  - Analyzing by home/away...")
    by_home_away = analyze_by_home_away(data)
    
    # H) Analyze by TV channel category
    print("  - Analyzing by TV channel category...")
    by_tv_category = analyze_by_tv_category(data)
    
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
