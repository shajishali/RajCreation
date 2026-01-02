-- ============================================
-- Supabase Storage Policies for 'images' Bucket
-- ============================================
-- Run this AFTER creating the 'images' bucket in Supabase Dashboard
-- Go to: Storage → Create bucket → Name: 'images' → Public: Yes
-- Then run this SQL to set up policies
-- ============================================

-- ============================================
-- POLICY 1: Public Read Access
-- ============================================
-- Allows anyone to view/download images
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- ============================================
-- POLICY 2: Public Upload Access
-- ============================================
-- Allows anyone to upload images
-- ⚠️ WARNING: For production, restrict this to authenticated users only
-- For now, this allows public uploads (good for development/testing)
CREATE POLICY "Allow public uploads to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- ============================================
-- POLICY 3: Public Update Access
-- ============================================
-- Allows anyone to update/replace images
CREATE POLICY "Allow public updates to images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- ============================================
-- POLICY 4: Public Delete Access
-- ============================================
-- Allows anyone to delete images
CREATE POLICY "Allow public deletes from images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- ============================================
-- ALTERNATIVE: Authenticated-Only Policies
-- ============================================
-- For production, use these policies instead (requires authentication):
/*
-- Read: Anyone can read
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Write: Only authenticated users
CREATE POLICY "Allow authenticated uploads to images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated updates to images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes from images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);
*/

-- ============================================
-- END OF STORAGE POLICIES
-- ============================================

