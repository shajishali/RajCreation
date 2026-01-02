-- ============================================
-- RajCreation Live - COMPLETE SUPABASE SETUP
-- ============================================
-- This file sets up EVERYTHING automatically:
-- 1. Database tables
-- 2. Storage policies (for 'images' bucket)
-- 3. Row Level Security policies
-- 4. Triggers and functions
-- 
-- IMPORTANT: The 'images' storage bucket must be created manually
-- See instructions at the bottom of this file
-- ============================================

-- ============================================
-- PART 1: DATABASE TABLES
-- ============================================

-- 1. THUMBNAILS TABLE
CREATE TABLE IF NOT EXISTS thumbnails (
    id BIGSERIAL PRIMARY KEY,
    type TEXT UNIQUE NOT NULL, -- 'live', 'video', etc.
    file_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_thumbnails_type ON thumbnails(type);

-- 2. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL, -- Image URL from Supabase Storage
    duration TEXT, -- e.g., "10:30"
    date TEXT, -- e.g., "Jan 15, 2024"
    views TEXT, -- e.g., "1.2K views"
    embed_link TEXT NOT NULL, -- Video embed iframe code
    display_order INTEGER DEFAULT 0, -- For custom ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add display_order column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE videos ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);

-- 3. PHOTOS TABLE
CREATE TABLE IF NOT EXISTS photos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL, -- Thumbnail image URL from Supabase Storage
    full_image_url TEXT, -- Full size image URL from Supabase Storage
    date TEXT, -- e.g., "January 15, 2024"
    location TEXT, -- Event location or venue
    description TEXT, -- Event description or details
    program_url TEXT NOT NULL, -- URL to external program/3rd party app
    password TEXT, -- Password required to access program URL
    display_order INTEGER DEFAULT 0, -- For custom ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add display_order column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE photos ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Indexes for photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(display_order);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, -- 'live_stream_embed', 'site_title', etc.
    value TEXT,
    value_type TEXT DEFAULT 'text', -- 'text', 'json', 'boolean', 'number'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for settings
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- PART 2: TRIGGERS AND FUNCTIONS
-- ============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist (for re-running schema)
DROP TRIGGER IF EXISTS update_thumbnails_updated_at ON thumbnails;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_thumbnails_updated_at BEFORE UPDATE ON thumbnails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get videos ordered by display_order
CREATE OR REPLACE FUNCTION get_videos_ordered()
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    thumbnail_url TEXT,
    duration TEXT,
    date TEXT,
    views TEXT,
    embed_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.title,
        v.thumbnail_url,
        v.duration,
        v.date,
        v.views,
        v.embed_link,
        v.created_at
    FROM videos v
    ORDER BY 
        COALESCE(v.display_order, 0) ASC, 
        v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get photos ordered by display_order
CREATE OR REPLACE FUNCTION get_photos_ordered()
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    thumbnail_url TEXT,
    full_image_url TEXT,
    date TEXT,
    location TEXT,
    description TEXT,
    program_url TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.thumbnail_url,
        p.full_image_url,
        p.date,
        p.location,
        p.description,
        p.program_url,
        p.password,
        p.created_at
    FROM photos p
    ORDER BY 
        COALESCE(p.display_order, 0) ASC, 
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running schema)
DROP POLICY IF EXISTS "Allow public read access for thumbnails" ON thumbnails;
DROP POLICY IF EXISTS "Allow public write access for thumbnails" ON thumbnails;
DROP POLICY IF EXISTS "Allow public read access for videos" ON videos;
DROP POLICY IF EXISTS "Allow public write access for videos" ON videos;
DROP POLICY IF EXISTS "Allow public read access for photos" ON photos;
DROP POLICY IF EXISTS "Allow public write access for photos" ON photos;
DROP POLICY IF EXISTS "Allow public read access for settings" ON settings;
DROP POLICY IF EXISTS "Allow public write access for settings" ON settings;

-- THUMBNAILS POLICIES
CREATE POLICY "Allow public read access for thumbnails"
    ON thumbnails FOR SELECT
    USING (true);

CREATE POLICY "Allow public write access for thumbnails"
    ON thumbnails FOR ALL
    USING (true)
    WITH CHECK (true);

-- VIDEOS POLICIES
CREATE POLICY "Allow public read access for videos"
    ON videos FOR SELECT
    USING (true);

CREATE POLICY "Allow public write access for videos"
    ON videos FOR ALL
    USING (true)
    WITH CHECK (true);

-- PHOTOS POLICIES
CREATE POLICY "Allow public read access for photos"
    ON photos FOR SELECT
    USING (true);

CREATE POLICY "Allow public write access for photos"
    ON photos FOR ALL
    USING (true)
    WITH CHECK (true);

-- SETTINGS POLICIES
CREATE POLICY "Allow public read access for settings"
    ON settings FOR SELECT
    USING (true);

CREATE POLICY "Allow public write access for settings"
    ON settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PART 4: STORAGE POLICIES (for 'images' bucket)
-- ============================================
-- These policies will work once you create the 'images' bucket
-- See instructions below

-- Drop existing storage policies if they exist (for re-running)
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from images" ON storage.objects;

-- POLICY 1: Public Read Access
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- POLICY 2: Public Upload Access
CREATE POLICY "Allow public uploads to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- POLICY 3: Public Update Access
CREATE POLICY "Allow public updates to images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- POLICY 4: Public Delete Access
CREATE POLICY "Allow public deletes from images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- ============================================
-- PART 5: INITIAL DATA
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value, value_type, description)
VALUES 
    ('site_title', 'RajCreation Live', 'text', 'Website title'),
    ('live_stream_embed', '', 'text', 'Live stream embed code'),
    ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- ✅ Database tables created
-- ✅ Storage policies created (will activate when bucket is created)
-- ✅ Row Level Security enabled
-- ✅ Triggers and functions set up
-- 
-- NEXT STEP: Create the Storage Bucket
-- ============================================
-- 
-- MANUAL STEP REQUIRED: Create 'images' Storage Bucket
-- 
-- Since you already have the 'images' bucket (I can see it in your dashboard),
-- you just need to make sure it's PUBLIC:
-- 
-- 1. Go to: Supabase Dashboard → Storage
-- 2. Click on the "images" bucket
-- 3. Click "Settings" tab
-- 4. Toggle "Public bucket" to ON (if not already)
-- 5. Click "Save"
-- 
-- The storage policies above are now active and ready to use!
-- 
-- To verify everything works:
-- 1. Go to your admin panel: admin/video.html
-- 2. Add a video with a thumbnail image
-- 3. Check Supabase Dashboard → Storage → images → thumbnails/ folder
-- 4. You should see the uploaded thumbnail image
-- ============================================

