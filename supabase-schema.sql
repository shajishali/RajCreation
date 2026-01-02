-- ============================================
-- RajCreation Live - Supabase Database Schema
-- ============================================
-- This file contains all database tables, indexes, and security policies
-- Run this in Supabase SQL Editor to set up your database
-- ============================================

-- ============================================
-- 1. THUMBNAILS TABLE
-- ============================================
-- Stores thumbnail images for live streams
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
-- 2. VIDEOS TABLE
-- ============================================
-- Stores recorded videos and video metadata
-- Matches admin/video.html form fields
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

-- Indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);

-- ============================================
-- 3. PHOTOS TABLE
-- ============================================
-- Stores photo gallery images and event photos
-- Matches admin/photo.html form fields
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

-- Indexes for photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(display_order);

-- ============================================
-- 4. SETTINGS TABLE
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
-- 5. UPDATE TIMESTAMPS TRIGGER FUNCTION
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

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- THUMBNAILS POLICIES
-- ============================================

-- Allow public read access to thumbnails
CREATE POLICY "Allow public read access for thumbnails"
    ON thumbnails FOR SELECT
    USING (true);

-- Allow public write access to thumbnails (for admin panel)
CREATE POLICY "Allow public write access for thumbnails"
    ON thumbnails FOR ALL
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
-- 7. INITIAL DATA (OPTIONAL)
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value, value_type, description)
VALUES 
    ('site_title', 'RajCreation Live', 'text', 'Website title'),
    ('live_stream_embed', '', 'text', 'Live stream embed code'),
    ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. HELPER FUNCTIONS (OPTIONAL)
-- ============================================

-- Function to get videos ordered by display_order
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
    ORDER BY v.display_order ASC, v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get photos ordered by display_order
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
    ORDER BY p.display_order ASC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF SCHEMA
-- ============================================
-- After running this schema:
-- 1. Go to Storage → Create bucket named 'images' (make it public)
-- 2. Set up storage policies (see supabase-storage-policies.sql)
-- 3. Update your js/config.js with your project credentials
-- 4. Test the connection from your admin panel
-- ============================================
