#!/usr/bin/env python3
"""
Ajax Radio - datadump-verwerker voor de dashboard.

Leest de CDN-logbestanden uit de Azure "datadump"-container (via de SAS-token
van Frank) en berekent per wedstrijddag: unieke luisteraars, gelijktijdige
luisteraars per minuut, platform-mix, geografische spreiding, streamkwaliteit
en een pre-roll performance-simulatie. Schrijft per dag een klein JSON-bestand
in dashboard/public/output/match_details/, dat de React-dashboard automatisch
oppikt (klikbare rij in "All Matches Overview").

Vereist: pip install requests

Gebruik (vanuit de root van dit repo):
    export AJAX_SAS_TOKEN='?sv=2026-02-06&ss=b&srt=co&sp=rl&se=...&sig=...'

    # welke dagen staan er klaar die we nog niet verwerkt hebben?
    python process_matchday.py list-new

    # één dag verwerken
    python process_matchday.py process --date 2026-08-05

    # alle nieuwe dagen in één keer verwerken
    python process_matchday.py process-all

Dit script is bedoeld om vanuit een geplande taak (GitHub Action) elke
ochtend na een wedstrijd te draaien, samen met merge_data.py/analyze_matchdays.py.
"""

import argparse
import csv
import json
import os
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timedelta

import requests

BASE = "https://stajaxradioprod.blob.core.windows.net"
DATADUMP_CONTAINER = "datadump"
LUISTERCIJFERS_CONTAINER = "luistercijfers"
LUISTERCIJFERS_BLOB = "luistercijfers.csv"

# Bekende relay/herdistributie-clients: geen individuele luisteraars, dus
# uitgesloten van alle "luisteraars"-cijfers. Herkenning op user-agent i.p.v.
# een vaste lijst met IP's, want die IP's wisselen per wedstrijd.
RELAY_UA_SIGNATURES = ("radioboss",)

# Ruwe mapping van CloudFront edge-locaties naar landen, voor de geografie-
# grafiek. Onbekende locaties vallen terug op "Overig".
EDGE_TO_COUNTRY = {
    "AMS56-P1": "Nederland",
    "BRU50-P1": "Belgie",
    "FRA60-P4": "Duitsland",
    "DUS51-P7": "Duitsland",
    "MAD53-P4": "Spanje",
    "CDG50-P5": "Frankrijk",
    "MRS52-P3": "Frankrijk",
    "LHR5-P1": "VK",
    "MXP63-P8": "Italie",
    "MIA50-P7": "VS",
}

QUALITY_LABELS = {"200": "200 OK", "404": "404 Not found", "000": "000 Timeout"}
QUALITY_COLORS = {"200": "#2e9e5b", "404": "#e2a13a", "000": "#d2122e"}
PLATFORM_COLORS = {
    "iOS-app": "#d2122e",
    "Relay/herdistributie": "#f4a6b3",
    "Webbrowser": "#f7c8d0",
    "Android-app": "#9ca3af",
    "Overig": "#c8c8c8",
}


def _sas():
    token = os.environ.get("AJAX_SAS_TOKEN")
    if not token:
        sys.exit("Zet eerst AJAX_SAS_TOKEN als environment variable (de query string van Frank, met of zonder leidende '?').")
    return token.lstrip("?")


def _url(container, blob_name=None, extra_query=None):
    url = f"{BASE}/{container}"
    if blob_name:
        url += f"/{blob_name}"
    qs = _sas()
    if extra_query:
        qs = f"{extra_query}&{qs}"
    return f"{url}?{qs}"


def list_datadump_dates():
    """Vraagt de container-listing op en geeft alle beschikbare {YYYY-MM-DD}
    bestanden terug, gesorteerd. Negeert bestanden die niet op het
    datumpatroon passen (zoals eenmalige handmatige uploads)."""
    url = _url(DATADUMP_CONTAINER, extra_query="restype=container&comp=list")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    root = ET.fromstring(r.text)
    dates = []
    for blob in root.iter("Blob"):
        name = blob.find("Name").text
        if name.endswith(".csv") and len(name) == 14:  # YYYY-MM-DD.csv
            try:
                datetime.strptime(name[:-4], "%Y-%m-%d")
                dates.append(name[:-4])
            except ValueError:
                continue
    return sorted(dates)


