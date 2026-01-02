/**
 * Supabase Storage Bucket Setup Script
 * 
 * This script automatically creates the 'images' storage bucket in Supabase
 * 
 * Usage:
 * 1. Install Node.js if you haven't already
 * 2. Install dependencies: npm install @supabase/supabase-js
 * 3. Update the SUPABASE_URL and SUPABASE_SERVICE_KEY below
 * 4. Run: node setup-bucket.js
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const SUPABASE_URL = 'https://tryjfnrlmdbuhljlligi.supabase.co'; // Your Supabase project URL
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Get from: Settings → API → service_role key

// ============================================
// SCRIPT
// ============================================

async function setupBucket() {
    if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        console.error('❌ ERROR: Please update SUPABASE_SERVICE_KEY in setup-bucket.js');
        console.error('   Get your service_role key from: Supabase Dashboard → Settings → API');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('🚀 Setting up Supabase Storage bucket...\n');

    try {
        // Check if bucket already exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            throw listError;
        }

        const existingBucket = buckets.find(b => b.name === 'images');
        
        if (existingBucket) {
            console.log('✅ Bucket "images" already exists!');
            console.log(`   Public: ${existingBucket.public ? 'Yes ✅' : 'No ❌'}`);
            
            if (!existingBucket.public) {
                console.log('\n⚠️  WARNING: Bucket exists but is not public!');
                console.log('   To make it public:');
                console.log('   1. Go to Supabase Dashboard → Storage');
                console.log('   2. Click on "images" bucket');
                console.log('   3. Click "Settings" tab');
                console.log('   4. Toggle "Public bucket" to ON');
                console.log('   5. Click "Save"');
            }
            return;
        }

        // Create the bucket
        console.log('📦 Creating "images" bucket...');
        const { data, error } = await supabase.storage.createBucket('images', {
            public: true,
            fileSizeLimit: 52428800, // 50 MB
            allowedMimeTypes: null // Allow all types
        });

        if (error) {
            throw error;
        }

        console.log('✅ Successfully created "images" bucket!');
        console.log('   Public: Yes ✅');
        console.log('   File size limit: 50 MB');
        console.log('   Allowed MIME types: Any\n');
        
        console.log('🎉 Setup complete! Your storage bucket is ready to use.');
        console.log('   Storage policies from supabase-complete-setup.sql are now active.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('already exists')) {
            console.error('\n   The bucket already exists. This is fine!');
        } else {
            console.error('\n   Please check:');
            console.error('   1. Your SUPABASE_URL is correct');
            console.error('   2. Your SUPABASE_SERVICE_KEY is correct (service_role key, not anon key)');
            console.error('   3. You have permission to create buckets');
            process.exit(1);
        }
    }
}

// Run the setup
setupBucket();



