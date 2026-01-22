#!/bin/bash
# Quick deployment script for the Ajax Radio Dashboard

echo "🚀 Deploying Ajax Radio Dashboard..."
echo ""

# Step 1: Update data
echo "📊 Step 1: Fetching and processing data..."
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

# Step 2: Build dashboard
echo ""
echo "🏗️  Step 2: Building dashboard..."
cd dashboard
npm run build

# Step 3: Get local IP
echo ""
echo "🌐 Step 3: Starting server..."
cd dist

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    IP="localhost"
fi

echo ""
echo "✅ Dashboard is ready!"
echo ""
echo "📍 Access the dashboard at:"
echo "   Local:  http://localhost:8000"
echo "   Network: http://$IP:8000"
echo ""
echo "💡 Share the network URL with your colleagues on the same network"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
python3 -m http.server 8000
