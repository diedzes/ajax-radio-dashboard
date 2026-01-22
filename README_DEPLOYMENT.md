# Quick Deployment Guide

## Easiest Way to Share (Local Network)

Run this single command:
```bash
./deploy.sh
```

This will:
1. Fetch latest data from Google Sheets
2. Process and analyze the data
3. Build the dashboard
4. Start a local server
5. Show you the URL to share with colleagues

## Manual Steps

### 1. Update Data
```bash
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py
```

### 2. Build Dashboard
```bash
cd dashboard
npm run build
```

### 3. Serve Locally
```bash
cd dashboard/dist
python3 -m http.server 8000
```

### 4. Share URL
- Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Share: `http://YOUR_IP:8000`

## For Production/Public Hosting

### Option A: Vercel (Recommended - Free)
```bash
cd dashboard
npm install -g vercel
vercel
```

### Option B: Netlify (Free)
```bash
cd dashboard
npm install -g netlify-cli
netlify deploy --prod
```

### Option C: GitHub Pages
1. Push code to GitHub
2. Enable GitHub Pages
3. Set source to `dashboard/dist`

## Updating Data

When you update the Google Sheet, run:
```bash
./deploy.sh
```

Or manually:
```bash
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py
cd dashboard && npm run build
```