def fetch_official_luisteraars(date_str):
    """Probeert het officiële dagcijfer uit luistercijfers.csv te halen.
    Geeft None terug als die datum er nog niet in staat."""
    try:
        url = _url(LUISTERCIJFERS_CONTAINER, blob_name=LUISTERCIJFERS_BLOB)
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        reader = csv.DictReader(r.text.splitlines())
        for row in reader:
            if row.get("datum") == date_str:
                return int(row["luisteraars"])
    except Exception:
        pass
    return None


def _classify_platform(ua):
    ua_lower = ua.lower()
    if any(sig in ua_lower for sig in RELAY_UA_SIGNATURES):
        return "Relay/herdistributie"
    if "applecoremedia" in ua_lower:
        return "iOS-app"
    if "ktor-client" in ua_lower or "dalvik" in ua_lower:
        return "Android-app"
    if "mozilla" in ua_lower or "chrome" in ua_lower or "safari" in ua_lower:
        return "Webbrowser"
    return "Overig"


def process_date(date_str):
    """Downloadt en verwerkt één dag in één streaming pass (bestanden kunnen
    2+ GB zijn, dus alles wordt regel voor regel verwerkt, nooit volledig in
    het geheugen of op disk gezet)."""
    url = _url(DATADUMP_CONTAINER, blob_name=f"{date_str}.csv")
    resp = requests.get(url, stream=True, timeout=(10, 600))
    resp.raise_for_status()
    resp.encoding = "utf-8"

    reader = csv.DictReader(resp.iter_lines(decode_unicode=True))

    ip_total = set()
    ip_relay = set()
    platform_ctr = Counter()
    status_ctr = Counter()
    edge_ctr = Counter()
    bytes_total = 0
    n_radio = 0
    n_radio_excl_relay = 0

    per_ip_qual = defaultdict(int)
    per_ip_total = defaultdict(int)
    n_qualifying = 0

    events = []  # (epoch_seconds, +1/-1) voor concurrency sweep-line

    for row in reader:
        stem = row.get("cs_uri_stem", "")
        if "radio.mp3" not in stem:
            continue
        n_radio += 1
        ip = row["c_ip"]
        ua = row.get("cs_user_agent", "")
        platform = _classify_platform(ua)
        platform_ctr[platform] += 1
        is_relay = platform == "Relay/herdistributie"
        ip_total.add(ip)
        if is_relay:
            ip_relay.add(ip)

        try:
            tt = float(row.get("time_taken") or 0)
        except ValueError:
            tt = 0.0
        try:
            sc_bytes = int(row.get("sc_bytes") or 0)
        except ValueError:
            sc_bytes = 0

        status = row.get("sc_status", "")
        edge = row.get("x_edge_location", "")

        if not is_relay:
            n_radio_excl_relay += 1
            status_ctr[status] += 1
            edge_ctr[edge] += 1
            bytes_total += sc_bytes
            per_ip_total[ip] += 1
            if tt >= 5.0 and status == "200":
                n_qualifying += 1
                per_ip_qual[ip] += 1

            try:
                start = datetime.strptime(row["date"] + " " + row["time"], "%Y-%m-%d %H:%M:%S")
            except (KeyError, ValueError):
                continue
            if tt >= 5.0:  # korte mislukte pogingen tellen niet mee voor concurrency
                start_epoch = start.timestamp()
                end_epoch = start_epoch + tt
                events.append((start_epoch, 1))
                events.append((end_epoch, -1))

    unique_listeners = len(ip_total - ip_relay)

    # concurrency per minuut (sweep-line over de events), in CEST (UTC+2)
    concurrency = []
    peak_value, peak_label = 0, None
    if events:
        events.sort()
        running = 0
        i = 0
        first_min = datetime.utcfromtimestamp(events[0][0]).replace(second=0, microsecond=0)
        last_min = datetime.utcfromtimestamp(events[-1][0]).replace(second=0, microsecond=0)
        t = first_min
        while t <= last_min:
            t_next = t + timedelta(minutes=1)
            t_next_epoch = t_next.timestamp()
            while i < len(events) and events[i][0] < t_next_epoch:
                running += events[i][1]
                i += 1
            cest_label = (t + timedelta(hours=2)).strftime("%H:%M")
            concurrency.append([cest_label, running])
            if running > peak_value:
                peak_value, peak_label = running, (t + timedelta(hours=2)).strftime("%H:%Mu")
            t = t_next
        # kort de vlakke nullen aan begin/eind af zodat de grafiek leesbaar blijft
        first_nonzero = next((i for i, p in enumerate(concurrency) if p[1] > 0), 0)
        last_nonzero = len(concurrency) - next((i for i, p in enumerate(reversed(concurrency)) if p[1] > 0), 0)
        concurrency = concurrency[max(0, first_nonzero - 5):min(len(concurrency), last_nonzero + 5)]

    total_pct = n_radio_excl_relay or 1
    platform_pct = {k: round(100 * v / (n_radio or 1), 1) for k, v in platform_ctr.items()}

    # Geografie: top 5 benoemde landen + één "Overig"-restbucket (nooit dubbel).
    geo_ctr = Counter()
    for edge, cnt in edge_ctr.items():
        geo_ctr[EDGE_TO_COUNTRY.get(edge, "Overig")] += cnt
    named = [(k, v) for k, v in geo_ctr.most_common() if k != "Overig"]
    overig_total = geo_ctr.get("Overig", 0) + sum(v for _, v in named[5:])
    top_named = named[:5]
    geo_labels = [k for k, _ in top_named]
    geo_values = [round(100 * v / total_pct, 1) for _, v in top_named]
    if overig_total:
        geo_labels.append("Overig")
        geo_values.append(round(100 * overig_total / total_pct, 1))

    quality_codes = [k for k, _ in status_ctr.most_common()]
    quality_labels = [QUALITY_LABELS.get(k, f"{k} overig") for k in quality_codes]
    quality_values = [round(100 * v / total_pct, 1) for _, v in status_ctr.most_common()]
    quality_colors = [QUALITY_COLORS.get(k, "#9ca3af") for k in quality_codes]

    platform_labels = list(platform_pct.keys())
    platform_values = list(platform_pct.values())
    platform_colors = [PLATFORM_COLORS.get(k, "#9ca3af") for k in platform_labels]

    official = fetch_official_luisteraars(date_str)

    result = {
        "algemeen": {
            "luisteraars": official if official is not None else unique_listeners,
            "peakHour": peak_label or "-",
            "peakValue": peak_value,
            "successRate": round(100 * status_ctr.get("200", 0) / total_pct, 1) if status_ctr else 0.0,
            "bandwidth": f"{round(bytes_total / 1e9, 1)} GB",
            "concurrency": concurrency,
            "platform": {"labels": platform_labels, "values": platform_values, "colors": platform_colors},
            "geo": {"labels": geo_labels, "values": geo_values},
            "quality": {"labels": quality_labels, "values": quality_values, "colors": quality_colors},
        },
        "preroll": {
            "bereik": len(per_ip_qual),
            "bereikPct": round(100 * len(per_ip_qual) / (len(per_ip_total) or 1), 1),
            "impressies": n_qualifying,
            "freq": round(sum(per_ip_qual.values()) / (len(per_ip_qual) or 1), 2),
            "completion": round(100 * n_qualifying / (n_radio_excl_relay or 1), 1),
        },
        "_meta": {
            "datum": date_str,
            "verwerkt_op": datetime.utcnow().isoformat() + "Z",
            "relay_ips_gevonden": len(ip_relay),
        },
    }
    return result


