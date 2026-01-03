-- Videos Table Setup for RajCreationz
-- Run this SQL script in your Supabase SQL Editor

-- Create videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT,
    date TEXT,
    views TEXT,
    embed_link TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON public.videos(display_order);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow public insert to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow public update to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow public delete from videos" ON public.videos;

-- Create RLS policies (allowing public access)
-- Allow anyone to read videos
CREATE POLICY "Allow public read access to videos"
ON public.videos
FOR SELECT
USING (true);

-- Allow anyone to insert videos (change this for production if needed)
CREATE POLICY "Allow public insert to videos"
ON public.videos
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update videos (change this for production if needed)
CREATE POLICY "Allow public update to videos"
ON public.videos
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete videos (change this for production if needed)
CREATE POLICY "Allow public delete from videos"
ON public.videos
FOR DELETE
USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS videos_updated_at ON public.videos;
CREATE TRIGGER videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_videos_updated_at();

-- Verify the setup
SELECT 'Videos table setup completed successfully!' as message;
SELECT COUNT(*) as total_videos FROM public.videos;

