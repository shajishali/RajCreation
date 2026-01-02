-- ============================================
-- RajCreation Live - Supabase Database Schema
-- ============================================
-- This file contains all database tables, indexes, and security policies
-- Run this in Supabase SQL Editor to set up your database
-- ============================================

-- ============================================
-- 1. THUMBNAILS TABLE
-- ============================================
-- Stores thumbnail images for live streams and videos
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

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
-- Stores event details (live streams, scheduled events, etc.)
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    thumbnail_url TEXT,
    embed_code TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_live ON events(is_live);

-- ============================================
-- 3. PHOTOS TABLE
-- ============================================
-- Stores photo gallery images
CREATE TABLE IF NOT EXISTS photos (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'event', 'gallery', 'featured', etc.
    display_order INTEGER DEFAULT 0, -- For custom ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(display_order);

-- ============================================
-- 4. VIDEOS TABLE
-- ============================================
-- Stores recorded videos and video metadata
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    embed_link TEXT NOT NULL, -- Video embed code/URL
    thumbnail_url TEXT,
    duration INTEGER, -- Duration in seconds
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    category TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- ============================================
-- 5. SETTINGS TABLE
-- ============================================
-- Stores website settings and configuration
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
-- 6. UPDATE TIMESTAMPS TRIGGER FUNCTION
-- ============================================
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_thumbnails_updated_at BEFORE UPDATE ON thumbnails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- THUMBNAILS POLICIES
-- ============================================

-- Allow public read access to thumbnails
CREATE POLICY "Allow public read access for thumbnails"
    ON thumbnails FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update/delete thumbnails
-- For now, allow all (you can restrict this later with authentication)
CREATE POLICY "Allow public write access for thumbnails"
    ON thumbnails FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Allow public read access to events
CREATE POLICY "Allow public read access for events"
    ON events FOR SELECT
    USING (true);

-- Allow public write access to events (for admin panel)
CREATE POLICY "Allow public write access for events"
    ON events FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PHOTOS POLICIES
-- ============================================

-- Allow public read access to photos
CREATE POLICY "Allow public read access for photos"
    ON photos FOR SELECT
    USING (true);

-- Allow public write access to photos (for admin panel)
CREATE POLICY "Allow public write access for photos"
    ON photos FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VIDEOS POLICIES
-- ============================================

-- Allow public read access to videos
CREATE POLICY "Allow public read access for videos"
    ON videos FOR SELECT
    USING (true);

-- Allow public write access to videos (for admin panel)
CREATE POLICY "Allow public write access for videos"
    ON videos FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- SETTINGS POLICIES
-- ============================================

-- Allow public read access to settings
CREATE POLICY "Allow public read access for settings"
    ON settings FOR SELECT
    USING (true);

-- Allow public write access to settings (for admin panel)
CREATE POLICY "Allow public write access for settings"
    ON settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 8. STORAGE BUCKET POLICIES
-- ============================================
-- Note: These need to be set up in Supabase Dashboard → Storage
-- But we'll create them here for reference

-- Storage bucket: 'images'
-- This bucket will store all uploaded images (thumbnails, photos, etc.)

-- Policy 1: Allow public read access to images
-- Run this in SQL Editor after creating the 'images' bucket:
/*
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
*/

-- Policy 2: Allow authenticated uploads
-- For development, you can allow all uploads:
/*
CREATE POLICY "Allow public uploads to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');
*/

-- Policy 3: Allow authenticated updates
/*
CREATE POLICY "Allow public updates to images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');
*/

-- Policy 4: Allow authenticated deletes
/*
CREATE POLICY "Allow public deletes from images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
*/

-- ============================================
-- 9. INITIAL DATA (OPTIONAL)
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value, value_type, description)
VALUES 
    ('site_title', 'RajCreation Live', 'text', 'Website title'),
    ('live_stream_embed', '', 'text', 'Live stream embed code'),
    ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 10. HELPER FUNCTIONS (OPTIONAL)
-- ============================================

-- Function to get current live event
CREATE OR REPLACE FUNCTION get_current_live_event()
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    description TEXT,
    embed_code TEXT,
    thumbnail_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.embed_code,
        e.thumbnail_url
    FROM events e
    WHERE e.is_live = TRUE
    AND e.status = 'live'
    ORDER BY e.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment video view count
CREATE OR REPLACE FUNCTION increment_video_views(video_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE videos
    SET view_count = view_count + 1
    WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF SCHEMA
-- ============================================
-- After running this schema:
-- 1. Go to Storage → Create bucket named 'images' (make it public)
-- 2. Set up storage policies (see section 8 above)
-- 3. Update your supabase-config.js with your project credentials
-- 4. Test the connection from your admin panel
-- ============================================

