#!/usr/bin/env python3
"""
Script to fetch match scores from SofaScore and merge with existing data
Since SofaScore doesn't have a public API, this script attempts to scrape the data
or can be used to manually add scores.
"""
import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup


def load_merged_data(filepath: str = 'merged_matchdays.json') -> List[Dict[str, Any]]:
    """Load merged matchdays JSON data"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filepath} not found")
        return []


def parse_score_from_sofascore(match_name: str, date: str) -> Optional[Dict[str, Any]]:
    """
    Attempt to parse score from SofaScore
    This is a placeholder - actual implementation would need to scrape the page
    """
    # For now, return None - scores will need to be added manually or via scraping
    return None


def determine_result(score: str, home_away: str, match_name: str) -> Optional[str]:
    """
    Determine if Ajax won (W), drew (D), or lost (L)
    score format: "2-1" or "1-2"
    home_away: "Thuis" or "Uit"
    match_name: e.g., "Ajax - PSV" or "PSV - Ajax"
    """
    if not score:
        return None
    
    try:
        # Parse score
        parts = score.split('-')
        if len(parts) != 2:
            return None
        
        home_score = int(parts[0].strip())
        away_score = int(parts[1].strip())
        
        # Determine if Ajax is home or away
        is_home = home_away == "Thuis" or (match_name and "Ajax" in match_name and match_name.split()[0] == "Ajax")
        
        if is_home:
            # Ajax is home team
            if home_score > away_score:
                return "W"
            elif home_score < away_score:
                return "L"
            else:
                return "D"
        else:
            # Ajax is away team
            if away_score > home_score:
                return "W"
            elif away_score < home_score:
                return "L"
            else:
                return "D"
    except (ValueError, AttributeError):
        return None


def add_scores_to_data(data: List[Dict[str, Any]], scores_file: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Add scores to match data
    If scores_file is provided, load scores from JSON file
    Format: { "date": "2024-08-03", "score": "2-1" }
    """
    # Load scores from file if provided
    scores_dict = {}
    if scores_file:
        try:
            with open(scores_file, 'r', encoding='utf-8') as f:
                scores_data = json.load(f)
                if isinstance(scores_data, list):
                    for entry in scores_data:
                        if 'date' in entry and 'score' in entry:
                            scores_dict[entry['date']] = entry['score']
                elif isinstance(scores_data, dict):
                    scores_dict = scores_data
        except FileNotFoundError:
            print(f"Warning: Scores file {scores_file} not found")
    
    # Add scores to data
    for record in data:
        date = record.get('date', '')
        if date in scores_dict:
            score = scores_dict[date]
            record['score'] = score
            record['result'] = determine_result(
                score,
                record.get('home_away', ''),
                record.get('match_name', '')
            )
    
    return data


def scrape_sofascore_matches() -> Dict[str, str]:
    """
    Scrape match scores from SofaScore
    This is a placeholder - actual implementation would need proper scraping
    """
    # SofaScore URL for Ajax matches
    url = "https://www.sofascore.com/nl/football/team/ajax/2953#tab:matches"
    
    try:
        # Note: This will likely fail due to JavaScript rendering
        # A proper implementation would need Selenium or similar
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Parse would go here
            # For now, return empty dict
            return {}
    except Exception as e:
        print(f"Error scraping SofaScore: {e}")
        return {}
    
    return {}


def main():
    print("Fetching match scores...")
    print("-" * 60)
    
    # Load merged data
    print("Loading merged matchdays data...")
    data = load_merged_data()
    if not data:
        print("Error: No merged data found. Run merge_data.py first.")
        return
    
    print(f"Loaded {len(data)} match records")
    
    # Try to load scores from file
    scores_file = 'match_scores.json'
    print(f"\nLoading scores from {scores_file}...")
    data = add_scores_to_data(data, scores_file)
    
    # Count matches with scores
    with_scores = sum(1 for r in data if r.get('score'))
    without_scores = len(data) - with_scores
    
    print(f"Matches with scores: {with_scores}")
    print(f"Matches without scores: {without_scores}")
    
    # Save updated data
    output_file = 'merged_matchdays.json'
    print(f"\nSaving updated data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved {len(data)} records to {output_file}")
    
    # Show sample
    print("\nSample records with scores (first 3):")
    for i, record in enumerate([r for r in data if r.get('score')][:3], 1):
        print(f"\n{i}. Date: {record['date']}")
        print(f"   Match: {record.get('match_name', 'N/A')}")
        print(f"   Score: {record.get('score', 'N/A')}")
        print(f"   Result: {record.get('result', 'N/A')}")


if __name__ == '__main__':
    main()
