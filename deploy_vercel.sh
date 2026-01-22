#!/bin/bash
# Vercel Deployment Script for Ajax Radio Dashboard

echo "🚀 Preparing dashboard for Vercel deployment..."
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
echo "📤 Step 3: Deploying to Vercel..."
echo ""

# Deploy to Vercel using npx (no global install needed)
echo "Deploying to Vercel..."
echo "Note: You'll be prompted to login if this is your first time"
echo ""
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your dashboard is now live on Vercel!"
echo "   Check the URL shown above"
echo ""
