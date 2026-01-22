#!/bin/bash
# FTP Deployment Script for Ajax Radio Dashboard

echo "🚀 Preparing dashboard for FTP deployment..."
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

echo ""
echo "✅ Dashboard built successfully!"
echo ""
echo "📁 Files are ready in: dashboard/dist/"
echo ""
echo "📤 To upload via FTP:"
echo ""
echo "Option 1 - Using FileZilla or similar:"
echo "  1. Open your FTP client"
echo "  2. Connect to your FTP server"
echo "  3. Navigate to your web directory (public_html, www, etc.)"
echo "  4. Upload ALL contents from dashboard/dist/ folder"
echo "  5. Make sure the 'output' folder is included"
echo ""
echo "Option 2 - Using command line FTP:"
echo "  cd dashboard/dist"
echo "  ftp your-ftp-server.com"
echo "  (enter credentials)"
echo "  cd /path/to/web/directory"
echo "  binary"
echo "  mput *"
echo "  cd output"
echo "  mput *"
echo ""
echo "Option 3 - Using SFTP:"
echo "  cd dashboard/dist"
echo "  sftp username@your-ftp-server.com"
echo "  cd /path/to/web/directory"
echo "  put -r ."
echo ""
echo "⚠️  Important: Upload the entire contents of dashboard/dist/"
echo "   including the 'output' folder with all JSON files"
echo ""
