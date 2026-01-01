# Complete Guide: Deploy RajCreation Live to GitHub Pages with Custom Domain

This guide will walk you through deploying your website to GitHub Pages and connecting your custom domain name.

---

## 📋 Prerequisites

- A GitHub account (free)
- A custom domain name you've purchased
- Your website files ready in the `RajCreation` folder

---

## Part 1: Create GitHub Account & Repository

### Step 1.1: Create GitHub Account

1. Go to **https://github.com**
2. Click **"Sign up"** (top right)
3. Enter your:
   - Username (e.g., `rajcreation` or `yourname`)
   - Email address
   - Password
4. Verify your email address (check your inbox)
5. Complete the setup questions (optional)

✅ **You now have a GitHub account!**

---

### Step 1.2: Create New Repository

1. After logging in, click the **"+"** icon (top right)
2. Select **"New repository"**

3. Fill in the details:
   - **Repository name:** `rajcreation-live` (or any name you prefer)
   - **Description:** `RajCreation Live Streaming Website` (optional)
   - **Visibility:** Select **"Public"** (required for free GitHub Pages)
   - **DO NOT** check "Add a README file" (we'll upload your files)
   - **DO NOT** add .gitignore or license

4. Click **"Create repository"**

✅ **Your repository is created!**

---

## Part 2: Upload Your Website Files

You have **3 options** to upload your files. Choose the easiest for you:

---

### Option A: Using GitHub Desktop (EASIEST - Recommended)

#### Step 2A.1: Download GitHub Desktop

1. Go to **https://desktop.github.com**
2. Click **"Download for Windows"**
3. Install the application
4. Sign in with your GitHub account

#### Step 2A.2: Clone Your Repository

1. Open **GitHub Desktop**
2. Click **"File"** → **"Clone repository"**
3. Select your repository: `rajcreation-live`
4. Choose a location (e.g., `C:\Users\Saji\Desktop\`)
5. Click **"Clone"**

#### Step 2A.3: Copy Your Files

1. Open File Explorer
2. Go to: `C:\Users\Saji\Desktop\RajCreation`
3. **Select ALL files and folders** (Ctrl + A)
4. **Copy** them (Ctrl + C)
5. Go to: `C:\Users\Saji\Desktop\rajcreation-live` (your cloned repository)
6. **Paste** all files (Ctrl + V)

#### Step 2A.4: Commit and Push

1. Go back to **GitHub Desktop**
2. You'll see all your files listed under "Changes"
3. At the bottom, type a commit message: `Initial commit - RajCreation Live website`
4. Click **"Commit to main"**
5. Click **"Push origin"** (top right)
6. Wait for upload to complete

✅ **Your files are now on GitHub!**

---

### Option B: Using GitHub Website (Drag & Drop)

#### Step 2B.1: Upload Files

1. Go to your repository on GitHub: `https://github.com/YOUR-USERNAME/rajcreation-live`
2. Click **"uploading an existing file"** (if shown) OR
3. Click **"Add file"** → **"Upload files"**

4. **Drag and drop** your entire `RajCreation` folder contents:
   - Select all files in `C:\Users\Saji\Desktop\RajCreation`
   - Drag them into the browser window

5. Scroll down and type commit message: `Initial commit - RajCreation Live website`
6. Click **"Commit changes"**

✅ **Your files are uploaded!**

---

### Option C: Using Git Command Line

#### Step 2C.1: Install Git

1. Download Git from: **https://git-scm.com/download/win**
2. Install with default settings
3. Open **Git Bash** (search in Start menu)

#### Step 2C.2: Initialize and Push

```bash
# Navigate to your project folder
cd /c/Users/Saji/Desktop/RajCreation

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - RajCreation Live website"

# Rename branch to main
git branch -M main

# Add your GitHub repository (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/rajcreation-live.git

# Push to GitHub
git push -u origin main
```

**Note:** You'll be asked for your GitHub username and password (use a Personal Access Token instead of password - see GitHub settings)

✅ **Your files are pushed to GitHub!**

---

## Part 3: Enable GitHub Pages

### Step 3.1: Go to Repository Settings

1. In your repository, click **"Settings"** (top menu bar)
2. Scroll down to **"Pages"** (left sidebar)

### Step 3.2: Configure GitHub Pages

1. Under **"Source"**, select:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
2. Click **"Save"**

### Step 3.3: Wait for Deployment

1. GitHub will show: **"Your site is ready to be published at..."**
2. Wait 1-2 minutes for deployment
3. Refresh the page
4. You'll see your site URL: `https://YOUR-USERNAME.github.io/rajcreation-live/`

✅ **Your website is now live on GitHub Pages!**

**Test it:** Open the URL in your browser to see your website!

---

## Part 4: Connect Your Custom Domain

### Step 4.1: Add Domain to GitHub Pages

1. In your repository, go to **"Settings"** → **"Pages"**
2. Under **"Custom domain"**, enter your domain:
   - Example: `rajcreation.com` or `www.rajcreation.com`
3. Click **"Save"**

4. GitHub will create a file called `CNAME` in your repository
   - This is normal and required!

✅ **Domain added to GitHub!**

---

### Step 4.2: Configure DNS Records

Now you need to point your domain to GitHub Pages. The steps depend on where you bought your domain:

---

#### If You Bought Domain from Namecheap:

1. **Login to Namecheap:**
   - Go to **https://www.namecheap.com**
   - Click **"Sign In"** (top right)
   - Login with your account

2. **Go to Domain List:**
   - Click **"Domain List"** (left sidebar)
   - Find your domain (e.g., `rajcreation.com`)
   - Click **"Manage"** (next to your domain)

3. **Go to Advanced DNS:**
   - Click **"Advanced DNS"** tab
   - Scroll down to **"Host Records"** section

4. **Add A Records:**
   - Click **"Add New Record"**
   - Add these **4 A records** (one at a time):
   
   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | A Record | @ | 185.199.108.153 | Automatic |
   | A Record | @ | 185.199.109.153 | Automatic |
   | A Record | @ | 185.199.110.153 | Automatic |
   | A Record | @ | 185.199.111.153 | Automatic |
   
   - Click the green checkmark after each one

5. **Add CNAME Record:**
   - Click **"Add New Record"** again
   - Type: **CNAME Record**
   - Host: **www**
   - Value: **YOUR-USERNAME.github.io** (replace with your GitHub username)
   - TTL: **Automatic**
   - Click the green checkmark

6. **Save Changes:**
   - Click **"Save All Changes"** (top right)
   - Wait 5-10 minutes for DNS to propagate

✅ **DNS configured!**

---

#### If You Bought Domain from GoDaddy:

1. **Login to GoDaddy:**
   - Go to **https://www.godaddy.com**
   - Click **"Sign In"**
   - Login with your account

2. **Go to My Products:**
   - Click **"My Products"**
   - Find your domain
   - Click **"DNS"** (next to your domain)

3. **Add A Records:**
   - Scroll to **"Records"** section
   - Delete existing A records (if any)
   - Click **"Add"**
   - Add these **4 A records**:
   
   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 185.199.108.153 | 600 |
   | A | @ | 185.199.109.153 | 600 |
   | A | @ | 185.199.110.153 | 600 |
   | A | @ | 185.199.111.153 | 600 |
   
   - Click **"Save"** after each

4. **Add CNAME Record:**
   - Click **"Add"**
   - Type: **CNAME**
   - Name: **www**
   - Value: **YOUR-USERNAME.github.io**
   - TTL: **600**
   - Click **"Save"**

✅ **DNS configured!**

---

#### If You Bought Domain from Google Domains:

1. **Login to Google Domains:**
   - Go to **https://domains.google**
   - Sign in with your Google account

2. **Select Your Domain:**
   - Click on your domain name

3. **Go to DNS:**
   - Click **"DNS"** (left sidebar)

4. **Add A Records:**
   - Scroll to **"Custom resource records"**
   - Add these **4 A records**:
   
   | Name | Type | TTL | Data |
   |------|------|-----|------|
   | @ | A | 3600 | 185.199.108.153 |
   | @ | A | 3600 | 185.199.109.153 |
   | @ | A | 3600 | 185.199.110.153 |
   | @ | A | 3600 | 185.199.111.153 |
   
   - Click **"Add"** after each

5. **Add CNAME Record:**
   - Name: **www**
   - Type: **CNAME**
   - TTL: **3600**
   - Data: **YOUR-USERNAME.github.io**
   - Click **"Add"**

✅ **DNS configured!**

---

#### If You Bought Domain from Cloudflare:

1. **Login to Cloudflare:**
   - Go to **https://dash.cloudflare.com**
   - Sign in with your account

2. **Select Your Domain:**
   - Click on your domain

3. **Go to DNS:**
   - Click **"DNS"** (left sidebar)

4. **Add A Records:**
   - Click **"Add record"**
   - Add these **4 A records**:
   
   | Type | Name | IPv4 address | Proxy status |
   |------|------|--------------|-------------|
   | A | @ | 185.199.108.153 | DNS only |
   | A | @ | 185.199.109.153 | DNS only |
   | A | @ | 185.199.110.153 | DNS only |
   | A | @ | 185.199.111.153 | DNS only |
   
   - Click **"Save"** after each

5. **Add CNAME Record:**
   - Type: **CNAME**
   - Name: **www**
   - Target: **YOUR-USERNAME.github.io**
   - Proxy status: **DNS only**
   - Click **"Save"**

✅ **DNS configured!**

---

#### If You Bought Domain from Another Provider:

**General Steps:**
1. Login to your domain provider's dashboard
2. Find **"DNS Settings"** or **"DNS Management"**
3. Add these **4 A records** for root domain (@):
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Add **1 CNAME record** for www:
   - Name: `www`
   - Value: `YOUR-USERNAME.github.io`

---

### Step 4.3: Enable HTTPS (SSL Certificate)

1. **Wait for DNS Propagation:**
   - DNS changes take 5 minutes to 48 hours
   - Usually works within 1-2 hours

2. **Check DNS Status:**
   - Go to: **https://dnschecker.org**
   - Enter your domain
   - Check if A records show GitHub IPs

3. **GitHub Will Auto-Enable HTTPS:**
   - Once DNS propagates, GitHub automatically enables SSL
   - Go to **Settings** → **Pages**
   - Check **"Enforce HTTPS"** (if available)
   - This may take up to 24 hours

✅ **HTTPS will be enabled automatically!**

---

### Step 4.4: Verify Your Domain Works

1. **Wait 1-2 hours** after DNS changes
2. **Test your domain:**
   - Open: `https://yourdomain.com`
   - Open: `https://www.yourdomain.com`
   - Both should show your website!

3. **If it doesn't work:**
   - Check DNS propagation: https://dnschecker.org
   - Verify DNS records are correct
   - Wait longer (can take up to 48 hours)

✅ **Your custom domain is connected!**

---

## Part 5: Update Your Website (Making Changes)

### Step 5.1: Make Changes Locally

1. Edit your files in `C:\Users\Saji\Desktop\RajCreation`
2. Save your changes

### Step 5.2: Upload Changes to GitHub

**If using GitHub Desktop:**
1. Open GitHub Desktop
2. You'll see your changes listed
3. Type commit message: `Updated website`
4. Click **"Commit to main"**
5. Click **"Push origin"**

**If using GitHub Website:**
1. Go to your repository
2. Click **"Add file"** → **"Upload files"**
3. Upload changed files
4. Click **"Commit changes"**

### Step 5.3: Wait for Deployment

1. GitHub Pages automatically rebuilds your site
2. Wait 1-2 minutes
3. Refresh your website to see changes

✅ **Changes are live!**

---

## Part 6: Important Notes

### ⚠️ Important Files to Keep:

- **`CNAME` file** - Created by GitHub, DON'T DELETE!
- **All your HTML, CSS, JS files** - Keep them all
- **`admin/` folder** - Your admin panel works fine

### 🔒 Security Note:

Your admin password is in JavaScript code. For production:
- Consider using a stronger password
- Or implement server-side authentication (requires paid hosting)

### 📝 GitHub Pages Limitations:

- ✅ Perfect for static websites (like yours)
- ✅ Free SSL certificate
- ✅ Custom domain support
- ❌ No server-side code (PHP, Python, etc.)
- ❌ No database (but you use localStorage, so it's fine!)

### 🚀 Performance Tips:

1. **Optimize images** before uploading
2. **Minify CSS/JS** (optional, for faster loading)
3. **Use CDN** for large files (GitHub Pages already uses CDN)

---

## Troubleshooting

### Problem: Website shows 404 error

**Solution:**
- Make sure you enabled GitHub Pages in Settings
- Check that your `index.html` is in the root folder
- Wait 5-10 minutes for deployment

---

### Problem: Domain not working

**Solution:**
- Verify DNS records are correct
- Check DNS propagation: https://dnschecker.org
- Wait up to 48 hours for full propagation
- Make sure CNAME file exists in your repository

---

### Problem: HTTPS not enabled

**Solution:**
- Wait up to 24 hours after DNS propagation
- Go to Settings → Pages → Check "Enforce HTTPS"
- Clear browser cache and try again

---

### Problem: Changes not showing

**Solution:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Wait 2-3 minutes for GitHub to rebuild

---

## ✅ Final Checklist

Before you're done, verify:

- [ ] GitHub account created
- [ ] Repository created and files uploaded
- [ ] GitHub Pages enabled
- [ ] Website accessible at `username.github.io/repo-name`
- [ ] Custom domain added in GitHub Pages settings
- [ ] DNS records configured (A records + CNAME)
- [ ] DNS propagated (check with dnschecker.org)
- [ ] Website accessible at your custom domain
- [ ] HTTPS enabled (check for padlock icon)

---

## 🎉 Congratulations!

Your website is now:
- ✅ Live on GitHub Pages
- ✅ Accessible via custom domain
- ✅ Secured with HTTPS
- ✅ Ready for the world!

**Your website URL:** `https://yourdomain.com`

**Admin Panel:** `https://yourdomain.com/admin/index.html`

---

## 📞 Need Help?

If you encounter any issues:
1. Check GitHub Pages documentation: https://docs.github.com/en/pages
2. Check your domain provider's DNS documentation
3. Verify DNS records are correct
4. Wait for DNS propagation (can take time!)

---

**Good luck with your deployment! 🚀**