def _flatten_for_dashboard(date_str, result):
    """Zet de {algemeen, preroll, _meta} structuur om naar de platte vorm die
    de React-dashboard (MatchDetailModal) verwacht."""
    algemeen = result["algemeen"]
    flat = {
        "date": date_str,
        "match_name": _lookup_match_name(date_str),
        "listeners": algemeen["luisteraars"],
        "peakHour": algemeen["peakHour"],
        "peakValue": algemeen["peakValue"],
        "successRate": algemeen["successRate"],
        "bandwidth": algemeen["bandwidth"],
        "concurrency": algemeen["concurrency"],
        "platform": algemeen["platform"],
        "geo": algemeen["geo"],
        "quality": algemeen["quality"],
        "preroll": result["preroll"],
    }
    return flat


def _lookup_match_name(date_str):
    """Probeert de wedstrijdnaam op te zoeken in de al bestaande
    all_matches.json van het dashboard, zodat de modal-titel klopt zonder dat
    dit script de Google Sheet zelf hoeft te raadplegen."""
    candidates = [
        os.path.join("dashboard", "public", "output", "all_matches.json"),
        os.path.join("output", "all_matches.json"),
    ]
    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            for m in payload.get("matches", []):
                if m.get("date") == date_str:
                    return m.get("match_name")
        except Exception:
            continue
    return None


