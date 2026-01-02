# Complete Supabase Setup Guide for RajCreation Live

This guide will help you set up everything in Supabase automatically.

## Quick Setup (Recommended)

### Step 1: Run the Complete SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste the **entire contents** of `supabase-complete-setup.sql`
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for "Success" message

✅ This creates:
- All database tables (videos, photos, thumbnails, settings)
- All Row Level Security policies
- All storage policies (will activate when bucket is created)
- Triggers and helper functions

### Step 2: Create Storage Bucket

You have two options:

#### Option A: Via Dashboard (Easiest - 30 seconds)

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Click **"+ New bucket"** button
3. **Name:** `images`
4. **Toggle "Public bucket" to ON** (very important!)
5. Click **"Create bucket"**

✅ Done! The storage policies from Step 1 will now work automatically.

#### Option B: Via Script (Automated)

1. Open `setup-bucket.js`
2. Update these values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_SERVICE_KEY = 'your-service-role-key';
   ```
3. Get your service_role key from: **Settings → API → service_role key**
4. Install Node.js if needed
5. Run: `npm install @supabase/supabase-js`
6. Run: `node setup-bucket.js`

✅ Done! The script will create the bucket automatically.

### Step 3: Verify Setup

1. **Check Database Tables:**
   - Go to **Table Editor** → You should see: `videos`, `photos`, `thumbnails`, `settings`

2. **Check Storage:**
   - Go to **Storage** → You should see: `images` bucket (PUBLIC)

3. **Test Your Website:**
   - Go to your admin panel: `admin/video.html`
   - Add a video with a thumbnail
   - Check if it appears on `video.html`

## What Gets Created

### Database Tables

1. **`videos`** - Stores video metadata
   - id, title, thumbnail_url, duration, date, views, embed_link, display_order

2. **`photos`** - Stores photo gallery items
   - id, title, thumbnail_url, full_image_url, date, location, description, program_url, password

3. **`thumbnails`** - Stores thumbnail images
   - id, type, file_name, image_url

4. **`settings`** - Stores website settings
   - id, key, value, value_type, description

### Storage Bucket

- **`images`** bucket (PUBLIC)
  - Stores thumbnail images in `thumbnails/` folder
  - Stores photo images in `photos/` folder

### Security Policies

- **Row Level Security (RLS):** Enabled on all tables
- **Public Read/Write:** All tables allow public access (for admin panel)
- **Storage Policies:** Public read/write for `images` bucket

## Troubleshooting

### "Bucket already exists" error
- ✅ This is fine! The bucket already exists, you can skip creating it.

### "Policy already exists" error
- ✅ This is fine! The policies are already set up, you can continue.

### Videos not showing on other devices
- Check: Is `video.html` loading Supabase scripts? (Should be fixed now)
- Check: Are videos saved to Supabase? (Check Table Editor → videos table)
- Check: Browser console for errors

### Thumbnails not uploading
- Check: Is `images` bucket PUBLIC?
- Check: Storage policies are set up (run `supabase-complete-setup.sql`)
- Check: Browser console for upload errors

### "Permission denied" errors
- Make sure storage policies are set up (run `supabase-complete-setup.sql`)
- Make sure `images` bucket is PUBLIC
- Check RLS policies are set correctly

## Next Steps

1. ✅ Run `supabase-complete-setup.sql` in SQL Editor
2. ✅ Create `images` storage bucket (PUBLIC)
3. ✅ Test by adding a video in admin panel
4. ✅ Verify it appears on `video.html`

Your setup is complete! 🎉

