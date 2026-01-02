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
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
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
            const { data, error } = await client.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: urlData } = client.storage
                .from('images')
                .getPublicUrl(filePath);

            return {
                success: true,
                path: filePath,
                url: urlData.publicUrl
            };
        } catch (error) {
            console.error('Error uploading image:', error);
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
        config: SUPABASE_CONFIG
    };

})();

