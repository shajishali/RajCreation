# How to Check Your Supabase Data Storage

## 1. Check Database (Video Metadata)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"Table Editor"** in the left sidebar
4. Look for the **`videos`** table
5. Click on it to see all your video records

**What you should see:**
- Each video has: id, title, thumbnail_url, duration, date, views, embed_link
- The `thumbnail_url` column contains either:
  - A Supabase Storage URL (like: `https://[project].supabase.co/storage/v1/object/public/images/thumbnails/...`)
  - An external URL (like: `https://example.com/image.jpg`)

## 2. Check Storage (Thumbnail Images)

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Look for a bucket named **`images`**
3. Click on the `images` bucket
4. Look inside the **`thumbnails/`** folder

**What you should see:**
- Image files like: `video_thumbnail_1234567890.jpg`
- These are the actual thumbnail images you uploaded

## 3. If Storage Bucket Doesn't Exist

If you don't see the `images` bucket:

1. Click **"Storage"** → **"New bucket"**
2. Name: `images`
3. **Make it PUBLIC** (toggle "Public bucket" to ON)
4. Click "Create bucket"
5. Then run the SQL in `supabase-storage-policies.sql` in the SQL Editor

## 4. If Videos Table Doesn't Exist

If you don't see the `videos` table:

1. Click **"SQL Editor"** in the left sidebar
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to create the table

## Summary

- **Database (`videos` table)**: Stores all video information (text data)
- **Storage (`images` bucket)**: Stores thumbnail image files (binary data)
- **Both work together**: Storage holds the image file, Database holds the URL to that file

