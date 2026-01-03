-- Schedule Events Table Setup for RajCreationz
-- Run this SQL script in your Supabase SQL Editor

-- Create schedule_events table
CREATE TABLE IF NOT EXISTS public.schedule_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT DEFAULT 'IST (UTC+5:30)',
    category TEXT DEFAULT 'Regular Show',
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past', 'live', 'cancelled')),
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT, -- e.g., 'weekly', 'monthly', 'daily'
    location TEXT,
    video_url TEXT, -- For past events with recordings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON public.schedule_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_events_status ON public.schedule_events(status);

-- Enable Row Level Security
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Allow public insert to schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Allow public update to schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Allow public delete from schedule events" ON public.schedule_events;

-- Create RLS policies (allowing public access for simplicity)
-- For production, you should implement proper authentication

-- Allow anyone to read schedule events
CREATE POLICY "Allow public read access to schedule events"
ON public.schedule_events
FOR SELECT
USING (true);

-- Allow anyone to insert schedule events (change this for production)
CREATE POLICY "Allow public insert to schedule events"
ON public.schedule_events
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update schedule events (change this for production)
CREATE POLICY "Allow public update to schedule events"
ON public.schedule_events
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete schedule events (change this for production)
CREATE POLICY "Allow public delete from schedule events"
ON public.schedule_events
FOR DELETE
USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_schedule_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS schedule_events_updated_at ON public.schedule_events;
CREATE TRIGGER schedule_events_updated_at
    BEFORE UPDATE ON public.schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_schedule_events_updated_at();

-- Insert sample events (you can remove these after testing)
INSERT INTO public.schedule_events (title, description, event_date, start_time, end_time, category, status, is_recurring)
VALUES 
    ('New Year Special Program', 'Join us for a special New Year celebration program with live performances and entertainment.', '2024-12-31', '20:00:00', '22:00:00', 'Special Event', 'upcoming', false),
    ('Weekly Live Show', 'Our weekly live show featuring special guests and interactive sessions.', '2025-01-05', '19:00:00', '21:00:00', 'Regular Show', 'upcoming', false),
    ('Christmas Special Program', 'Christmas celebration program with festive performances.', '2024-12-25', '18:00:00', '20:30:00', 'Special Event', 'past', false),
    ('Monthly Discussion Forum', 'Monthly discussion forum on current topics. Repeats every month.', '2025-01-12', '17:00:00', '19:00:00', 'Discussion', 'upcoming', true)
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Setup completed successfully!' as message;
SELECT COUNT(*) as total_events FROM public.schedule_events;

