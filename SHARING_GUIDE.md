# How to Share the Ajax Radio Dashboard with Colleagues

## Option 1: Build and Deploy to a Hosting Service (Recommended)

### Step 1: Build the Dashboard
```bash
cd dashboard
npm run build
```

This creates a `dist` folder with all the static files.

### Step 2: Deploy Options

#### A) Vercel (Easiest - Free)
1. Install Vercel CLI: `npm install -g vercel`
2. In the `dashboard` directory, run: `vercel`
3. Follow the prompts
4. Share the URL with your colleagues

#### B) Netlify (Free)
1. Install Netlify CLI: `npm install -g netlify-cli`
2. In the `dashboard` directory, run: `netlify deploy --prod`
3. Follow the prompts
4. Share the URL

#### C) GitHub Pages
1. Create a GitHub repository
2. Push your code
3. Enable GitHub Pages in repository settings
4. Set source to `dashboard/dist` folder
5. Share the GitHub Pages URL

## Option 2: Share via Local Network

### Step 1: Build the Dashboard
```bash
cd dashboard
npm run build
```

### Step 2: Serve with a Simple HTTP Server
```bash
cd dist
python3 -m http.server 8000
```

Or with Node.js:
```bash
npx serve -s dist -l 8000
```

### Step 3: Share Your Local IP
1. Find your local IP address:
   - Mac/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Share the URL: `http://YOUR_IP_ADDRESS:8000`
3. Make sure your colleagues are on the same network

## Option 3: Use Vite Preview (Development Mode)

### Step 1: Start the Preview Server
```bash
cd dashboard
npm run build
npm run preview
```

### Step 2: Share Your Local IP
1. Find your local IP address
2. Update `vite.config.js` to allow external access:
   ```js
   server: {
     port: 3000,
     host: '0.0.0.0'  // Allow external connections
   }
   ```
3. Share: `http://YOUR_IP_ADDRESS:3000`

## Option 4: Create a Standalone Package

### Step 1: Build Everything
```bash
# Generate all data files
python3 fetch_google_sheet.py
python3 merge_data.py
python3 analyze_matchdays.py

# Build the dashboard
cd dashboard
npm run build
```

### Step 2: Package Everything
Create a zip file with:
- `dashboard/dist/` folder (the built dashboard)
- Instructions for colleagues to run a local server

### Step 3: Share Instructions
Include a README with:
```bash
# Extract the zip file
# Navigate to the dist folder
cd dashboard/dist

# Start a simple server (choose one):
python3 -m http.server 8000
# OR
npx serve -s . -l 8000

# Open browser to http://localhost:8000
```

## Important Notes

1. **Data Updates**: If you update the Google Sheet, you'll need to:
   ```bash
   python3 fetch_google_sheet.py
   python3 merge_data.py
   python3 analyze_matchdays.py
   ```
   Then rebuild: `cd dashboard && npm run build`

2. **For Production**: The data files in `dashboard/public/output/` need to be included in the build

3. **Security**: If sharing publicly, consider if the data should be public

## Quick Start (Recommended for Internal Sharing)

1. **Build once:**
   ```bash
   cd /Users/diederikvanzessen/dashboard_project
   python3 fetch_google_sheet.py
   python3 merge_data.py
   python3 analyze_matchdays.py
   cd dashboard
   npm run build
   ```

2. **Serve locally:**
   ```bash
   cd dist
   python3 -m http.server 8000
   ```

3. **Share your IP:**
   - Find IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Share: `http://YOUR_IP:8000`
