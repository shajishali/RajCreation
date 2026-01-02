# Supabase Setup Guide for RajCreation Live

This guide will help you set up Supabase as the database and storage for your RajCreation Live website.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: RajCreation Live
   - **Database Password**: (choose a strong password)
   - **Region**: (choose closest to your users)
5. Click "Create new project"
6. Wait for project to be created (takes 2-3 minutes)

## Step 2: Get Your Project Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Update Configuration

1. Open `js/supabase-config.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'YOUR_SUPABASE_URL', // Paste your Project URL here
       anonKey: 'YOUR_SUPABASE_ANON_KEY' // Paste your anon key here
   };
   ```

## Step 4: Create Database Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql` file:
   - Open `supabase-schema.sql` in your project
   - Copy all the SQL code
   - Paste it into Supabase SQL Editor

4. Click "Run" to execute the SQL
5. Verify tables are created in **Table Editor**:
   - You should see: `thumbnails`, `events`, `photos`, `videos`, `settings`

## Step 5: Set Up Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click "Create bucket"
3. Name: `images`
4. Make it **Public** (for public access to images)
5. Click "Create bucket"

### Set Storage Policies

**Option 1: Using SQL (Recommended)**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `supabase-storage-policies.sql`
3. Click "Run" to execute

**Option 2: Using Dashboard**
1. Go to **Storage** → **Policies** → `images` bucket
2. Click "New Policy"
3. Select "For full customization"
4. Copy policies from `supabase-storage-policies.sql` file
5. Create each policy one by one

**Note:** The provided policies allow public access (good for development). For production, use the authenticated-only policies in the comments.

## Step 6: Add Supabase Script to HTML

Add this script tag to your HTML files **before** `supabase-config.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

Files to update:
- `index.html`
- `admin/index.html`
- `admin/video.html`
- `admin/photo.html`

## Step 7: Enable CORS (if needed)

If you encounter CORS errors:
1. Go to **Settings** → **API**
2. Under "CORS Configuration", add your domain
3. Or use `*` for development (not recommended for production)

## Optional: Set Up Authentication (Recommended for Production)

For production, you should:
1. Set up authentication in Supabase
2. Use service role key (server-side) or authenticated user tokens (client-side)
3. Create RLS policies for authenticated users only

For now, the current setup allows public read access and you can use the service role key for admin operations.

## Testing

1. Open your website
2. Go to admin panel
3. Try uploading a thumbnail
4. Check Supabase dashboard → **Table Editor** → `thumbnails` to see if data appears
5. Check **Storage** → `images` bucket to see if files are uploaded

## Troubleshooting

### "Supabase client not initialized"
- Make sure you've added the Supabase script tag before `supabase-config.js`
- Check that your URL and anon key are correct

### "Permission denied" errors
- Check your RLS policies
- Make sure storage bucket is public or policies allow access
- For admin operations, you may need to use service role key (server-side only)

### Images not loading
- Check storage bucket is set to public
- Verify image URLs are correct
- Check browser console for CORS errors

## Next Steps

After setup:
1. Update admin panel code to use Supabase functions
2. Update frontend to load from Supabase
3. Test all functionality
4. Set up proper authentication for production

