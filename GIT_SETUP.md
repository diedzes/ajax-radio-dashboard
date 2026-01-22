# Git Repository Setup Guide

## Step 1: Initialize Git (Already Done)
```bash
cd /Users/diederikvanzessen/dashboard_project
git init
```

## Step 2: Add All Files
```bash
git add .
```

## Step 3: Make First Commit
```bash
git commit -m "Initial commit: Ajax Radio Dashboard"
```

## Step 4: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it: `ajax-radio-dashboard` (or any name you prefer)
4. Choose **Public** or **Private**
5. **Don't** initialize with README, .gitignore, or license (we already have files)
6. Click **Create repository**

## Step 5: Connect and Push

GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ajax-radio-dashboard.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 6: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Workflow permissions", select **Read and write permissions**
4. Click **Save**

## That's It!

Your GitHub Actions workflow will now:
- Run automatically every day at 2 AM UTC
- Update dashboard data
- Commit changes
- Trigger Vercel to redeploy

## Useful Git Commands

```bash
# Check status
git status

# See what changed
git diff

# Add specific files
git add filename.js

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## Troubleshooting

**"Permission denied"**
- Use HTTPS URL instead of SSH
- Or set up SSH keys in GitHub Settings → SSH and GPG keys

**"Repository not found"**
- Check the repository name matches
- Verify you have access to the repository

**"Nothing to commit"**
- All files are already committed
- Make a change first, then commit