def _update_index(output_dir):
    """Herschrijft match_details_index.json op basis van de bestanden die er
    daadwerkelijk staan, zodat de dashboard weet welke datums klikbaar zijn."""
    dates = sorted(
        f[:-5] for f in os.listdir(output_dir)
        if f.endswith(".json")
    )
    index_path = os.path.join(os.path.dirname(output_dir.rstrip("/")), "match_details_index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({"dates": dates}, f, ensure_ascii=False, indent=2)
    print(f"Index bijgewerkt: {index_path} ({len(dates)} datums)")


def _load_known_match_dates():
    """Datums van echte wedstrijden uit de al bestaande all_matches.json.
    Voorkomt dat we honderden gewone niet-wedstrijddagen gaan downloaden en
    verwerken nu de datadump-container helemaal terug tot 1 juni 2024 gaat."""
    dates = set()
    for path in (
        os.path.join("dashboard", "public", "output", "all_matches.json"),
        os.path.join("output", "all_matches.json"),
    ):
        try:
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            for m in payload.get("matches", []):
                if m.get("date"):
                    dates.add(m["date"])
            break
        except Exception:
            continue
    return dates


def cmd_list_new(args):
    dates = list_datadump_dates()
    known_matches = _load_known_match_dates()
    if known_matches:
        match_dates = [d for d in dates if d in known_matches]
        skipped = len(dates) - len(match_dates)
    else:
        # Geen all_matches.json gevonden: val terug op alles (oud gedrag).
        match_dates = dates
        skipped = 0
    existing = {f[:-5] for f in os.listdir(args.output_dir)} if os.path.isdir(args.output_dir) else set()
    new_dates = [d for d in match_dates if d not in existing]
    print(f"{len(dates)} bestanden in de container, {skipped} daarvan zijn geen bekende wedstrijddag (overgeslagen), "
          f"{len(new_dates)} wedstrijddagen nog niet verwerkt:")
    for d in new_dates:
        print(" -", d)
    # Houdt de index ook up-to-date als er (handmatig) bestanden bij- of
    # weggehaald zijn sinds de laatste keer dat 'process' draaide.
    if os.path.isdir(args.output_dir):
        _update_index(args.output_dir)
    return new_dates


def cmd_process(args):
    os.makedirs(args.output_dir, exist_ok=True)
    print(f"Verwerken van {args.date} ...")
    result = process_date(args.date)
    flat = _flatten_for_dashboard(args.date, result)
    out_path = os.path.join(args.output_dir, f"{args.date}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(flat, f, ensure_ascii=False, indent=None)
    print(f"Geschreven: {out_path}")
    print(f"  Unieke luisteraars: {result['algemeen']['luisteraars']}")
    print(f"  Piek gelijktijdig:  {result['algemeen']['peakValue']} om {result['algemeen']['peakHour']}")
    _update_index(args.output_dir)


def cmd_process_all(args):
    new_dates = cmd_list_new(args)
    for d in new_dates:
        try:
            cmd_process(argparse.Namespace(date=d, output_dir=args.output_dir))
        except Exception as e:
            print(f"FOUT bij {d}: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    DEFAULT_OUTPUT_DIR = os.path.join("dashboard", "public", "output", "match_details")

    p_list = sub.add_parser("list-new", help="Toon welke wedstrijddagen nog niet verwerkt zijn")
    p_list.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    p_list.set_defaults(func=cmd_list_new)

    p_proc = sub.add_parser("process", help="Verwerk één specifieke dag")
    p_proc.add_argument("--date", required=True, help="Datum in YYYY-MM-DD formaat")
    p_proc.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    p_proc.set_defaults(func=cmd_process)

    p_all = sub.add_parser("process-all", help="Verwerk alle nog niet verwerkte dagen")
    p_all.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    p_all.set_defaults(func=cmd_process_all)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
