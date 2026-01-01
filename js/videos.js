/**
 * RajCreation Live - Videos Page JavaScript
 * Handles recorded videos page functionality
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Replace this with your actual YOLO Live recorded videos/archive embed URL
        YOLO_LIVE_RECORDED_VIDEOS_URL: 'YOLO_LIVE_RECORDED_VIDEOS_URL'
    };

    // DOM Elements
    const elements = {
        recordedVideos: document.getElementById('recordedVideos'),
        offlineState: document.getElementById('offlineState'),
        videoWrapper: document.getElementById('videoWrapper')
    };

    // State Management
    let videosState = {
        isLoaded: false,
        hasError: false
    };

    /**
     * Initialize the videos page
     */
    function init() {
        // Set up the recorded videos iframe
        setupRecordedVideos();
        
        // Initialize event listeners
        setupEventListeners();
        
        console.log('RajCreation Videos page initialized');
    }

    /**
     * Set up the recorded videos iframe
     */
    function setupRecordedVideos() {
        if (!elements.recordedVideos) {
            console.error('Recorded videos iframe not found');
            return;
        }

        // Get URL from config
        let videosUrl = CONFIG.YOLO_LIVE_RECORDED_VIDEOS_URL;
        
        // Check if URL is still a placeholder
        if (videosUrl === 'YOLO_LIVE_RECORDED_VIDEOS_URL' || !videosUrl || videosUrl.trim() === '') {
            console.warn('YOLO Live recorded videos URL not configured. Please update CONFIG.YOLO_LIVE_RECORDED_VIDEOS_URL in videos.js');
            showOfflineState();
            return;
        }

        // Set iframe source
        elements.recordedVideos.src = videosUrl;
        
        // Handle iframe load events
        elements.recordedVideos.addEventListener('load', handleVideosLoad);
        elements.recordedVideos.addEventListener('error', handleVideosError);
    }

    /**
     * Handle successful videos load
     */
    function handleVideosLoad() {
        console.log('Recorded videos loaded successfully');
        videosState.isLoaded = true;
        videosState.hasError = false;
        hideOfflineState();
    }

    /**
     * Handle videos load error
     */
    function handleVideosError() {
        console.warn('Error loading recorded videos');
        videosState.isLoaded = false;
        videosState.hasError = true;
        showOfflineState();
    }

    /**
     * Show offline state
     */
    function showOfflineState() {
        if (elements.offlineState) {
            elements.offlineState.classList.add('active');
        }
    }

    /**
     * Hide offline state
     */
    function hideOfflineState() {
        if (elements.offlineState) {
            elements.offlineState.classList.remove('active');
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    }

    /**
     * Handle online event
     */
    function handleOnline() {
        console.log('Network connection restored');
        if (videosState.hasError) {
            setupRecordedVideos();
        }
    }

    /**
     * Handle offline event
     */
    function handleOffline() {
        console.log('Network connection lost');
        showOfflineState();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();



