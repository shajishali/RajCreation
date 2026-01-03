-- Fix Videos Table - Add Missing Columns
-- Run this SQL script in your Supabase SQL Editor
-- This will add any missing columns to the existing videos table

-- Add date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'date'
    ) THEN
        ALTER TABLE public.videos ADD COLUMN date TEXT;
        RAISE NOTICE 'Added date column to videos table';
    END IF;
END $$;

-- Add duration column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'duration'
    ) THEN
        ALTER TABLE public.videos ADD COLUMN duration TEXT;
        RAISE NOTICE 'Added duration column to videos table';
    END IF;
END $$;

-- Add views column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'views'
    ) THEN
        ALTER TABLE public.videos ADD COLUMN views TEXT;
        RAISE NOTICE 'Added views column to videos table';
    END IF;
END $$;

-- Add display_order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.videos ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added display_order column to videos table';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.videos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to videos table';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'videos'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Videos table columns fixed successfully!' as message;

