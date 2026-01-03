# 🔄 Force Vercel Redeployment Guide

## If Changes Aren't Showing on Your Live Site

### Option 1: Trigger Redeploy in Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/dashboard
2. Click on your project (RajCreation)
3. Click on the "Deployments" tab
4. Find the latest deployment
5. Click the ⋮ (three dots) menu
6. Click "Redeploy"
7. Wait 1-2 minutes

### Option 2: Make a Small Change and Push
```bash
# Add a space or comment to trigger deployment
echo "# Trigger deployment" >> README.md
git add .
git commit -m "Trigger redeployment"
git push
```

### Option 3: Check Vercel Build Logs
1. Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click on the latest deployment
4. Check "Building" logs for errors
5. Check "Runtime Logs" for issues

---

## Common Issues

### 1. Vercel Not Connected to GitHub
**Solution:**
- Vercel Dashboard → Project Settings → Git
- Verify repository is connected
- Reconnect if needed

### 2. Wrong Branch Deployed
**Solution:**
- Check which branch Vercel is deploying (Settings → Git)
- Should be: `main` or `master`
- Your branch: `master` ✅

### 3. Build Cache Issue
**Solution:**
- Redeploy without cache
- In Vercel: Redeploy → Check "Clear cache"

### 4. DNS/CDN Cache
**Solution:**
- Wait 5-10 minutes for CDN to update
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito mode
- Hard refresh (Ctrl+Shift+R)

---

## Verify Changes

### Check Files Locally:
```bash
# Verify index.html has "RajCreationz"
grep -n "RajCreationz" index.html

# Check config.js
grep -n "RajCreationz" js/config.js
```

### Check Live Site:
1. Visit: https://rajcreationz.com
2. Press Ctrl+U (View Source)
3. Search for "RajCreationz"
4. Should appear in title, headers, etc.

---

## Quick Fix Commands

```bash
# Force a new deployment
git commit --allow-empty -m "Force redeploy"
git push

# Or update a file
echo "Updated: $(date)" >> .vercel-timestamp
git add .
git commit -m "Force deployment update"
git push
```

---

## Timeline

- Git push: Immediate ✅
- Vercel detects push: 5-10 seconds
- Build starts: ~30 seconds
- Build completes: 1-2 minutes
- CDN updates: 2-5 minutes
- Changes visible: **Total: 3-7 minutes**

If still not showing after 10 minutes, there's an issue.

