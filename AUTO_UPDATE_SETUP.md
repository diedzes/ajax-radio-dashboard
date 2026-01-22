# Automatic Data Update Setup

There are several ways to automatically update your dashboard data. Choose the option that works best for you.

## Option 1: GitHub Actions (Recommended if using GitHub)

### Setup

1. **Push your code to GitHub** (if not already)
2. **Enable GitHub Actions** in your repository settings
3. **The workflow is already configured** in `.github/workflows/update-data.yml`

### How it works

- Runs automatically every day at 2 AM UTC
- Can also be triggered manually from GitHub Actions tab
- Updates data and commits changes back to the repository
- Vercel will automatically redeploy when changes are pushed

### Customize schedule

Edit `.github/workflows/update-data.yml` and change the cron schedule:
```yaml
- cron: '0 2 * * *'  # Every day at 2 AM UTC
```

Cron format: `minute hour day month day-of-week`
- `0 2 * * *` = 2 AM every day
- `0 */6 * * *` = Every 6 hours
- `0 9 * * 1` = Every Monday at 9 AM

## Option 2: Vercel Cron Jobs

### Setup

1. **Create a serverless function** (already created in `api/update-data.js`)
2. **Add cron configuration** to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/update-data",
      "schedule": "0 2 * * *"
    }
  ]
}
```

3. **Set environment variable** (optional, for security):
   - In Vercel Dashboard → Settings → Environment Variables
   - Add: `UPDATE_TOKEN=your-secret-token`

### Limitations

- Vercel serverless functions have execution time limits
- Python scripts might need to be adapted for serverless environment
- May need to use Vercel's Python runtime

## Option 3: External Cron Service

### Setup

1. Use a service like:
   - [cron-job.org](https://cron-job.org) (free)
   - [EasyCron](https://www.easycron.com)
   - [Cronitor](https://cronitor.io)

2. **Create a webhook endpoint** or use the update script

3. **Point the cron service** to:
   - Your Vercel deployment URL + `/api/update-data`
   - Or a webhook that triggers the update

## Option 4: Manual Script + System Cron

### Setup

1. **Make the script executable**:
   ```bash
   chmod +x api/update-data.sh
   ```

2. **Add to your system crontab**:
   ```bash
   crontab -e
   ```

3. **Add line** (runs daily at 2 AM):
   ```
   0 2 * * * /path/to/dashboard_project/api/update-data.sh
   ```

## Recommended: GitHub Actions

**Why GitHub Actions?**
- ✅ Free for public repositories
- ✅ Runs in the cloud (no need for your computer to be on)
- ✅ Automatically triggers Vercel redeploy
- ✅ Easy to monitor and debug
- ✅ Can trigger manually when needed

## Testing

To test the GitHub Actions workflow:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Update Dashboard Data** workflow
4. Click **Run workflow** → **Run workflow**

## Troubleshooting

### GitHub Actions not running
- Check repository settings → Actions → Allow all actions
- Verify the workflow file is in `.github/workflows/`

### Data not updating
- Check GitHub Actions logs for errors
- Verify Python dependencies are installed
- Check Google Sheets API access

### Vercel not redeploying
- Ensure Vercel is connected to your GitHub repository
- Check Vercel deployment settings for auto-deploy

## Security Notes

- Don't commit sensitive credentials to GitHub
- Use GitHub Secrets for API keys
- Consider adding authentication to webhook endpoints
