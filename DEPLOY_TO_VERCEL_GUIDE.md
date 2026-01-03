# 🚀 Deploy RajCreation to Vercel with Custom Domain

## Prerequisites
- ✅ Supabase database set up (done!)
- ✅ Your purchased domain name
- ✅ GitHub account (to connect with Vercel)

---

## Part 1: Deploy to Vercel

### Step 1: Create Vercel Account
1. Go to: https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 2: Push Your Code to GitHub
1. Create a new repository on GitHub
2. In your terminal, run:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rajcreation.git
git push -u origin main
```

### Step 3: Import Project to Vercel
1. Go to: https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository (RajCreation)
4. Configure:
   - **Framework Preset:** Other (it's a static site)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty
5. Click "Deploy"

### Step 4: Wait for Deployment
- Vercel will deploy your site
- You'll get a temporary URL like: `rajcreation.vercel.app`
- Test it to make sure everything works

---

## Part 2: Connect Your Custom Domain

### Step 1: Add Domain in Vercel
1. In Vercel Dashboard, go to your project
2. Click "Settings" tab
3. Click "Domains" in the left sidebar
4. Click "Add" button
5. Enter your domain (e.g., `rajcreations.com`)
6. Click "Add"

### Step 2: Configure DNS Records
Vercel will show you DNS records to add. You have 2 options:

#### Option A: Using A Record (Recommended)
Add these records in your domain registrar (e.g., GoDaddy, Namecheap):

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### Option B: Using CNAME
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 3: Wait for DNS Propagation
- DNS changes can take 24-48 hours
- Usually works within 1-2 hours
- You can check status at: https://dnschecker.org

---

## Part 3: Environment Variables (Important!)

Your Supabase credentials should be environment variables in production.

### Step 1: Create Production Config
1. In Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
Name: SUPABASE_URL
Value: https://ahxqgrdiyfnsmjrkibdg.supabase.co

Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Update Your Code (Optional but Recommended)
Create `config.production.js`:

```javascript
(function() {
    'use strict';
    
    window.RAJ_CREATION_CONFIG = {
        supabase: {
            url: process.env.SUPABASE_URL || 'https://ahxqgrdiyfnsmjrkibdg.supabase.co',
            anonKey: process.env.SUPABASE_ANON_KEY || 'your-key-here'
        },
        site: {
            title: 'RajCreation Live',
            description: 'Watch live telecast streaming'
        },
        admin: {
            username: 'admin',
            password: 'admin123' // CHANGE THIS!
        }
    };
})();
```

---

## Part 4: SSL Certificate (Automatic)

Vercel automatically provides SSL certificate:
- ✅ HTTPS enabled automatically
- ✅ Free SSL from Let's Encrypt
- ✅ Auto-renewal
- Your site will be: `https://yourdomain.com`

---

## Part 5: Configure Supabase for Your Domain

### Step 1: Add Domain to Supabase Allowed Origins
1. Go to Supabase Dashboard
2. Click Settings → API
3. Scroll to "CORS"
4. Add your domain:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
5. Click "Save"

---

## Common Domain Registrars Instructions

### GoDaddy
1. Log in to GoDaddy
2. Go to "My Products"
3. Click "DNS" next to your domain
4. Click "Add" to add new records
5. Add the A and CNAME records from above

### Namecheap
1. Log in to Namecheap
2. Go to "Domain List"
3. Click "Manage" next to your domain
4. Go to "Advanced DNS" tab
5. Add the records

### Google Domains
1. Log in to Google Domains
2. Click on your domain
3. Go to "DNS" in the left sidebar
4. Click "Manage Custom Records"
5. Add the records

### Cloudflare
1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" tab
4. Click "Add record"
5. Add the records

---

## Verification Steps

### 1. Check DNS Configuration
```bash
# Check A record
nslookup yourdomain.com

# Check CNAME record
nslookup www.yourdomain.com
```

### 2. Check SSL Certificate
- Go to: `https://www.ssllabs.com/ssltest/`
- Enter your domain
- Should get A or A+ rating

### 3. Test Your Site
- Open: `https://yourdomain.com`
- Test thumbnail upload
- Test embed code save
- Test on mobile devices

---

## Troubleshooting

### Domain Not Working?
- Wait 1-2 hours for DNS propagation
- Check DNS records are correct
- Clear browser cache (Ctrl+Shift+Delete)

### SSL Not Working?
- Vercel handles this automatically
- Wait a few minutes after domain verification
- Check Vercel dashboard for status

### Supabase Not Working?
- Add your domain to Supabase CORS settings
- Check browser console for errors
- Verify Supabase credentials

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Test deployment on vercel.app domain
- [ ] Custom domain added in Vercel
- [ ] DNS records configured
- [ ] DNS propagated (wait 1-2 hours)
- [ ] SSL certificate active (automatic)
- [ ] Domain added to Supabase CORS
- [ ] Test thumbnail upload on production
- [ ] Test embed code on production
- [ ] Test on mobile devices

---

## What You'll Get

After completing these steps:
- ✅ Your site on your custom domain
- ✅ HTTPS (SSL) enabled
- ✅ Fast global CDN (Vercel's edge network)
- ✅ Automatic deployments on git push
- ✅ Free hosting with Vercel
- ✅ Professional production setup

---

## Need Help?

If you get stuck:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify DNS records at dnschecker.org
4. Check Supabase CORS settings

**Let me know which domain registrar you're using and I can provide specific instructions!**

