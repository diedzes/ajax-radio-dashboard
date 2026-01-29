#!/usr/bin/env python3
"""
Fetch Transistor podcast data and analytics for the dashboard.
Outputs:
  - dashboard/public/output/podcast_episodes.json
  - dashboard/public/output/podcast_monthly.json
  - dashboard/public/output/podcast_apps.json
"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

import requests


API_BASE = "https://api.transistor.fm/v1"
DEFAULT_FEED_URL = "https://feeds.transistor.fm/ajax-podcast"
OUTPUT_DIR = "dashboard/public/output"


def get_api_key() -> str:
    api_key = os.getenv("TRANSISTOR_API_KEY")
    if not api_key:
        raise RuntimeError("Missing TRANSISTOR_API_KEY environment variable.")
    return api_key


def get_feed_url() -> str:
    return os.getenv("TRANSISTOR_FEED_URL", DEFAULT_FEED_URL)


def api_get(path: str, api_key: str, params: dict | None = None) -> dict:
    response = requests.get(
        f"{API_BASE}{path}",
        headers={"x-api-key": api_key},
        params=params,
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def resolve_show_id(api_key: str, feed_url: str) -> str:
    page = 1
    while True:
        payload = api_get("/shows", api_key, params={
            "pagination[page]": page,
            "pagination[per]": 50
        })
        for show in payload.get("data", []):
            attributes = show.get("attributes", {})
            if attributes.get("feed_url") == feed_url:
                return show.get("id")
        meta = payload.get("meta", {})
        if page >= meta.get("totalPages", page):
            break
        page += 1
    raise RuntimeError(f"Show not found for feed URL: {feed_url}")


def fetch_all_episodes(api_key: str, show_id: str) -> list[dict]:
    episodes = []
    page = 1
    while True:
        payload = api_get("/episodes", api_key, params={
            "show_id": show_id,
            "status": "published",
            "order": "desc",
            "pagination[page]": page,
            "pagination[per]": 100
        })
        episodes.extend(payload.get("data", []))
        meta = payload.get("meta", {})
        if page >= meta.get("totalPages", page):
            break
        page += 1
    return episodes


def fetch_episode_analytics(api_key: str, show_id: str, start_date: str, end_date: str) -> dict:
    payload = api_get(f"/analytics/{show_id}/episodes", api_key, params={
        "start_date": start_date,
        "end_date": end_date
    })
    analytics = {}
    for entry in payload.get("data", {}).get("attributes", {}).get("episodes", []):
        downloads = entry.get("downloads", [])
        total_downloads = sum(item.get("downloads", 0) for item in downloads)
        analytics[str(entry.get("id"))] = total_downloads
    return analytics


def fetch_show_analytics(api_key: str, show_id: str, start_date: str, end_date: str) -> list[dict]:
    payload = api_get(f"/analytics/{show_id}", api_key, params={
        "start_date": start_date,
        "end_date": end_date
    })
    downloads = payload.get("data", {}).get("attributes", {}).get("downloads", [])
    return downloads


def aggregate_monthly(downloads: list[dict]) -> list[dict]:
    monthly = defaultdict(int)
    for item in downloads:
        date_str = item.get("date")
        try:
            date_obj = datetime.strptime(date_str, "%d-%m-%Y")
        except (TypeError, ValueError):
            continue
        month_key = date_obj.strftime("%Y-%m")
        monthly[month_key] += int(item.get("downloads", 0))

    results = [{"month": month, "downloads": total} for month, total in monthly.items()]
    results.sort(key=lambda x: x["month"])
    return results


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def main():
    api_key = get_api_key()
    feed_url = get_feed_url()

    today = datetime.utcnow().date()
    end_date = today.strftime("%d-%m-%Y")
    start_date = (today - timedelta(days=730)).strftime("%d-%m-%Y")

    print("Resolving show ID...")
    show_id = resolve_show_id(api_key, feed_url)
    print(f"Resolved show ID: {show_id}")

    print("Fetching episodes...")
    episodes_raw = fetch_all_episodes(api_key, show_id)

    print("Fetching episode analytics...")
    episode_downloads = fetch_episode_analytics(api_key, show_id, start_date, end_date)

    episodes = []
    for episode in episodes_raw:
        attributes = episode.get("attributes", {})
        episode_id = str(episode.get("id"))
        episodes.append({
            "id": episode_id,
            "title": attributes.get("title"),
            "published_at": attributes.get("published_at"),
            "duration_in_mmss": attributes.get("duration_in_mmss"),
            "share_url": attributes.get("share_url"),
            "total_downloads": episode_downloads.get(episode_id, 0)
        })

    print("Fetching show analytics...")
    downloads = fetch_show_analytics(api_key, show_id, start_date, end_date)
    monthly = aggregate_monthly(downloads)

    ensure_output_dir()

    episodes_payload = {
        "show_id": show_id,
        "feed_url": feed_url,
        "window": {"start_date": start_date, "end_date": end_date},
        "episodes": episodes
    }

    monthly_payload = {
        "show_id": show_id,
        "feed_url": feed_url,
        "window": {"start_date": start_date, "end_date": end_date},
        "months": monthly
    }

    apps_payload = {
        "show_id": show_id,
        "feed_url": feed_url,
        "window": {"start_date": start_date, "end_date": end_date},
        "apps": []
    }

    with open(os.path.join(OUTPUT_DIR, "podcast_episodes.json"), "w", encoding="utf-8") as file:
        json.dump(episodes_payload, file, indent=2, ensure_ascii=False)

    with open(os.path.join(OUTPUT_DIR, "podcast_monthly.json"), "w", encoding="utf-8") as file:
        json.dump(monthly_payload, file, indent=2, ensure_ascii=False)

    with open(os.path.join(OUTPUT_DIR, "podcast_apps.json"), "w", encoding="utf-8") as file:
        json.dump(apps_payload, file, indent=2, ensure_ascii=False)

    print("Podcast data saved.")


if __name__ == "__main__":
    main()
