# Quick Vercel Deployment

## Step 1: Run the Deployment Script

```bash
cd /Users/diederikvanzessen/dashboard_project
./deploy_vercel.sh
```

This will:
1. ✅ Fetch latest data from Google Sheets
2. ✅ Process and analyze the data
3. ✅ Build the dashboard
4. ✅ Deploy to Vercel

## Step 2: First Time Setup

If this is your first time deploying:

1. **You'll be prompted to login:**
   - Choose "Login" 
   - It will open your browser to login with Vercel
   - Or use: `npx vercel login`

2. **Link/Create Project:**
   - Choose "Create new project" or "Link to existing project"
   - Enter project name (e.g., "ajax-radio-dashboard")

3. **Configuration (auto-detected):**
   - Framework: Vite ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `dist` ✅
   - Install Command: `npm install` ✅

4. **Deploy:**
   - Vercel will deploy and give you a URL like:
   - `https://ajax-radio-dashboard.vercel.app`

## Step 3: Share the URL

Once deployed, you'll get a URL like:
- `https://your-project-name.vercel.app`

Share this URL with your colleagues!

## Future Updates

When you update the Google Sheet, just run:
```bash
./deploy_vercel.sh
```

## Manual Deployment (Alternative)

If you prefer to do it manually:

```bash
# 1. Update data
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

# 2. Build
cd dashboard
npm run build

# 3. Deploy
npx vercel --prod
```

## Troubleshooting

**"vercel: command not found"**
- Use `npx vercel` instead (no installation needed)

**Build fails**
- Make sure you're in the `dashboard` directory
- Run `npm install` first if needed

**Data not showing**
- Make sure `dashboard/public/output/` has all JSON files
- Check that the files were generated in the last step
