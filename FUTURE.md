# GitHub Deployment Guide - RajCreation Live

Step-by-step guide to deploy the website to GitHub Pages.

---

## Space 1: Repository Setup

- [ ] Create a GitHub account (if you don't have one)
- [ ] Create a new repository on GitHub
  - Repository name: `RajCreation` (or your preferred name)
  - Set visibility: Public (required for free GitHub Pages)
  - Initialize with README: No (we already have files)
- [ ] Note the repository URL (e.g., `https://github.com/yourusername/RajCreation.git`)

---

## Space 2: Local Git Setup

- [ ] Install Git on your computer (if not already installed)
  - Download from: https://git-scm.com/downloads
- [ ] Open terminal/command prompt in project folder
- [ ] Initialize Git repository:
  ```bash
  git init
  ```
- [ ] Create `.gitignore` file (if not exists):
  ```
  # OS files
  .DS_Store
  Thumbs.db
  
  # Editor files
  .vscode/
  .idea/
  *.swp
  *.swo
  ```
- [ ] Stage all files:
  ```bash
  git add .
  ```
- [ ] Make first commit:
  ```bash
  git commit -m "Initial commit: RajCreation Live website"
  ```

---

## Space 3: Connect to GitHub

- [ ] Add remote repository:
  ```bash
  git remote add origin https://github.com/yourusername/RajCreation.git
  ```
  (Replace `yourusername` with your GitHub username)
- [ ] Rename branch to `main` (if needed):
  ```bash
  git branch -M main
  ```
- [ ] Push code to GitHub:
  ```bash
  git push -u origin main
  ```
- [ ] Verify files are uploaded on GitHub website

---

## Space 4: Enable GitHub Pages

- [ ] Go to repository on GitHub website
- [ ] Click on "Settings" tab
- [ ] Scroll down to "Pages" section (left sidebar)
- [ ] Under "Source":
  - Select branch: `main`
  - Select folder: `/ (root)`
- [ ] Click "Save"
- [ ] Wait 1-2 minutes for GitHub Pages to build
- [ ] Your site will be available at:
  - `https://yourusername.github.io/RajCreation/`

---

## Space 5: Custom Domain (Optional)

- [ ] Purchase a domain name (if desired)
- [ ] In repository Settings → Pages:
  - Enter custom domain in "Custom domain" field
  - Click "Save"
- [ ] Add `CNAME` file in repository root:
  ```
  yourdomain.com
  ```
- [ ] Configure DNS with your domain provider:
  - Add A record: `185.199.108.153`
  - Add A record: `185.199.109.153`
  - Add A record: `185.199.110.153`
  - Add A record: `185.199.111.153`
  - Or add CNAME record: `yourusername.github.io`
- [ ] Wait for DNS propagation (may take up to 48 hours)
- [ ] Verify domain works

---

## Future Updates

After initial deployment, to update your website:

1. Make changes to your files locally
2. Stage changes:
   ```bash
   git add .
   ```
3. Commit changes:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push to GitHub:
   ```bash
   git push
   ```
5. Changes will be live on GitHub Pages within 1-2 minutes

---

**Last Updated**: 2024
