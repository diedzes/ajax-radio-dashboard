# Sharing Your Vercel Dashboard

## Default Behavior: Public Access

By default, **Vercel deployments are publicly accessible** - anyone with the URL can view your dashboard without logging in.

## Your Dashboard URLs

After deployment, you get URLs like:
- **Production**: `https://dashboard-faldvgjud-diederik-van-zessens-projects.vercel.app`
- **Aliased**: `https://dashboard-seven-tan-wd0470es1y.vercel.app`

**Just share either URL with your colleagues** - they can open it in any browser without any login!

## Making Sure It's Public

### Check Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Check **"Password Protection"** - make sure it's **OFF**
5. Check **"Team Access"** - make sure it's set to **Public** or your team

### If Password Protection is Enabled

If you see password protection enabled:

1. Go to **Settings** → **General**
2. Find **"Password Protection"**
3. Toggle it **OFF**
4. Save changes

### If Team Restrictions Exist

1. Go to **Settings** → **General**
2. Check **"Team Access"**
3. If restricted, change to **Public** or add your team members

## Custom Domain (Optional)

If you want a nicer URL:

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `dashboard.yourcompany.com`)
3. Follow DNS configuration instructions
4. Share the custom domain URL

## Sharing Best Practices

### Option 1: Direct URL Sharing
Just share the Vercel URL:
```
https://dashboard-seven-tan-wd0470es1y.vercel.app
```

### Option 2: Custom Domain
If you set up a custom domain:
```
https://ajax-radio-dashboard.yourcompany.com
```

### Option 3: Short Link
Use a URL shortener like:
- bit.ly
- tinyurl.com
- Or your company's short link service

## Troubleshooting

### "This site can't be reached"
- Check if the deployment is still active
- Verify the URL is correct
- Check Vercel dashboard for deployment status

### "Password Required"
- Password protection is enabled
- Go to Settings → General → Disable Password Protection

### "Access Denied"
- Team restrictions might be in place
- Check Settings → General → Team Access
- Make sure it's set to Public or your team

## Security Note

Since the dashboard is public:
- ✅ Anyone with the URL can view it
- ✅ No login required
- ✅ Works on any device/browser
- ⚠️ Make sure the data is okay to be public

If you need to restrict access, you can:
1. Enable password protection in Vercel settings
2. Use Vercel's team access controls
3. Set up authentication (more complex)

## Quick Check

To verify your dashboard is accessible:
1. Open the URL in an **incognito/private browser window**
2. If it loads without login → ✅ Public and shareable
3. If it asks for login → Check Vercel settings
