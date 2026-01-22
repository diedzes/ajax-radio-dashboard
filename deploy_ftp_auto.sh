#!/bin/bash
# Automated FTP Upload Script
# Configure your FTP details in .ftpconfig file

# Load FTP config if it exists
if [ -f .ftpconfig ]; then
    source .ftpconfig
else
    echo "❌ Error: .ftpconfig file not found!"
    echo ""
    echo "Please create .ftpconfig file with your FTP details:"
    echo "  FTP_HOST=your-ftp-server.com"
    echo "  FTP_USER=your-username"
    echo "  FTP_PASS=your-password"
    echo "  FTP_DIR=/public_html"
    echo ""
    echo "Or copy .ftpconfig.example to .ftpconfig and edit it"
    exit 1
fi

# Validate config
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
    echo "❌ Error: FTP configuration incomplete!"
    echo "Please check your .ftpconfig file"
    exit 1
fi

FTP_DIR=${FTP_DIR:-/public_html}
FTP_PORT=${FTP_PORT:-21}

echo "🚀 Automated FTP Deployment for Ajax Radio Dashboard"
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

# Step 3: Upload via FTP
echo ""
echo "📤 Step 3: Uploading to FTP server..."

cd dist

# Create FTP command file
cat > /tmp/ftp_commands.txt << EOF
binary
cd $FTP_DIR
lcd $(pwd)
mput *
cd output
lcd output
mput *
quit
EOF

# Upload using FTP
echo "Connecting to $FTP_HOST..."
ftp -n $FTP_HOST << EOF
user $FTP_USER $FTP_PASS
$(cat /tmp/ftp_commands.txt)
EOF

# Cleanup
rm /tmp/ftp_commands.txt

echo ""
echo "✅ Upload complete!"
echo ""
echo "🌐 Your dashboard should be available at:"
echo "   http://$FTP_HOST"
echo "   (or your domain name if configured)"
echo ""
