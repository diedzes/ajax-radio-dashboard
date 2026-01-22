# Vercel Deployment Guide

## Quick Deploy (Recommended)

Run the automated script:
```bash
./deploy_vercel.sh
```

This will:
1. Update all data from Google Sheets
2. Build the dashboard
3. Deploy to Vercel

## Manual Deployment

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Update Data and Build
```bash
# Update data
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

# Build dashboard
cd dashboard
npm run build
```

### Step 3: Deploy to Vercel
```bash
cd dashboard
vercel
```

For production deployment:
```bash
vercel --prod
```

## First Time Setup

When you run `vercel` for the first time:

1. **Login**: You'll be prompted to login/create account
   - You can login via browser or use `vercel login`

2. **Link Project**: 
   - Choose "Link to existing project" or "Create new project"
   - Enter project name (e.g., "ajax-radio-dashboard")

3. **Configure**:
   - Framework: Vite (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy**: Vercel will deploy and give you a URL

## Configuration

The `vercel.json` file is already configured with:
- Build settings for Vite
- Rewrite rules for React Router (if needed)
- Output directory: `dist`

## Updating the Dashboard

When you update the Google Sheet:

1. **Option A - Use the script:**
   ```bash
   ./deploy_vercel.sh
   ```

2. **Option B - Manual:**
   ```bash
   python3 fetch_google_sheet.py
   python3 merge_data.py
   python3 analyze_matchdays.py
   cd dashboard
   npm run build
   vercel --prod
   ```

## Vercel Dashboard

After deployment, you can:
- View deployments at: https://vercel.com/dashboard
- Set up automatic deployments from Git (optional)
- Configure environment variables
- View analytics

## Environment Variables (if needed)

If you need to add environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables as needed
3. Redeploy

## Custom Domain

To use your own domain:
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

## Important Notes

- **Data Files**: The `output/` folder with JSON files is included in the build
- **Public Folder**: Files in `dashboard/public/` are automatically included
- **Build Output**: The `dist/` folder contains everything needed
- **Automatic Deployments**: You can connect GitHub for automatic deployments on push

## Troubleshooting

### Build Fails
- Make sure all dependencies are installed: `cd dashboard && npm install`
- Check that data files exist in `dashboard/public/output/`

### 404 Errors
- The `vercel.json` rewrite rules should handle this
- Make sure all routes are client-side routes

### Data Not Updating
- Run the data update scripts before deploying
- Check that `dashboard/public/output/` has the latest JSON files
