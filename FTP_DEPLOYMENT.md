# FTP Deployment Guide

## Step 1: Build the Dashboard

First, build the dashboard for production:

```bash
cd /Users/diederikvanzessen/dashboard_project

# Update data
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

# Build dashboard
cd dashboard
npm run build
```

This creates a `dashboard/dist` folder with all the files needed.

## Step 2: Upload to FTP Server

### Option A: Using FTP Client (GUI - Easiest)

1. **Use an FTP client** like:
   - FileZilla (free, cross-platform)
   - Cyberduck (free, Mac/Windows)
   - WinSCP (Windows)
   - Transmit (Mac, paid)

2. **Connect to your FTP server:**
   - Host: Your FTP server address
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: Usually 21 (or 22 for SFTP)

3. **Upload files:**
   - Navigate to your web directory (usually `public_html`, `www`, or `htdocs`)
   - Upload ALL contents from `dashboard/dist/` folder
   - Make sure to preserve the folder structure, especially `output/` folder

### Option B: Using Command Line (FTP)

```bash
cd dashboard/dist

# Connect to FTP
ftp your-ftp-server.com

# Enter credentials when prompted
# Then upload files:
cd /path/to/your/web/directory
binary
mput *
```

### Option C: Using SFTP (Secure)

```bash
cd dashboard/dist

# Upload entire directory
sftp username@your-ftp-server.com
cd /path/to/your/web/directory
put -r .
```

### Option D: Using rsync (if SSH access available)

```bash
cd dashboard/dist
rsync -avz --delete . username@your-server.com:/path/to/web/directory/
```

## Step 3: Verify Upload

After uploading, check:
1. All files in `dist/` are uploaded
2. The `output/` folder with JSON files is included
3. Access the dashboard via your web URL

## Important Notes

1. **Upload the entire `dist` folder contents**, including:
   - `index.html`
   - All JavaScript/CSS files
   - The `output/` folder with JSON data files

2. **Folder structure should be:**
   ```
   your-web-root/
   ├── index.html
   ├── assets/
   └── output/
       ├── all_matches.json
       ├── top5_games.json
       ├── by_result.json
       ├── by_home_away.json
       └── ... (other JSON files)
   ```

3. **If your web root is different**, you may need to:
   - Upload `dist/` contents to a subdirectory (e.g., `dashboard/`)
   - Update the paths in the code (not recommended)

## Automated FTP Upload Script

See `deploy_ftp.sh` for an automated script.
