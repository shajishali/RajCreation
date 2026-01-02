/**
 * Supabase Configuration for RajCreation Live
 * Handles database and storage integration
 */

(function() {
    'use strict';

    // Supabase configuration
    // Load from config.js if available, otherwise use defaults
    const SUPABASE_CONFIG = {
        url: (window.RAJ_CREATION_CONFIG && window.RAJ_CREATION_CONFIG.supabase?.url) || 'https://tryjfnrlmdbuhljlligi.supabase.co',
        anonKey: (window.RAJ_CREATION_CONFIG && window.RAJ_CREATION_CONFIG.supabase?.anonKey) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeWpmbnJsbWRidWhsamxsaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDE3ODIsImV4cCI6MjA4MjkxNzc4Mn0.JKQGzW4fOPBPeITeA0zV_5rVZsmVs2SVx5vjfDSt5Sg'
    };

    // Initialize Supabase client (will be set when script loads)
    let supabaseClient = null;

    /**
     * Initialize Supabase
     */
    function initSupabase() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase client library not loaded. Make sure supabase.js is included.');
            return false;
        }

        try {
            // Create Supabase client with proper configuration for storage uploads
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        'x-client-info': 'rajcreation-live'
                    }
                },
                // Ensure proper handling of storage requests
                db: {
                    schema: 'public'
                },
                storage: {
                    // Retry configuration for network errors
                    retryAttempts: 3,
                    retryDelay: 1000
                }
            });
            
            console.log('✅ Supabase client initialized:', SUPABASE_CONFIG.url);
            return true;
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            return false;
        }
    }

    /**
     * Get Supabase Client
     */
    function getClient() {
        if (!supabaseClient) {
            initSupabase();
        }
        return supabaseClient;
    }

    /**
     * Upload Image to Supabase Storage
     */
    async function uploadImage(file, fileName, folder = 'thumbnails') {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            // Upload file to Supabase Storage
            const filePath = `${folder}/${fileName}`;
            console.log('📤 Uploading to Supabase Storage:', filePath);
            console.log('📤 File details:', {
                name: fileName,
                size: file.size,
                type: file.type,
                folder: folder
            });
            console.log('📤 Supabase URL:', SUPABASE_CONFIG.url);
            
            // Validate file before upload
            if (!file || file.size === 0) {
                throw new Error('File is empty or invalid');
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                throw new Error('File size exceeds 50MB limit');
            }

            // Upload with retry logic
            let uploadError = null;
            let uploadData = null;
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📤 Upload attempt ${attempt}/${maxRetries}...`);
                    
                    const { data, error } = await client.storage
                        .from('images')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true,
                            contentType: file.type || 'image/jpeg'
                        });

                    if (error) {
                        uploadError = error;
                        console.error(`❌ Upload attempt ${attempt} failed:`, error);
                        
                        // Don't retry on certain errors
                        if (error.message && (
                            error.message.includes('Bucket not found') ||
                            error.message.includes('permission') ||
                            error.message.includes('policy') ||
                            error.message.includes('already exists')
                        )) {
                            break; // Don't retry, these are configuration issues
                        }
                        
                        // Wait before retry (exponential backoff)
                        if (attempt < maxRetries) {
                            const delay = attempt * 1000; // 1s, 2s, 3s
                            console.log(`⏳ Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } else {
                        uploadData = data;
                        uploadError = null;
                        break; // Success, exit retry loop
                    }
                } catch (networkError) {
                    uploadError = networkError;
                    console.error(`❌ Network error on attempt ${attempt}:`, networkError);
                    
                    // Check if it's a network/CORS error
                    if (networkError.message && (
                        networkError.message.includes('NetworkError') ||
                        networkError.message.includes('Failed to fetch') ||
                        networkError.message.includes('CORS')
                    )) {
                        // Provide helpful error message
                        throw new Error(
                            'Network error: Unable to connect to Supabase Storage. ' +
                            'This could be due to:\n' +
                            '1. CORS configuration issue\n' +
                            '2. Network connectivity problem\n' +
                            '3. Supabase service temporarily unavailable\n\n' +
                            'Please check:\n' +
                            '- Your internet connection\n' +
                            '- Supabase Dashboard → Settings → API → CORS settings\n' +
                            '- Browser console for detailed error messages'
                        );
                    }
                    
                    // Wait before retry
                    if (attempt < maxRetries) {
                        const delay = attempt * 1000;
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            if (uploadError) {
                console.error('❌ Storage upload error after retries:', uploadError);
                console.error('Error details:', JSON.stringify(uploadError, null, 2));
                
                // Check if it's a bucket not found error
                if (uploadError.message && uploadError.message.includes('Bucket not found')) {
                    throw new Error('Storage bucket "images" not found. Please create it in Supabase Dashboard → Storage → New bucket (name: "images", make it PUBLIC)');
                }
                
                // Check if it's a permission error
                if (uploadError.message && (uploadError.message.includes('permission') || uploadError.message.includes('policy'))) {
                    throw new Error('Storage permission denied. Please run supabase-complete-setup.sql to set up storage policies.');
                }
                
                throw uploadError;
            }

            console.log('✅ File uploaded successfully:', uploadData);

            // Get public URL
            const { data: urlData } = client.storage
                .from('images')
                .getPublicUrl(filePath);

            console.log('✅ Public URL generated:', urlData.publicUrl);

            return {
                success: true,
                path: filePath,
                url: urlData.publicUrl
            };
        } catch (error) {
            console.error('❌ Error uploading image to Supabase Storage:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * Save Thumbnail to Database
     */
    async function saveThumbnail(fileName, imageUrl, type = 'live') {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            const { data, error } = await client
                .from('thumbnails')
                .upsert({
                    type: type,
                    file_name: fileName,
                    image_url: imageUrl,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'type'
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving thumbnail:', error);
            throw error;
        }
    }

    /**
     * Get Thumbnail from Database
     */
    async function getThumbnail(type = 'live') {
        const client = getClient();
        if (!client) {
            return null;
        }

        try {
            const { data, error } = await client
                .from('thumbnails')
                .select('*')
                .eq('type', type)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
            return data ? data.image_url : null;
        } catch (error) {
            console.error('Error getting thumbnail:', error);
            return null;
        }
    }

    /**
     * Save Event to Database
     */
    async function saveEvent(eventData) {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            const { data, error } = await client
                .from('events')
                .upsert({
                    id: eventData.id || undefined,
                    title: eventData.title,
                    description: eventData.description,
                    date: eventData.date,
                    time: eventData.time,
                    thumbnail_url: eventData.thumbnail_url || null,
                    embed_code: eventData.embed_code || null,
                    is_live: eventData.is_live || false,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    }

    /**
     * Get All Events
     */
    async function getEvents() {
        const client = getClient();
        if (!client) {
            return [];
        }

        try {
            const { data, error } = await client
                .from('events')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    }

    /**
     * Delete Event
     */
    async function deleteEvent(eventId) {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            const { error } = await client
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    /**
     * Save Photo to Database and Storage
     */
    async function savePhoto(file, fileName, description = '') {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            // Upload image
            const uploadResult = await uploadImage(file, fileName, 'photos');
            
            // Save to database
            const { data, error } = await client
                .from('photos')
                .insert({
                    file_name: fileName,
                    image_url: uploadResult.url,
                    description: description,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true, data, url: uploadResult.url };
        } catch (error) {
            console.error('Error saving photo:', error);
            throw error;
        }
    }

    /**
     * Get All Photos
     */
    async function getPhotos() {
        const client = getClient();
        if (!client) {
            return [];
        }

        try {
            const { data, error } = await client
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting photos:', error);
            return [];
        }
    }

    /**
     * Delete Photo
     */
    async function deletePhoto(photoId) {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            const { error } = await client
                .from('photos')
                .delete()
                .eq('id', photoId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    }

    /**
     * Save Video to Database and Storage
     */
    async function saveVideo(videoData) {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            let thumbnailUrl = videoData.thumbnail_url || videoData.thumbnail;
            
            // If thumbnail is base64, upload it to Supabase Storage
            if (thumbnailUrl && thumbnailUrl.startsWith('data:image')) {
                try {
                    console.log('📸 Detected base64 thumbnail, uploading to Supabase Storage...');
                    
                    // Convert base64 to blob
                    const base64Data = thumbnailUrl.split(',')[1] || thumbnailUrl;
                    const mimeType = thumbnailUrl.match(/data:image\/([^;]+)/)?.[1] || 'jpg';
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: `image/${mimeType}` });
                    
                    const fileName = `video_thumbnail_${Date.now()}.${mimeType}`;
                    console.log('📤 Uploading thumbnail:', fileName, 'Size:', blob.size, 'bytes');
                    
                    // Upload to Supabase Storage
                    const uploadResult = await uploadImage(blob, fileName, 'thumbnails');
                    thumbnailUrl = uploadResult.url;
                    console.log('✅ Thumbnail uploaded successfully to:', thumbnailUrl);
                } catch (uploadError) {
                    console.error('❌ Error uploading thumbnail to Supabase Storage:', uploadError);
                    console.error('Error details:', uploadError.message);
                    
                    // Show user-friendly error message
                    const errorMsg = uploadError.message || 'Failed to upload thumbnail to storage';
                    alert(`⚠️ Thumbnail upload failed: ${errorMsg}\n\nThe video will be saved with the base64 image, but it won't be stored in Supabase Storage.\n\nPlease check:\n1. Storage bucket "images" exists and is PUBLIC\n2. Storage policies are set up (run supabase-complete-setup.sql)`);
                    
                    // Continue with base64 URL if upload fails (don't throw, just log)
                    console.warn('⚠️ Continuing with base64 thumbnail URL (not stored in Supabase Storage)');
                }
            } else if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
                console.warn('⚠️ Thumbnail URL is not base64 or HTTP URL:', thumbnailUrl);
            } else if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                console.log('✅ Using external thumbnail URL (not uploading to storage):', thumbnailUrl);
            }
            
            // Save to database
            const { data, error } = await client
                .from('videos')
                .upsert({
                    id: videoData.id || undefined,
                    title: videoData.title,
                    thumbnail_url: thumbnailUrl,
                    duration: videoData.duration || null,
                    date: videoData.date || null,
                    views: videoData.views || null,
                    embed_link: videoData.embed_link || videoData.embedLink,
                    display_order: videoData.display_order || 0,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving video:', error);
            throw error;
        }
    }

    /**
     * Get All Videos
     */
    async function getVideos() {
        const client = getClient();
        if (!client) {
            return [];
        }

        try {
            const { data, error } = await client
                .from('videos')
                .select('*')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting videos:', error);
            return [];
        }
    }

    /**
     * Delete Video
     */
    async function deleteVideo(videoId) {
        const client = getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            const { error } = await client
                .from('videos')
                .delete()
                .eq('id', videoId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting video:', error);
            throw error;
        }
    }

    // Initialize when loaded
    // Note: Supabase script must be loaded first
    if (typeof supabase !== 'undefined') {
        initSupabase();
    }

    // Expose to global scope
    window.RajCreationSupabase = {
        init: initSupabase,
        getClient: getClient,
        uploadImage: uploadImage,
        saveThumbnail: saveThumbnail,
        getThumbnail: getThumbnail,
        saveEvent: saveEvent,
        getEvents: getEvents,
        deleteEvent: deleteEvent,
        savePhoto: savePhoto,
        getPhotos: getPhotos,
        deletePhoto: deletePhoto,
        saveVideo: saveVideo,
        getVideos: getVideos,
        deleteVideo: deleteVideo,
        config: SUPABASE_CONFIG
    };

})();

