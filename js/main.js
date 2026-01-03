/**
 * RajCreation Live - Main JavaScript
 * Handles live stream functionality and UI state management
 */

(function() {
    'use strict';

    // Global error handler to suppress XML parsing errors from third-party scripts (e.g., qcloud video player)
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    const suppressedErrorPatterns = [
        'XML Parsing Error',
        'datacenter.live.qcloud.com',
        'not well-formed',
        'qcloud.com',
        'tcplayer',
        'mozPressure',
        'mozInputSource',
        'VideoJS',
        'downloadable font',
        'rejected by sanitizer',
        'yololiv.com',
        'static.yololiv.com',
        'font-family',
        'no supported format found',
        'hls.min',
        'source map error',
        'scroll anchoring',
        'request failed with status'
    ];
    
    // Check if message should be suppressed
    function shouldSuppressMessage(message) {
        if (!message || typeof message !== 'string') {
            message = String(message);
        }
        const msgLower = message.toLowerCase();
        return suppressedErrorPatterns.some(pattern => 
            msgLower.includes(pattern.toLowerCase())
        );
    }
    
    // Suppress console errors from third-party scripts
    console.error = function(...args) {
        const errorMessage = args.map(arg => String(arg)).join(' ');
        // Only suppress known third-party errors, keep real errors visible
        if (!shouldSuppressMessage(errorMessage)) {
            originalConsoleError.apply(console, args);
        }
    };
    
    // Also suppress warnings that might contain XML parsing errors
    console.warn = function(...args) {
        const warningMessage = args.map(arg => String(arg)).join(' ');
        if (shouldSuppressMessage(warningMessage)) {
            return; // Suppress these warnings
        }
        originalConsoleWarn.apply(console, args);
    };
    
    // Suppress console logs from third-party scripts
    console.log = function(...args) {
        const logMessage = args.map(arg => String(arg)).join(' ');
        // Suppress numeric logs from YoloLiv (like "3 0.003...")
        if (shouldSuppressMessage(logMessage) || /^[\d\s.]+$/.test(logMessage.trim())) {
            return; // Suppress these logs
        }
        originalConsoleLog.apply(console, args);
    };
    
    // Suppress XML parsing errors via window error handler (multiple handlers for different error types)
    const errorHandler = function(event) {
        const errorMessage = (event.message || event.error?.message || '').toString();
        const errorSource = (event.filename || event.source || '').toString();
        
        if (shouldSuppressMessage(errorMessage) || shouldSuppressMessage(errorSource)) {
            event.preventDefault();
            event.stopPropagation();
            return true; // Prevent default error handling
        }
        return false;
    };
    
    // Add error listeners at multiple phases
    window.addEventListener('error', errorHandler, true); // Capture phase
    window.addEventListener('error', errorHandler, false); // Bubble phase
    
    // Handle unhandled promise rejections that might contain XML parsing errors
    window.addEventListener('unhandledrejection', function(event) {
        const reason = (event.reason || '').toString();
        if (shouldSuppressMessage(reason)) {
            event.preventDefault();
            return true;
        }
    });
    
    // Intercept XMLHttpRequest errors (some XML parsing errors come from XHR)
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(...args) {
        this._url = args[1];
        return originalXHROpen.apply(this, args);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
        const xhr = this;
        const originalOnerror = xhr.onerror;
        
        xhr.onerror = function(event) {
            const url = (xhr._url || '').toString();
            if (!shouldSuppressMessage(url)) {
                if (originalOnerror) {
                    originalOnerror.apply(this, arguments);
                }
            }
        };
        
        return originalXHRSend.apply(this, args);
    };

    // Configuration
    const CONFIG = {
        // Stream check interval (in milliseconds)
        // Set to null to disable automatic checking
        STREAM_CHECK_INTERVAL: 30000, // Check every 30 seconds
        
        // Health monitor update interval
        HEALTH_CHECK_INTERVAL: 5000, // Update every 5 seconds
        
        // Autoplay settings
        AUTOPLAY_ENABLED: true,
        
        // Stream quality detection
        QUALITY_DETECTION_ENABLED: true
    };

    // DOM Elements
    const elements = {
        liveStream: document.getElementById('videoWrapper'),
        liveIndicator: document.getElementById('liveIndicator'),
        offlineState: document.getElementById('offlineState'),
        videoWrapper: document.getElementById('videoWrapper'),
        navMenu: document.getElementById('navMenu'),
        recordedVideos: document.getElementById('recordedVideoWrapper'),
        recordedOfflineState: document.getElementById('recordedOfflineState'),
        recordedVideoWrapper: document.getElementById('recordedVideoWrapper'),
        streamStatusBar: document.getElementById('streamStatusBar'),
        streamStatus: document.getElementById('streamStatus'),
        streamQuality: document.getElementById('streamQuality'),
        connectionQuality: document.getElementById('connectionQuality'),
        streamLatency: document.getElementById('streamLatency'),
        streamLoading: document.getElementById('streamLoading'),
        retryStreamBtn: document.getElementById('retryStreamBtn'),
        streamHealthMonitor: document.getElementById('streamHealthMonitor'),
        bufferStatus: document.getElementById('bufferStatus'),
        bufferValue: document.getElementById('bufferValue'),
        connectionIndicator: document.getElementById('connectionIndicator')
    };

    // State Management
    let streamState = {
        isLive: true, // Default to live, can be updated based on stream status
        isChecking: false,
        quality: 'Auto',
        connectionQuality: 'Good',
        latency: null,
        bufferLevel: 0,
        lastCheckTime: null,
        errorCount: 0
    };

    /**
     * Initialize the application
     */
    function init() {
        // FIRST: Immediately hide offline state if thumbnail exists in settings
        // This prevents the offline state from flashing before settings are loaded
        const settings = loadSettingsSync();
        if (settings && settings.thumbnail) {
            const offlineState = document.getElementById('offlineState');
            if (offlineState) {
                offlineState.classList.remove('active');
                offlineState.style.display = 'none';
                offlineState.style.visibility = 'hidden';
                offlineState.style.opacity = '0';
                offlineState.style.zIndex = '1';
            }
        }
        
        // Load and apply saved settings (especially thumbnail)
        loadAndApplySettings();
        
        // Continuously ensure offline state stays hidden if thumbnail exists
        setInterval(function() {
            const currentSettings = loadSettings();
            const videoWrapper = document.getElementById('videoWrapper');
            const thumbnail = videoWrapper ? videoWrapper.querySelector('.live-video-thumbnail') : null;
            
            if ((currentSettings && currentSettings.thumbnail) || (thumbnail && thumbnail.offsetParent !== null)) {
                const offlineState = document.getElementById('offlineState');
                if (offlineState) {
                    offlineState.classList.remove('active');
                    offlineState.style.display = 'none';
                    offlineState.style.visibility = 'hidden';
                    offlineState.style.opacity = '0';
                    offlineState.style.zIndex = '1';
                }
            }
        }, 500); // Check every 500ms
        
        // Immediately check for thumbnail and hide offline state if present
        setTimeout(async function() {
            const settings = await loadSettings();
            if (settings && settings.thumbnail) {
                const videoWrapper = document.getElementById('videoWrapper');
                if (videoWrapper) {
                    const thumbnail = videoWrapper.querySelector('.live-video-thumbnail');
                    if (!thumbnail) {
                        // Thumbnail should exist but doesn't, reapply it
                        applyThumbnail(settings.thumbnail);
                    }
                    // Force hide offline state
                    const offlineState = document.getElementById('offlineState');
                    if (offlineState) {
                        offlineState.classList.remove('active');
                        offlineState.style.display = 'none';
                        offlineState.style.visibility = 'hidden';
                        offlineState.style.opacity = '0';
                        offlineState.style.zIndex = '1';
                    }
                }
            }
        }, 100);
        
        // Also check after a longer delay to ensure thumbnail is visible
        setTimeout(function() {
            forceApplyThumbnailIfExists();
        }, 1000);
        
        // Check again after 2 seconds
        setTimeout(function() {
            forceApplyThumbnailIfExists();
        }, 2000);
        
        // Check one more time after 3 seconds
        setTimeout(function() {
            forceApplyThumbnailIfExists();
        }, 3000);
        
        // Set up the live stream iframe
        setupLiveStream();
        
        // Set up recorded videos iframe
        setupRecordedVideos();
        
        // Initialize event listeners
        setupEventListeners();
        
        // Start stream monitoring if enabled
        if (CONFIG.STREAM_CHECK_INTERVAL) {
            startStreamMonitoring();
        }
        
        // Start health monitoring
        if (CONFIG.HEALTH_CHECK_INTERVAL) {
            startHealthMonitoring();
        }
        
        // Initialize stream status display
        updateStreamStatusDisplay();
        
        // Set up video player controls
        setupVideoPlayerControls();
        
        // Set up accessibility features
        setupAccessibility();
        
        // Set up UI/UX improvements
        setupUIEnhancements();
        
        console.log('RajCreation Live initialized');
    }

    /**
     * Set up the live stream
     */
    function setupLiveStream() {
        if (!elements.liveStream) {
            // Live stream container not found - this is normal on pages without live stream
            return;
        }

        // Show loading indicator
        if (elements.streamLoading) {
            elements.streamLoading.classList.add('active');
        }

        console.log('Live stream container found');
        
        // Set timeout to hide loading after stream has time to initialize
        setTimeout(() => {
            if (elements.streamLoading) {
                elements.streamLoading.classList.remove('active');
            }
            // Check stream status after stream loads
            checkStreamStatus();
        }, 5000);
    }

    /**
     * Handle successful stream load
     */
    function handleStreamLoad() {
        console.log('Live stream loaded successfully');
        streamState.isLive = true;
        updateUIState();
    }

    /**
     * Handle stream load error
     */
    function handleStreamError() {
        console.warn('Error loading live stream');
        // Check if thumbnail exists - if so, don't mark as offline
        const videoWrapper = document.getElementById('videoWrapper');
        const hasThumbnail = videoWrapper && videoWrapper.querySelector('.live-video-thumbnail');
        
        if (!hasThumbnail) {
            streamState.isLive = false;
            updateUIState();
        }
    }

    /**
     * Update UI based on stream state
     */
    function updateUIState() {
        // Check if thumbnail exists - if so, don't show offline state
        const videoWrapper = document.getElementById('videoWrapper');
        if (videoWrapper) {
            const thumbnail = videoWrapper.querySelector('.live-video-thumbnail');
            if (thumbnail && thumbnail.style.display !== 'none' && thumbnail.offsetParent !== null) {
                // Thumbnail is present and visible, don't show offline state
                if (elements.offlineState) {
                    elements.offlineState.classList.remove('active');
                    elements.offlineState.style.display = 'none';
                }
                return;
            }
        }
        
        if (streamState.isLive) {
            showLiveState();
        } else {
            showOfflineState();
        }
    }

    /**
     * Show live state (hide offline message)
     */
    function showLiveState() {
        if (elements.offlineState) {
            elements.offlineState.classList.remove('active');
        }
        if (elements.liveIndicator) {
            elements.liveIndicator.style.display = 'flex';
        }
    }

    /**
     * Show offline state (display offline message)
     */
    function showOfflineState() {
        // ALWAYS check if thumbnail exists first - if so, NEVER show offline state
        const videoWrapper = document.getElementById('videoWrapper');
        if (videoWrapper) {
            const thumbnail = videoWrapper.querySelector('.live-video-thumbnail');
            // Load settings synchronously for immediate check
            const settings = loadSettingsSync();
            
            // If thumbnail exists in DOM OR in settings, don't show offline state
            if ((thumbnail && thumbnail.offsetParent !== null) || (settings && settings.thumbnail)) {
                // Thumbnail is present, force hide offline state
                if (elements.offlineState) {
                    elements.offlineState.classList.remove('active');
                    elements.offlineState.style.display = 'none';
                    elements.offlineState.style.visibility = 'hidden';
                    elements.offlineState.style.opacity = '0';
                    elements.offlineState.style.zIndex = '1';
                }
                return; // Exit early, don't show offline state
            }
        }
        
        // Only show offline state if no thumbnail exists
        if (elements.offlineState) {
            elements.offlineState.classList.add('active');
        }
        if (elements.liveIndicator) {
            // Keep indicator visible but could be styled differently
            // elements.liveIndicator.style.display = 'none';
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Listen for visibility changes to pause/resume checking
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Handle window resize for responsive adjustments
        window.addEventListener('resize', debounce(handleResize, 250));
        
        // Retry stream button
        if (elements.retryStreamBtn) {
            elements.retryStreamBtn.addEventListener('click', retryStreamConnection);
        }
        
        // Set active navigation link based on current page
        setActiveNavLink();
        
        // Set up smooth scroll for video section
        setupVideoLinkScroll();
        
        // Set up smooth scroll for photo section
        setupPhotoLinkScroll();
        
        // Set up photo lightbox
        setupPhotoLightbox();
        
        // Set up video section enhancements
        setupVideoEnhancements();
        
        // Set up schedule section
        setupScheduleSection();
        
        // Set up smooth scroll for schedule section
        setupScheduleLinkScroll();
        
        // Set up smooth scroll for about section
        setupAboutLinkScroll();
        
        // Set up contact section
        if (typeof setupContactSection === 'function') {
            setupContactSection();
        }
        
        // Set up smooth scroll for contact section (if function exists)
        // This is optional and may not exist on all pages
        try {
            if (typeof setupContactLinkScroll === 'function') {
                setupContactLinkScroll();
            }
        } catch (e) {
            // Function doesn't exist, which is fine
        }
    }
    
    /**
     * Retry stream connection
     */
    function retryStreamConnection() {
        if (elements.streamLoading) {
            elements.streamLoading.classList.add('active');
        }
        
        if (elements.offlineState) {
            elements.offlineState.classList.remove('active');
        }
        
        streamState.errorCount = 0;
        
        // Check if thumbnail exists - if so, keep as live
        const videoWrapper = document.getElementById('videoWrapper');
        const hasThumbnail = videoWrapper && videoWrapper.querySelector('.live-video-thumbnail');
        
        if (!hasThumbnail) {
            streamState.isLive = false;
        }
        
        // Reload iframe
        if (elements.liveStream) {
            const currentSrc = elements.liveStream.src;
            elements.liveStream.src = '';
            setTimeout(() => {
                elements.liveStream.src = currentSrc;
                checkStreamStatus();
            }, 500);
        }
    }
    
    /**
     * Set active navigation link based on current page
     */
    function setActiveNavLink() {
        if (!elements.navMenu) return;
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = elements.navMenu.querySelectorAll('.header-nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Check if this link matches the current page
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Handle visibility change (tab switch)
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden, could pause monitoring
            console.log('Tab hidden');
        } else {
            // Tab is visible, resume monitoring
            console.log('Tab visible');
            if (CONFIG.STREAM_CHECK_INTERVAL) {
                checkStreamStatus();
            }
        }
    }

    /**
     * Handle online event
     */
    function handleOnline() {
        console.log('Network connection restored');
        streamState.connectionQuality = 'Good';
        updateConnectionQuality();
        updateStreamStatusDisplay();
        
        if (CONFIG.STREAM_CHECK_INTERVAL) {
            checkStreamStatus();
        }
        
        // Retry stream connection
        if (!streamState.isLive) {
            retryStreamConnection();
        }
    }

    /**
     * Handle offline event
     */
    function handleOffline() {
        console.log('Network connection lost');
        // Check if thumbnail exists - if so, don't show offline state
        const videoWrapper = document.getElementById('videoWrapper');
        const hasThumbnail = videoWrapper && videoWrapper.querySelector('.live-video-thumbnail');
        
        if (!hasThumbnail) {
            streamState.isLive = false;
            updateUIState();
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        // Could add responsive adjustments here if needed
        // Currently handled by CSS
    }

    /**
     * Start monitoring stream status
     */
    function startStreamMonitoring() {
        if (!CONFIG.STREAM_CHECK_INTERVAL) {
            return;
        }

        // Initial check
        checkStreamStatus();

        // Set up interval
        setInterval(() => {
            if (!document.hidden && !streamState.isChecking) {
                checkStreamStatus();
            }
        }, CONFIG.STREAM_CHECK_INTERVAL);
    }

    /**
     * Check stream status
     * Enhanced with actual status detection
     */
    function checkStreamStatus() {
        if (streamState.isChecking) {
            return;
        }

        streamState.isChecking = true;
        streamState.lastCheckTime = new Date();

        // Check if iframe is loaded and accessible
        if (elements.liveStream) {
            try {
                // Try to access iframe (may fail due to CORS, but we can check if it exists)
                const iframe = elements.liveStream;
                
                // Check if iframe has loaded
                if (iframe.contentWindow) {
                    // Iframe is accessible, assume stream might be live
                    // In production, you would check stream API here
                    checkStreamViaAPI();
                } else {
                    // Check if thumbnail exists before marking as offline
                    const videoWrapper = document.getElementById('videoWrapper');
                    const hasThumbnail = videoWrapper && videoWrapper.querySelector('.live-video-thumbnail');
                    
                    if (!hasThumbnail) {
                        streamState.isLive = false;
                        updateUIState();
                        updateStreamStatusDisplay();
                    } else {
                        // Thumbnail exists, keep stream as live to prevent offline message
                        streamState.isLive = true;
                        updateUIState();
                        updateStreamStatusDisplay();
                    }
                }
            } catch (e) {
                // CORS error is expected, but iframe exists
                // Try alternative check methods
                checkStreamViaAPI();
            }
        }

        setTimeout(() => {
            streamState.isChecking = false;
        }, 2000);
    }
    
    /**
     * Check stream status via API (placeholder for stream API)
     */
    function checkStreamViaAPI() {
        // Check if thumbnail exists - if so, don't mark as offline
        const videoWrapper = document.getElementById('videoWrapper');
        const hasThumbnail = videoWrapper && videoWrapper.querySelector('.live-video-thumbnail');
        
        // TODO: Implement actual stream API call
        // Example:
        // fetch('STREAM_API_ENDPOINT')
        //     .then(response => response.json())
        //     .then(data => {
        //         streamState.isLive = data.isLive;
        //         streamState.quality = data.quality || 'Auto';
        //         updateUIState();
        //         updateStreamStatusDisplay();
        //     })
        //     .catch(error => {
        //         console.error('Stream status check failed:', error);
        //         logStreamError('API Check Failed', error.message);
        //     });
        
        // For now, assume stream is live if no errors OR if thumbnail exists
        if (streamState.errorCount < 3 || hasThumbnail) {
            streamState.isLive = true;
        } else {
            streamState.isLive = false;
        }
        
        // Update UI but respect thumbnail
        updateUIState();
        updateStreamStatusDisplay();
    }
    
    /**
     * Check stream latency
     */
    function checkStreamLatency() {
        if (!elements.liveStream) return;
        
        const startTime = performance.now();
        
        // Try to measure latency by checking iframe load time
        // In production, use actual stream metrics from stream API
        setTimeout(() => {
            const latency = Math.round(performance.now() - startTime);
            streamState.latency = latency;
            updateStreamStatusDisplay();
        }, 100);
    }
    
    /**
     * Start health monitoring
     */
    function startHealthMonitoring() {
        // Initial health check
        updateHealthMonitor();
        
        // Set up interval for continuous monitoring
        setInterval(() => {
            if (!document.hidden) {
                updateHealthMonitor();
            }
        }, CONFIG.HEALTH_CHECK_INTERVAL);
    }
    
    /**
     * Update health monitor display
     */
    function updateHealthMonitor() {
        // Simulate buffer status (in production, get from actual stream)
        if (streamState.isLive) {
            // Simulate buffer level (0-100%)
            const bufferLevel = Math.min(100, streamState.bufferLevel + Math.random() * 10);
            streamState.bufferLevel = Math.max(0, bufferLevel - 2);
            
            if (elements.bufferStatus && elements.bufferValue) {
                const level = Math.round(streamState.bufferLevel);
                elements.bufferStatus.style.width = level + '%';
                elements.bufferValue.textContent = level + '%';
                
                // Update color based on buffer level
                elements.bufferStatus.className = 'health-fill';
                if (level > 70) {
                    elements.bufferStatus.classList.add('good');
                } else if (level > 30) {
                    elements.bufferStatus.classList.add('warning');
                } else {
                    elements.bufferStatus.classList.add('poor');
                }
            }
            
            // Update connection quality based on error count and latency
            updateConnectionQuality();
        }
    }
    
    /**
     * Update connection quality indicator
     */
    function updateConnectionQuality() {
        if (!elements.connectionIndicator || !elements.connectionQuality) return;
        
        let quality = 'Good';
        let qualityClass = 'good';
        
        // Determine quality based on latency and error count
        if (streamState.latency) {
            if (streamState.latency > 5000 || streamState.errorCount > 2) {
                quality = 'Poor';
                qualityClass = 'poor';
            } else if (streamState.latency > 2000 || streamState.errorCount > 0) {
                quality = 'Fair';
                qualityClass = 'warning';
            }
        }
        
        streamState.connectionQuality = quality;
        elements.connectionQuality.textContent = quality;
        
        // Update indicator dot
        const dot = elements.connectionIndicator.querySelector('.indicator-dot');
        if (dot) {
            dot.className = 'indicator-dot ' + qualityClass;
            const text = elements.connectionIndicator.querySelector('span:last-child');
            if (text) {
                text.textContent = quality;
            }
        }
    }
    
    /**
     * Update stream status display
     */
    function updateStreamStatusDisplay() {
        if (!elements.streamStatus) return;
        
        // Update status
        if (elements.streamStatus) {
            elements.streamStatus.textContent = streamState.isLive ? '🔴 Live' : '⚫ Offline';
            elements.streamStatus.className = 'status-value ' + (streamState.isLive ? 'live' : 'offline');
        }
        
        // Update quality
        if (elements.streamQuality) {
            elements.streamQuality.textContent = streamState.quality;
            if (streamState.quality.toLowerCase().includes('hd')) {
                elements.streamQuality.classList.add('hd');
            } else if (streamState.quality.toLowerCase().includes('sd')) {
                elements.streamQuality.classList.add('sd');
            }
        }
        
        // Update connection quality
        if (elements.connectionQuality) {
            elements.connectionQuality.textContent = streamState.connectionQuality;
        }
        
        // Update latency
        if (elements.streamLatency) {
            if (streamState.latency) {
                elements.streamLatency.textContent = streamState.latency + 'ms';
            } else {
                elements.streamLatency.textContent = '--';
            }
        }
    }
    
    /**
     * Log stream error
     */
    function logStreamError(type, message) {
        const errorLog = {
            type: type,
            message: message,
            timestamp: new Date().toISOString(),
            errorCount: streamState.errorCount
        };
        
        console.error('Stream Error:', errorLog);
        
        // Store in localStorage for debugging (optional)
        try {
            const logs = JSON.parse(localStorage.getItem('streamErrorLogs') || '[]');
            logs.push(errorLog);
            // Keep only last 10 errors
            if (logs.length > 10) {
                logs.shift();
            }
            localStorage.setItem('streamErrorLogs', JSON.stringify(logs));
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    /**
     * Utility: Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Set up the recorded videos section
     */
    function setupRecordedVideos() {
        if (!elements.recordedVideos) {
            // Only log if we're on a page that should have recorded videos
            const isVideoPage = window.location.pathname.includes('video.html') || 
                                document.getElementById('recordedVideoWrapper');
            if (isVideoPage) {
                console.log('Recorded videos container not found');
            }
            return;
        }

        console.log('Recorded videos container found');
        
        // Check videos load status after a delay
        setTimeout(function() {
            if (elements.recordedVideos && elements.recordedVideos.children.length > 0) {
                console.log('Recorded videos loaded successfully');
                if (elements.recordedOfflineState) {
                    elements.recordedOfflineState.classList.remove('active');
                }
            } else {
                console.warn('Recorded videos may not have loaded');
                if (elements.recordedOfflineState) {
                    elements.recordedOfflineState.classList.add('active');
                }
            }
        }, 5000);
    }

    /**
     * Handle successful recorded videos load
     */
    function handleRecordedVideosLoad() {
        console.log('Recorded videos loaded successfully');
        if (elements.recordedOfflineState) {
            elements.recordedOfflineState.classList.remove('active');
        }
    }

    /**
     * Handle recorded videos load error
     */
    function handleRecordedVideosError() {
        console.warn('Error loading recorded videos');
        if (elements.recordedOfflineState) {
            elements.recordedOfflineState.classList.add('active');
        }
    }

    /**
     * Smooth scroll to video section when clicking Video link
     */
    function setupVideoLinkScroll() {
        const videoLinks = document.querySelectorAll('a[href="#video"]');
        videoLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const videoSection = document.getElementById('video');
                if (videoSection) {
                    videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /**
     * Smooth scroll to photo section when clicking Photo link
     */
    function setupPhotoLinkScroll() {
        const photoLinks = document.querySelectorAll('a[href="#photo"]');
        photoLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const photoSection = document.getElementById('photo');
                if (photoSection) {
                    photoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    /**
     * Smooth scroll to schedule section when clicking Schedule link
     */
    function setupScheduleLinkScroll() {
        const scheduleLinks = document.querySelectorAll('a[href="#schedule"]');
        scheduleLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const scheduleSection = document.getElementById('schedule');
                if (scheduleSection) {
                    scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    /**
     * Smooth scroll to about section when clicking About link
     */
    function setupAboutLinkScroll() {
        const aboutLinks = document.querySelectorAll('a[href="#about"]');
        aboutLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /**
     * Set up photo lightbox functionality
     */
    function setupPhotoLightbox() {
        const lightbox = document.getElementById('photoLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxMetadata = document.getElementById('lightboxMetadata');
        const lightboxDescription = document.getElementById('lightboxDescription');
        const lightboxProgramLink = document.getElementById('lightboxProgramLink');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');
        const lightboxDownload = document.getElementById('lightboxDownload');
        
        if (!lightbox) return;
        
        const photoItems = document.querySelectorAll('.photo-item');
        let currentPhotoIndex = 0;
        let photos = [];
        
        // Collect all photo data
        photoItems.forEach((item, index) => {
            const thumbnail = item.querySelector('.photo-thumbnail');
            const image = item.querySelector('.photo-image');
            const title = item.querySelector('.photo-title').textContent;
            const metadata = item.querySelector('.photo-metadata');
            const description = item.querySelector('.photo-description').textContent;
            const programLink = item.querySelector('.photo-button').href;
            
            photos.push({
                fullImage: image.getAttribute('data-full-image') || image.src,
                thumbnail: image.src,
                title: title,
                metadata: metadata ? metadata.innerHTML : '',
                description: description,
                programLink: programLink
            });
            
            // Add click handler to thumbnail
            if (thumbnail) {
                thumbnail.addEventListener('click', () => openLightbox(index));
            }
        });
        
        function openLightbox(index) {
            currentPhotoIndex = index;
            const photo = photos[index];
            
            lightboxImage.src = photo.fullImage;
            lightboxImage.alt = photo.title;
            lightboxTitle.textContent = photo.title;
            lightboxMetadata.innerHTML = photo.metadata;
            lightboxDescription.textContent = photo.description;
            lightboxProgramLink.href = photo.programLink;
            lightboxDownload.onclick = () => downloadImage(photo.fullImage, photo.title);
            
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Update navigation buttons
            lightboxPrev.style.display = photos.length > 1 ? 'flex' : 'none';
            lightboxNext.style.display = photos.length > 1 ? 'flex' : 'none';
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function navigatePhoto(direction) {
            if (direction === 'next') {
                currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            } else {
                currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            }
            openLightbox(currentPhotoIndex);
        }
        
        function downloadImage(url, title) {
            const link = document.createElement('a');
            link.href = url;
            link.download = title.replace(/\s+/g, '-') + '.jpg';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Event listeners
        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }
        
        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', () => navigatePhoto('prev'));
        }
        
        if (lightboxNext) {
            lightboxNext.addEventListener('click', () => navigatePhoto('next'));
        }
        
        // Close on overlay click
        const overlay = lightbox.querySelector('.lightbox-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeLightbox);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                navigatePhoto('prev');
            } else if (e.key === 'ArrowRight') {
                navigatePhoto('next');
            }
        });
    }

    /**
     * Set up video section enhancements (search, filter, playlist)
     */
    function setupVideoEnhancements() {
        const videoSearch = document.getElementById('videoSearch');
        const videoSearchBtn = document.querySelector('.video-search-btn');
        const filterButtons = document.querySelectorAll('.video-filter-btn');
        const playlistItems = document.querySelectorAll('.playlist-item');
        
        // Video search functionality
        if (videoSearch) {
            const handleSearch = () => {
                const searchTerm = videoSearch.value.toLowerCase().trim();
                filterVideosBySearch(searchTerm);
            };
            
            videoSearch.addEventListener('input', debounce(handleSearch, 300));
            videoSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
            
            if (videoSearchBtn) {
                videoSearchBtn.addEventListener('click', handleSearch);
            }
        }
        
        // Video filter functionality
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    // Remove active class from all buttons
                    filterButtons.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    const category = this.getAttribute('data-category');
                    filterVideosByCategory(category);
                });
            });
        }
        
        // Playlist item click handlers
        if (playlistItems.length > 0) {
            playlistItems.forEach(item => {
                item.addEventListener('click', function() {
                    const videoId = this.getAttribute('data-video-id');
                    const videoTitle = this.querySelector('.playlist-video-title').textContent;
                    const videoDate = this.querySelector('.playlist-date').textContent;
                    const videoDuration = this.querySelector('.playlist-duration').textContent;
                    
                    // Update video metadata
                    updateVideoMetadata(videoTitle, videoDate, videoDuration);
                    
                    // Scroll to video player
                    const videoSection = document.getElementById('video');
                    if (videoSection) {
                        const videoContainer = videoSection.querySelector('.video-container');
                        if (videoContainer) {
                            videoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                    
                    // Highlight selected item
                    playlistItems.forEach(i => i.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
        }
        
        // Initialize with current date/time for metadata
        updateVideoMetadata('Current Video', new Date().toLocaleDateString(), 'Live');
    }
    
    /**
     * Filter videos by search term
     */
    function filterVideosBySearch(searchTerm) {
        const playlistItems = document.querySelectorAll('.playlist-item');
        let visibleCount = 0;
        
        playlistItems.forEach(item => {
            const title = item.querySelector('.playlist-video-title').textContent.toLowerCase();
            const date = item.querySelector('.playlist-date').textContent.toLowerCase();
            
            if (searchTerm === '' || title.includes(searchTerm) || date.includes(searchTerm)) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Show message if no results
        showVideoSearchResults(visibleCount);
    }
    
    /**
     * Filter videos by category
     */
    function filterVideosByCategory(category) {
        const playlistItems = document.querySelectorAll('.playlist-item');
        const searchInput = document.getElementById('videoSearch');
        
        // Clear search when filtering
        if (searchInput) {
            searchInput.value = '';
        }
        
        let visibleCount = 0;
        
        playlistItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            
            if (category === 'all' || itemCategory === category) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Update category in metadata
        const categoryElement = document.getElementById('videoCategory');
        if (categoryElement) {
            const categoryNames = {
                'all': 'All Videos',
                'recent': 'Recent Videos',
                'popular': 'Popular Videos',
                'events': 'Event Videos'
            };
            categoryElement.textContent = categoryNames[category] || 'All Videos';
        }
        
        showVideoSearchResults(visibleCount);
    }
    
    /**
     * Update video metadata display
     */
    function updateVideoMetadata(title, date, duration) {
        const uploadDateEl = document.getElementById('videoUploadDate');
        const durationEl = document.getElementById('videoDuration');
        
        if (uploadDateEl) {
            uploadDateEl.textContent = date;
        }
        
        if (durationEl) {
            durationEl.textContent = duration;
        }
    }
    
    /**
     * Show search results message
     */
    function showVideoSearchResults(count) {
        // You can add a message display here if needed
        console.log(`Showing ${count} video(s)`);
    }

    /**
     * Set up schedule section functionality
     */
    function setupScheduleSection() {
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        const listView = document.getElementById('scheduleListView');
        const calendarView = document.getElementById('scheduleCalendarView');
        const filterButtons = document.querySelectorAll('.schedule-filter-btn');
        const eventItems = document.querySelectorAll('.schedule-event-item');
        
        // View toggle
        if (listViewBtn && calendarViewBtn) {
            listViewBtn.addEventListener('click', () => switchScheduleView('list'));
            calendarViewBtn.addEventListener('click', () => switchScheduleView('calendar'));
        }
        
        // Filter functionality
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    const filter = this.getAttribute('data-filter');
                    filterScheduleEvents(filter);
                });
            });
        }
        
        // Reminder buttons
        const reminderButtons = document.querySelectorAll('.event-reminder-btn');
        reminderButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const eventId = this.getAttribute('data-event-id');
                setEventReminder(eventId);
            });
        });
        
        // Export buttons
        const exportButtons = document.querySelectorAll('.event-export-btn');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const eventId = this.getAttribute('data-event-id');
                exportEventToCalendar(eventId);
            });
        });
        
        // Initialize calendar
        if (calendarView) {
            initializeCalendar();
        }
    }
    
    /**
     * Switch between list and calendar view
     */
    function switchScheduleView(view) {
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        const listView = document.getElementById('scheduleListView');
        const calendarView = document.getElementById('scheduleCalendarView');
        
        if (view === 'list') {
            listViewBtn.classList.add('active');
            calendarViewBtn.classList.remove('active');
            listView.classList.add('active');
            calendarView.classList.remove('active');
        } else {
            listViewBtn.classList.remove('active');
            calendarViewBtn.classList.add('active');
            listView.classList.remove('active');
            calendarView.classList.add('active');
            initializeCalendar(); // Refresh calendar when switching to it
        }
    }
    
    /**
     * Filter schedule events
     */
    function filterScheduleEvents(filter) {
        const eventItems = document.querySelectorAll('.schedule-event-item');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        eventItems.forEach(item => {
            const eventDate = new Date(item.getAttribute('data-date'));
            const category = item.getAttribute('data-category');
            const isRecurring = item.getAttribute('data-recurring') === 'true';
            
            let show = false;
            
            if (filter === 'all') {
                show = true;
            } else if (filter === 'upcoming') {
                show = category === 'upcoming';
            } else if (filter === 'past') {
                show = category === 'past';
            } else if (filter === 'recurring') {
                show = isRecurring;
            }
            
            if (show) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Initialize calendar view
     */
    function initializeCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('calendarMonthYear');
        if (!calendarGrid || !monthYear) return;
        
        const now = new Date();
        let currentMonth = now.getMonth();
        let currentYear = now.getFullYear();
        
        // Store current view
        if (!window.scheduleCalendarState) {
            window.scheduleCalendarState = { month: currentMonth, year: currentYear };
        }
        
        currentMonth = window.scheduleCalendarState.month;
        currentYear = window.scheduleCalendarState.year;
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
        
        // Clear calendar
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // Get events for this month
        const events = getEventsForMonth(currentYear, currentMonth);
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const dayEl = createCalendarDay(day, true, currentYear, currentMonth - 1, events);
            calendarGrid.appendChild(dayEl);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
            const dayEl = createCalendarDay(day, false, currentYear, currentMonth, events, isToday);
            calendarGrid.appendChild(dayEl);
        }
        
        // Next month days (to fill grid)
        const totalCells = calendarGrid.children.length - 7; // Subtract headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = createCalendarDay(day, true, currentYear, currentMonth + 1, events);
            calendarGrid.appendChild(dayEl);
        }
        
        // Calendar navigation
        const prevBtn = document.getElementById('calendarPrev');
        const nextBtn = document.getElementById('calendarNext');
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                window.scheduleCalendarState.month--;
                if (window.scheduleCalendarState.month < 0) {
                    window.scheduleCalendarState.month = 11;
                    window.scheduleCalendarState.year--;
                }
                initializeCalendar();
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                window.scheduleCalendarState.month++;
                if (window.scheduleCalendarState.month > 11) {
                    window.scheduleCalendarState.month = 0;
                    window.scheduleCalendarState.year++;
                }
                initializeCalendar();
            };
        }
    }
    
    /**
     * Create calendar day element
     */
    function createCalendarDay(day, isOtherMonth, year, month, events, isToday = false) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        if (isOtherMonth) dayEl.classList.add('other-month');
        if (isToday) dayEl.classList.add('today');
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);
        
        // Add event dots
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        
        dayEvents.forEach(event => {
            const dot = document.createElement('div');
            dot.className = `calendar-event-dot ${event.category}`;
            if (event.recurring) dot.classList.add('recurring');
            dayEl.appendChild(dot);
        });
        
        return dayEl;
    }
    
    /**
     * Get events for a specific month
     */
    function getEventsForMonth(year, month) {
        const eventItems = document.querySelectorAll('.schedule-event-item');
        const events = [];
        
        eventItems.forEach(item => {
            const dateStr = item.getAttribute('data-date');
            const date = new Date(dateStr);
            const category = item.getAttribute('data-category');
            const isRecurring = item.getAttribute('data-recurring') === 'true';
            
            if (date.getFullYear() === year && date.getMonth() === month) {
                events.push({
                    date: dateStr,
                    category: category,
                    recurring: isRecurring
                });
            }
        });
        
        return events;
    }
    
    /**
     * Set event reminder
     */
    function setEventReminder(eventId) {
        // This would integrate with browser notifications API
        if ('Notification' in window && Notification.permission === 'granted') {
            alert('Reminder set! You will be notified before the event.');
        } else if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    alert('Reminder set! You will be notified before the event.');
                }
            });
        } else {
            alert('Reminder feature requires browser notification support.');
        }
    }
    
    /**
     * Export event to calendar (iCal format)
     */
    function exportEventToCalendar(eventId) {
        const eventItem = document.querySelector(`[data-event-id="${eventId}"]`)?.closest('.schedule-event-item');
        if (!eventItem) return;
        
        const title = eventItem.querySelector('.event-title').textContent;
        const date = eventItem.getAttribute('data-date');
        const time = eventItem.querySelector('.event-time').textContent.match(/\d{1,2}:\d{2}/g);
        const description = eventItem.querySelector('.event-description').textContent;
        
        // Create iCal content (simplified)
        const startDate = new Date(`${date}T${time[0]}:00`);
        const endDate = new Date(`${date}T${time[1]}:00`);
        
        const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RajCreation Live//Schedule//EN
BEGIN:VEVENT
DTSTART:${formatDateForICal(startDate)}
DTEND:${formatDateForICal(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
        
        // Download file
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '-')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Format date for iCal
     */
    function formatDateForICal(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Set up contact section functionality
     */
    function setupContactSection() {
        const contactForm = document.getElementById('contactForm');
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        // Contact form handling
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
            
            // Real-time validation
            const inputs = contactForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => validateField(input));
                input.addEventListener('input', () => clearFieldError(input));
            });
        }
        
        // FAQ accordion functionality
        if (faqQuestions.length > 0) {
            faqQuestions.forEach(question => {
                question.addEventListener('click', function() {
                    const faqItem = this.closest('.faq-item');
                    const isActive = faqItem.classList.contains('active');
                    
                    // Close all FAQ items
                    document.querySelectorAll('.faq-item').forEach(item => {
                        item.classList.remove('active');
                        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    });
                    
                    // Open clicked item if it wasn't active
                    if (!isActive) {
                        faqItem.classList.add('active');
                        this.setAttribute('aria-expanded', 'true');
                    }
                });
            });
        }
    }
    
    /**
     * Handle contact form submission
     */
    function handleContactFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('submitBtn');
        const successMsg = document.getElementById('formSuccess');
        
        // Validate all fields
        const name = document.getElementById('contactName');
        const email = document.getElementById('contactEmail');
        const subject = document.getElementById('contactSubject');
        const message = document.getElementById('contactMessage');
        
        let isValid = true;
        
        isValid = validateField(name) && isValid;
        isValid = validateField(email) && isValid;
        isValid = validateField(subject) && isValid;
        isValid = validateField(message) && isValid;
        
        if (!isValid) {
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.querySelector('.submit-text').style.display = 'none';
        submitBtn.querySelector('.submit-loading').style.display = 'inline';
        
        // Simulate form submission (since no backend)
        setTimeout(() => {
            // Show success message
            if (successMsg) {
                successMsg.style.display = 'block';
            }
            
            // Reset form
            form.reset();
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.querySelector('.submit-text').style.display = 'inline';
            submitBtn.querySelector('.submit-loading').style.display = 'none';
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                if (successMsg) {
                    successMsg.style.display = 'none';
                }
            }, 5000);
            
            // Scroll to success message
            if (successMsg) {
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 1000);
    }
    
    /**
     * Validate form field
     */
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const errorElement = document.getElementById(fieldName + 'Error');
        
        let isValid = true;
        let errorMessage = '';
        
        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        if (fieldName === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Minimum length validation
        if (fieldName === 'message' && value && value.length < 10) {
            isValid = false;
            errorMessage = 'Message must be at least 10 characters';
        }
        
        // Display error
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
        
        // Add error class to field
        if (isValid) {
            field.classList.remove('error');
        } else {
            field.classList.add('error');
        }
        
        return isValid;
    }
    
    /**
     * Clear field error
     */
    function clearFieldError(field) {
        const fieldName = field.name;
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        field.classList.remove('error');
    }

    /**
     * Set up video player controls
     */
    function setupVideoPlayerControls() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const pipBtn = document.getElementById('pipBtn');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const speedBtn = document.getElementById('speedBtn');
        const speedMenu = document.getElementById('speedMenu');
        const speedOptions = document.querySelectorAll('.speed-option');
        const videoWrapper = document.getElementById('videoWrapper');
        const controlsOverlay = document.getElementById('videoControlsOverlay');
        
        // Fullscreen functionality
        if (fullscreenBtn && videoWrapper) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Picture-in-Picture functionality
        // Note: PiP works with video elements, not widgets
        if (pipBtn) {
            pipBtn.addEventListener('click', togglePictureInPicture);
        }
        
        // Play/Pause (for iframe, this is limited but we can show UI feedback)
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', handlePlayPause);
        }
        
        // Volume control
        if (volumeBtn) {
            volumeBtn.addEventListener('click', toggleMute);
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', handleVolumeChange);
            // Store volume in localStorage
            const savedVolume = localStorage.getItem('videoVolume');
            if (savedVolume) {
                volumeSlider.value = savedVolume;
            }
        }
        
        // Playback speed
        if (speedBtn && speedMenu) {
            speedBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                speedMenu.classList.toggle('active');
            });
            
            // Close speed menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!speedBtn.contains(e.target) && !speedMenu.contains(e.target)) {
                    speedMenu.classList.remove('active');
                }
            });
        }
        
        if (speedOptions.length > 0) {
            speedOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const speed = this.getAttribute('data-speed');
                    setPlaybackSpeed(speed);
                    speedOptions.forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    speedBtn.querySelector('span').textContent = speed + 'x';
                    speedMenu.classList.remove('active');
                });
            });
        }
        
        // Show/hide controls on hover
        if (videoWrapper && controlsOverlay) {
            let hideControlsTimeout;
            
            videoWrapper.addEventListener('mousemove', function() {
                controlsOverlay.classList.add('active');
                clearTimeout(hideControlsTimeout);
                
                hideControlsTimeout = setTimeout(() => {
                    controlsOverlay.classList.remove('active');
                }, 3000);
            });
            
            videoWrapper.addEventListener('mouseleave', function() {
                controlsOverlay.classList.remove('active');
            });
        }
        
        // Keyboard controls
        setupKeyboardControls();
    }
    
    /**
     * Toggle fullscreen
     */
    function toggleFullscreen() {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) return;
        
        if (!document.fullscreenElement) {
            videoWrapper.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Toggle Picture-in-Picture
     */
    async function togglePictureInPicture() {
        if (!elements.liveStream) return;
        
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                // Note: PiP works with video elements, not iframes
                // This is a placeholder for when video element is used
                if (elements.liveStream.requestPictureInPicture) {
                    await elements.liveStream.requestPictureInPicture();
                } else {
                    alert('Picture-in-Picture is not supported for iframe embeds. It works with native video elements.');
                }
            }
        } catch (error) {
            console.error('Picture-in-Picture error:', error);
        }
    }
    
    /**
     * Handle play/pause
     */
    function handlePlayPause() {
        // For iframe, we can't directly control playback
        // This is a UI placeholder that could trigger iframe messages
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');
        
        if (playIcon && pauseIcon) {
            const isPlaying = playIcon.style.display === 'none';
            playIcon.style.display = isPlaying ? 'inline' : 'none';
            pauseIcon.style.display = isPlaying ? 'none' : 'inline';
        }
    }
    
    /**
     * Toggle mute
     */
    function toggleMute() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeIcon = document.querySelector('.volume-icon');
        const muteIcon = document.querySelector('.mute-icon');
        
        if (volumeSlider) {
            if (volumeSlider.value > 0) {
                localStorage.setItem('previousVolume', volumeSlider.value);
                volumeSlider.value = 0;
            } else {
                const previousVolume = localStorage.getItem('previousVolume') || 100;
                volumeSlider.value = previousVolume;
            }
            handleVolumeChange();
        }
        
        if (volumeIcon && muteIcon) {
            const isMuted = volumeSlider.value === '0';
            volumeIcon.style.display = isMuted ? 'none' : 'inline';
            muteIcon.style.display = isMuted ? 'inline' : 'none';
        }
    }
    
    /**
     * Handle volume change
     */
    function handleVolumeChange() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeIcon = document.querySelector('.volume-icon');
        const muteIcon = document.querySelector('.mute-icon');
        
        if (volumeSlider) {
            const volume = volumeSlider.value;
            localStorage.setItem('videoVolume', volume);
            
            if (volumeIcon && muteIcon) {
                volumeIcon.style.display = volume === '0' ? 'none' : 'inline';
                muteIcon.style.display = volume === '0' ? 'inline' : 'none';
            }
        }
    }
    
    /**
     * Set playback speed
     */
    function setPlaybackSpeed(speed) {
        // For iframe, this would need to communicate with the embedded player
        // This is a placeholder for future implementation
        localStorage.setItem('playbackSpeed', speed);
        console.log('Playback speed set to:', speed + 'x');
    }
    
    /**
     * Set up keyboard controls
     */
    function setupKeyboardControls() {
        document.addEventListener('keydown', function(e) {
            // Only handle if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'f':
                case 'F':
                    if (e.target.tagName !== 'INPUT') {
                        toggleFullscreen();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    adjustVolume(5);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    adjustVolume(-5);
                    break;
                case 'm':
                case 'M':
                    toggleMute();
                    break;
            }
        });
    }
    
    /**
     * Adjust volume
     */
    function adjustVolume(delta) {
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            const currentVolume = parseInt(volumeSlider.value);
            const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
            volumeSlider.value = newVolume;
            handleVolumeChange();
        }
    }
    
    /**
     * Set up accessibility features
     */
    function setupAccessibility() {
        // Skip to main content link removed per user request
        // const skipLink = document.createElement('a');
        // skipLink.href = '#main-content';
        // skipLink.className = 'skip-link';
        // skipLink.textContent = 'Skip to main content';
        // document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add ARIA labels where needed
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.id = 'main-content';
            mainContent.setAttribute('role', 'main');
        }
        
        // Add focus indicators
        addFocusStyles();
        
        // High contrast mode detection
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // Font size adjustment controls
        setupFontSizeControls();
        
        // Enhanced ARIA labels
        enhanceARIALabels();
        
        // Service worker registration for offline support
        registerServiceWorker();
    }
    
    /**
     * Set up font size adjustment controls
     */
    function setupFontSizeControls() {
        const fontSizeDecrease = document.getElementById('fontSizeDecrease');
        const fontSizeReset = document.getElementById('fontSizeReset');
        const fontSizeIncrease = document.getElementById('fontSizeIncrease');
        
        // Load saved font size preference
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            document.body.className = savedFontSize;
        }
        
        if (fontSizeDecrease) {
            fontSizeDecrease.addEventListener('click', function() {
                if (document.body.classList.contains('font-size-large')) {
                    document.body.className = 'font-size-small';
                } else if (document.body.classList.contains('font-size-extra-large')) {
                    document.body.className = 'font-size-large';
                } else {
                    document.body.className = 'font-size-small';
                }
                localStorage.setItem('fontSize', document.body.className);
            });
        }
        
        if (fontSizeReset) {
            fontSizeReset.addEventListener('click', function() {
                document.body.className = '';
                localStorage.removeItem('fontSize');
            });
        }
        
        if (fontSizeIncrease) {
            fontSizeIncrease.addEventListener('click', function() {
                if (document.body.classList.contains('font-size-small')) {
                    document.body.className = 'font-size-large';
                } else if (document.body.classList.contains('font-size-large')) {
                    document.body.className = 'font-size-extra-large';
                } else {
                    document.body.className = 'font-size-large';
                }
                localStorage.setItem('fontSize', document.body.className);
            });
        }
    }
    
    /**
     * Enhance ARIA labels throughout the page
     */
    function enhanceARIALabels() {
        // Add ARIA labels to navigation links
        const navLinks = document.querySelectorAll('.header-nav-link');
        navLinks.forEach(link => {
            if (!link.getAttribute('aria-label')) {
                const text = link.textContent.trim();
                link.setAttribute('aria-label', `Navigate to ${text} section`);
            }
        });
        
        // Add ARIA labels to buttons
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (button.textContent.trim()) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
        
        // Add ARIA labels to images
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            img.setAttribute('alt', 'Image');
            img.setAttribute('role', 'img');
        });
        
        // Add ARIA live regions for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'aria-live-region';
        document.body.appendChild(liveRegion);
    }
    
    /**
     * Register service worker for offline support
     */
    function registerServiceWorker() {
        // Service Workers only work with http:// or https:// protocols, not file://
        if (window.location.protocol === 'file:') {
            console.log('ServiceWorker registration skipped: file:// protocol not supported');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                        console.log('ServiceWorker registration successful:', registration.scope);
                    })
                    .catch(function(error) {
                        // Only log error if it's not a protocol issue
                        if (!error.message.includes('scheme') && !error.message.includes('protocol')) {
                            console.log('ServiceWorker registration failed:', error);
                        }
                    });
            });
        }
    }
    
    /**
     * Add focus styles for keyboard navigation
     */
    function addFocusStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: var(--accent-color);
                color: var(--text-primary);
                padding: var(--spacing-sm);
                text-decoration: none;
                z-index: 10000;
            }
            .skip-link:focus {
                top: 0;
            }
            *:focus-visible {
                outline: 2px solid var(--accent-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Set up UI/UX enhancements
     */
    function setupUIEnhancements() {
        // Back to top button
        setupBackToTop();
        
        // Search functionality
        setupSearch();
        
        // Quick links menu
        setupQuickLinks();
        
        // Theme switcher
        setupThemeSwitcher();
        
        // Breadcrumb navigation
        setupBreadcrumb();
        
        // Page loader
        setupPageLoader();
        
        // Page transitions
        setupPageTransitions();
    }
    
    /**
     * Set up back to top button
     */
    function setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', debounce(function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, 100));
        
        // Scroll to top on click
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    /**
     * Set up search functionality
     */
    function setupSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchClose = document.getElementById('searchClose');
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchBtn || !searchOverlay) return;
        
        // Open search overlay
        searchBtn.addEventListener('click', function() {
            searchOverlay.classList.add('active');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        });
        
        // Close search overlay
        if (searchClose) {
            searchClose.addEventListener('click', closeSearch);
        }
        
        // Close on overlay click
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                closeSearch();
            }
        });
        
        // Search functionality
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', debounce(function() {
                const query = searchInput.value.trim().toLowerCase();
                if (query.length > 0) {
                    performSearch(query, searchResults);
                } else {
                    searchResults.innerHTML = '';
                }
            }, 300));
        }
        
        function closeSearch() {
            searchOverlay.classList.remove('active');
            if (searchInput) {
                searchInput.value = '';
            }
            if (searchResults) {
                searchResults.innerHTML = '';
            }
        }
    }
    
    /**
     * Perform search
     */
    function performSearch(query, resultsContainer) {
        const searchableContent = [
            { type: 'Section', title: 'Video', content: 'Recorded videos and archives', href: '#video' },
            { type: 'Section', title: 'Photo', content: 'Event photos gallery', href: '#photo' },
            { type: 'Section', title: 'About', content: 'About RajCreation Live', href: '#about' },
            { type: 'Section', title: 'Schedule', content: 'Upcoming events and schedule', href: '#schedule' },
            { type: 'Section', title: 'Contact', content: 'Contact information and form', href: '#contact' }
        ];
        
        const matches = searchableContent.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.content.toLowerCase().includes(query)
        );
        
        resultsContainer.innerHTML = '';
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item"><p>No results found</p></div>';
            return;
        }
        
        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <h4><span class="result-type">${match.type}</span>${match.title}</h4>
                <p>${match.content}</p>
            `;
            item.addEventListener('click', function() {
                if (match.href) {
                    const target = document.querySelector(match.href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        document.getElementById('searchOverlay').classList.remove('active');
                    }
                }
            });
            resultsContainer.appendChild(item);
        });
    }
    
    /**
     * Set up quick links menu
     */
    function setupQuickLinks() {
        const quickLinksToggle = document.getElementById('quickLinksToggle');
        const quickLinksContent = document.getElementById('quickLinksContent');
        
        if (!quickLinksToggle || !quickLinksContent) return;
        
        quickLinksToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            quickLinksContent.classList.toggle('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!quickLinksToggle.contains(e.target) && !quickLinksContent.contains(e.target)) {
                quickLinksContent.classList.remove('active');
            }
        });
    }
    
    /**
     * Set up theme switcher
     */
    function setupThemeSwitcher() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        const themeIcon = themeSwitcher?.querySelector('.theme-icon');
        
        if (!themeSwitcher) return;
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        
        // Toggle theme on click
        themeSwitcher.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        // Auto theme detection
        if (window.matchMedia && !localStorage.getItem('theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
        }
    }
    
    /**
     * Set up breadcrumb navigation
     */
    function setupBreadcrumb() {
        const breadcrumbList = document.getElementById('breadcrumbList');
        if (!breadcrumbList) return;
        
        // Update breadcrumb based on current section
        function updateBreadcrumb() {
            const sections = document.querySelectorAll('section[id]');
            const scrollPosition = window.pageYOffset + 100;
            
            let currentSection = null;
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = section;
                }
            });
            
            if (currentSection) {
                const sectionId = currentSection.id;
                const sectionTitle = currentSection.querySelector('h2')?.textContent || sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
                
                breadcrumbList.innerHTML = `
                    <li><a href="index.html">Home</a></li>
                    <li>${sectionTitle}</li>
                `;
            } else {
                breadcrumbList.innerHTML = '<li><a href="index.html">Home</a></li>';
            }
        }
        
        window.addEventListener('scroll', debounce(updateBreadcrumb, 100));
        updateBreadcrumb();
    }
    
    /**
     * Set up page loader
     */
    function setupPageLoader() {
        const pageLoader = document.getElementById('pageLoader');
        if (!pageLoader) return;
        
        // Function to hide loader
        function hideLoader() {
            if (pageLoader) {
                pageLoader.classList.add('hidden');
                setTimeout(function() {
                    pageLoader.style.display = 'none';
                }, 300);
            }
        }
        
        // Hide loader when page is loaded
        if (document.readyState === 'complete') {
            // Page already loaded
            setTimeout(hideLoader, 100);
        } else {
            window.addEventListener('load', function() {
                setTimeout(hideLoader, 500);
            });
        }
        
        // Fallback: Hide loader after maximum wait time (5 seconds)
        setTimeout(function() {
            if (pageLoader && !pageLoader.classList.contains('hidden')) {
                console.warn('Page loader timeout - forcing hide');
                hideLoader();
            }
        }, 5000);
        
        // Also hide when DOM is ready (faster fallback)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(hideLoader, 1000);
            });
        }
    }
    
    /**
     * Set up page transitions
     */
    function setupPageTransitions() {
        // Add fade-in animation to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('fade-in');
        }
        
        // Add slide-up animation to sections
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * Apply live stream embed code
     */
    function applyLiveStreamEmbed(code) {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) {
            console.error('videoWrapper not found!');
            return;
        }
        
        // Remove existing embed containers
        const existingContainers = videoWrapper.querySelectorAll('div[style*="position: absolute"], .live-stream-embed-container');
        existingContainers.forEach(container => {
            // Only remove if it contains iframe or embed code
            if (container.querySelector('iframe, script, div[id*="yololiv"]')) {
                container.remove();
            }
        });
        
        // Remove existing iframes and scripts directly (but not thumbnail)
        const existingEmbeds = videoWrapper.querySelectorAll('iframe, script, div[id*="yololiv"]');
        existingEmbeds.forEach(embed => {
            // Don't remove the thumbnail
            if (!embed.closest('.live-video-thumbnail')) {
                embed.remove();
            }
        });
        
        // Hide offline state
        const offlineState = document.getElementById('offlineState');
        if (offlineState) {
            offlineState.classList.remove('active');
            offlineState.style.display = 'none';
            offlineState.style.visibility = 'hidden';
        }
        
        // Modify embed code to optimize buffering and hide chat/comments if it's YoloLiv
        let modifiedCode = code;
        
        // For YoloLiv iframes, add parameters to optimize streaming and hide chat
        if (code.includes('yololiv.com') || code.includes('yolo.live')) {
            // Parse the iframe src and add optimization parameters
            modifiedCode = code.replace(
                /src="([^"]*yololiv[^"]*?)"/gi,
                (match, url) => {
                    const separator = url.includes('?') ? '&' : '?';
                    // Add parameters for:
                    // - Hide chat/comments
                    // - Low latency mode
                    // - Auto quality adjustment
                    // - Reduced buffer
                    // - Auto play
                    const params = [
                        'hideChat=1',
                        'hideComments=1',
                        'chat=0',
                        'lowLatency=1',
                        'autoQuality=1',
                        'buffer=low',
                        'preload=auto',
                        'autoplay=1',
                        'muted=0',
                        'quality=auto'
                    ].join('&');
                    return `src="${url}${separator}${params}"`;
                }
            );
            
            // Also try to add attributes to iframe for better performance
            if (!modifiedCode.includes('style=')) {
                modifiedCode = modifiedCode.replace(
                    /<iframe/gi,
                    '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"'
                );
            }
            
            // Add allow attribute for autoplay
            if (!modifiedCode.includes('allow=')) {
                modifiedCode = modifiedCode.replace(
                    /<iframe/gi,
                    '<iframe allow="autoplay; fullscreen; picture-in-picture"'
                );
            }
            
            // Add loading="eager" for immediate loading
            if (!modifiedCode.includes('loading=')) {
                modifiedCode = modifiedCode.replace(
                    /<iframe/gi,
                    '<iframe loading="eager"'
                );
            }
        }
        
        // Create container for embed
        const embedContainer = document.createElement('div');
        embedContainer.className = 'live-stream-embed-container';
        embedContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5;';
        
        // Insert the embed code
        embedContainer.innerHTML = modifiedCode;
        videoWrapper.insertBefore(embedContainer, videoWrapper.firstChild);
        
        // Execute any scripts in the embed code
        const scripts = embedContainer.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        // After iframe loads, try to inject CSS to hide comments
        setTimeout(() => {
            const iframes = embedContainer.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    // Try to add CSS to hide chat (may fail due to CORS)
                    iframe.style.width = '100%';
                    iframe.style.maxWidth = '100%';
                } catch (e) {
                    // CORS will prevent this, but worth trying
                }
            });
        }, 1000);
        
        console.log('Live stream embed applied successfully');
    }

    /**
     * Apply recorded videos embed code
     */
    function applyRecordedVideosEmbed(code) {
        const recordedVideoWrapper = document.getElementById('recordedVideoWrapper');
        if (!recordedVideoWrapper) {
            console.error('recordedVideoWrapper not found!');
            return;
        }
        
        // Remove existing embed containers
        const existingContainers = recordedVideoWrapper.querySelectorAll('div[class*="embed"], div[style*="width: 100%"]');
        existingContainers.forEach(container => {
            if (container.querySelector('iframe, script, div[id*="yololiv"]')) {
                container.remove();
            }
        });
        
        // Remove existing iframes and scripts directly
        const existingEmbeds = recordedVideoWrapper.querySelectorAll('iframe, script, div[id*="yololiv"]');
        existingEmbeds.forEach(embed => embed.remove());
        
        // Hide offline state for recorded videos
        const recordedOfflineState = document.getElementById('recordedOfflineState');
        if (recordedOfflineState) {
            recordedOfflineState.classList.remove('active');
            recordedOfflineState.style.display = 'none';
        }
        
        // Create container for embed
        const embedContainer = document.createElement('div');
        embedContainer.className = 'recorded-videos-embed-container';
        embedContainer.style.cssText = 'width: 100%; min-height: 600px;';
        
        // Insert the embed code
        embedContainer.innerHTML = code;
        recordedVideoWrapper.insertBefore(embedContainer, recordedVideoWrapper.firstChild);
        
        // Execute any scripts in the embed code
        const scripts = embedContainer.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    /**
     * Apply thumbnail to live video
     */
    function applyThumbnail(thumbnailData) {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) return;
        
        // Remove existing thumbnail
        const existingThumbnail = videoWrapper.querySelector('.live-video-thumbnail');
        if (existingThumbnail) {
            existingThumbnail.remove();
        }
        
        // Hide offline state when thumbnail is present (do this first)
        const offlineState = videoWrapper.querySelector('.offline-state');
        if (offlineState) {
            offlineState.style.display = 'none';
            offlineState.classList.remove('active');
            offlineState.style.visibility = 'hidden';
            offlineState.style.zIndex = '1';
        }
        
        // Also hide loading indicator
        const loadingIndicator = videoWrapper.querySelector('.stream-loading');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('active');
            loadingIndicator.style.display = 'none';
        }
        
        // Create thumbnail overlay with all important styles
        const thumbnail = document.createElement('div');
        thumbnail.className = 'live-video-thumbnail';
        thumbnail.style.cssText = 'position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 15 !important; background-size: cover !important; background-position: center !important; background-image: url(' + thumbnailData + ') !important; cursor: pointer !important; display: block !important; visibility: visible !important; opacity: 1 !important; background-color: var(--bg-secondary, #1a1a1a) !important;';
        
        // Add LIVE badge
        const liveBadge = document.createElement('div');
        liveBadge.className = 'live-badge-thumbnail';
        liveBadge.innerHTML = '● LIVE';
        liveBadge.style.cssText = 'position: absolute; top: 20px; left: 20px; background: rgba(255, 0, 0, 0.9); color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; z-index: 17 !important; animation: pulse 2s infinite; letter-spacing: 1px;';
        thumbnail.appendChild(liveBadge);
        
        // Add play button overlay
        const playOverlay = document.createElement('div');
        playOverlay.className = 'thumbnail-play-overlay';
        playOverlay.innerHTML = '<div class="thumbnail-play-button">▶</div>';
        playOverlay.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 16 !important; width: 80px; height: 80px; background-color: rgba(255, 68, 68, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;';
        
        const playButton = playOverlay.querySelector('.thumbnail-play-button');
        playButton.style.cssText = 'font-size: 2rem; color: white; padding-left: 4px;';
        
        playOverlay.addEventListener('mouseenter', function() {
            this.style.transform = 'translate(-50%, -50%) scale(1.1)';
            this.style.backgroundColor = 'rgba(255, 68, 68, 1)';
        });
        
        playOverlay.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(-50%, -50%) scale(1)';
            this.style.backgroundColor = 'rgba(255, 68, 68, 0.9)';
        });
        
        thumbnail.appendChild(playOverlay);
        
        // Append thumbnail at the end so it appears on top of everything
        videoWrapper.appendChild(thumbnail);
        
        // Continuously ensure offline state stays hidden when thumbnail exists
        const keepOfflineHidden = setInterval(function() {
            const offlineState = videoWrapper.querySelector('.offline-state');
            if (offlineState && thumbnail.offsetParent !== null) {
                offlineState.style.display = 'none';
                offlineState.classList.remove('active');
            }
        }, 500);
        
        // Store interval ID on thumbnail for cleanup
        thumbnail.dataset.intervalId = keepOfflineHidden;
        
        // Hide thumbnail when video starts playing (if embed code is present and actually playing)
        // Only hide if video is actively playing, not just if embed exists
        const checkForVideo = setInterval(function() {
            const embed = videoWrapper.querySelector('iframe, video, [id*="yololiv"]');
            
            if (embed && thumbnail.offsetParent !== null) {
                // For video elements, check if playing
                if (embed.tagName === 'VIDEO') {
                    if (!embed.paused && !embed.ended && embed.currentTime > 0) {
                        // Video is playing, hide thumbnail
                        thumbnail.style.opacity = '0';
                        thumbnail.style.transition = 'opacity 0.5s ease';
                        thumbnail.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (thumbnail.parentNode) {
                                thumbnail.remove();
                            }
                        }, 500);
                        clearInterval(checkForVideo);
                    }
                }
                
                // For iframes, we can't easily detect playback
                // but we can hide thumbnail after a reasonable time if user hasn't clicked
                // This is handled by user click event instead
            }
        }, 2000);
        
        // Clear intervals when thumbnail is removed
        thumbnail.addEventListener('remove', function() {
            clearInterval(keepOfflineHidden);
            clearInterval(checkForVideo);
        });
        
        // Also hide thumbnail on click (user wants to play)
        thumbnail.addEventListener('click', function() {
            // Clear the interval that keeps offline state hidden
            const intervalId = this.dataset.intervalId;
            if (intervalId) {
                clearInterval(parseInt(intervalId));
            }
            
            // Fade out and remove thumbnail
            this.style.opacity = '0';
            this.style.transition = 'opacity 0.3s ease';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.remove();
            }, 300);
            
            // Try to auto-play the video if there's an iframe
            setTimeout(() => {
                const videoWrapper = document.getElementById('videoWrapper');
                if (videoWrapper) {
                    const iframe = videoWrapper.querySelector('iframe');
                    const video = videoWrapper.querySelector('video');
                    
                    // If there's a video element, try to play it
                    if (video && typeof video.play === 'function') {
                        video.play().catch(err => {
                            console.log('Video autoplay prevented:', err);
                        });
                    }
                    
                    // If there's an iframe, try to send play command
                    if (iframe) {
                        try {
                            // Try to focus the iframe to enable interactions
                            iframe.focus();
                            
                            // For some video players, clicking on them helps
                            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                        } catch (e) {
                            // Cross-origin restrictions may prevent this
                            console.log('Cannot control iframe:', e);
                        }
                    }
                }
            }, 100);
        });
        
        // Force hide offline state immediately and keep it hidden
        setTimeout(function() {
            const offlineState = videoWrapper.querySelector('.offline-state');
            if (offlineState) {
                offlineState.style.display = 'none';
                offlineState.classList.remove('active');
                offlineState.style.visibility = 'hidden';
            }
        }, 50);
    }

    /**
     * Remove thumbnail from live video
     */
    function removeThumbnail() {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) return;
        
        const thumbnail = videoWrapper.querySelector('.live-video-thumbnail');
        if (thumbnail) {
            thumbnail.style.opacity = '0';
            thumbnail.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                thumbnail.remove();
            }, 500);
        }
    }

    /**
     * Load and apply saved settings
     */
    async function loadAndApplySettings() {
        // Load settings (async to check images folder first)
        const settings = await loadSettings();
        if (!settings) {
            return;
        }
        
        try {
            
            // Wait for DOM to be ready
            const applySettings = function() {
                // Apply live stream embed first (so thumbnail can be on top)
                if (settings.liveStreamEmbed) {
                    applyLiveStreamEmbed(settings.liveStreamEmbed);
                }
                
                // Apply recorded videos embed
                if (settings.recordedVideosEmbed) {
                    applyRecordedVideosEmbed(settings.recordedVideosEmbed);
                }
                
                // Apply thumbnail after embed (so it appears on top with higher z-index)
                if (settings.thumbnail) {
                    
                    // Hide offline state immediately
                    const offlineState = document.getElementById('offlineState');
                    if (offlineState) {
                        offlineState.classList.remove('active');
                        offlineState.style.display = 'none';
                        offlineState.style.visibility = 'hidden';
                        offlineState.style.opacity = '0';
                    }
                    
                    // Apply thumbnail immediately
                    applyThumbnail(settings.thumbnail);
                    
                    // Reapply after delays to ensure it's visible
                    setTimeout(function() {
                        applyThumbnail(settings.thumbnail);
                        const offlineState2 = document.getElementById('offlineState');
                        if (offlineState2) {
                            offlineState2.classList.remove('active');
                            offlineState2.style.display = 'none';
                            offlineState2.style.visibility = 'hidden';
                            offlineState2.style.opacity = '0';
                        }
                    }, 100);
                    
                    setTimeout(function() {
                        applyThumbnail(settings.thumbnail);
                        const offlineState3 = document.getElementById('offlineState');
                        if (offlineState3) {
                            offlineState3.classList.remove('active');
                            offlineState3.style.display = 'none';
                            offlineState3.style.visibility = 'hidden';
                            offlineState3.style.opacity = '0';
                        }
                    }, 500);
                    
                    setTimeout(function() {
                        applyThumbnail(settings.thumbnail);
                        const offlineState4 = document.getElementById('offlineState');
                        if (offlineState4) {
                            offlineState4.classList.remove('active');
                            offlineState4.style.display = 'none';
                            offlineState4.style.visibility = 'hidden';
                            offlineState4.style.opacity = '0';
                        }
                    }, 1000);
                }
            };
            
            // Apply immediately if DOM is ready, otherwise wait
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applySettings);
            } else {
                // DOM is ready, but wait a bit for all elements to be available
                setTimeout(applySettings, 100);
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
    
    /**
     * Load settings (helper function) - Only from Supabase
     */
    async function loadSettings() {
        let settings = {};
        
        // Load thumbnail from Supabase
        if (window.RajCreationSupabase && window.RajCreationSupabase.getThumbnail) {
            try {
                const thumbnail = await window.RajCreationSupabase.getThumbnail('live');
                if (thumbnail) {
                    settings.thumbnail = thumbnail;
                }
            } catch (e) {
                console.log('No thumbnail found in Supabase:', e);
            }
        }
        
        // Load embed code from Supabase
        if (window.RajCreationSupabase && window.RajCreationSupabase.getLiveStreamEmbed) {
            try {
                const embedCode = await window.RajCreationSupabase.getLiveStreamEmbed();
                if (embedCode) {
                    settings.liveStreamEmbed = embedCode;
                }
            } catch (e) {
                console.log('No embed code found in Supabase:', e);
            }
        }
        
        return settings;
    }
    
    /**
     * Load settings synchronously (returns empty - use async loadSettings for Supabase)
     */
    function loadSettingsSync() {
        // Return empty settings - Supabase requires async calls
        // Use loadSettings() async function instead
        return {};
    }

    /**
     * Force apply thumbnail if it exists in settings
     */
    async function forceApplyThumbnailIfExists() {
        const settings = await loadSettings();
        if (settings && settings.thumbnail) {
            const videoWrapper = document.getElementById('videoWrapper');
            if (videoWrapper) {
                applyThumbnail(settings.thumbnail);
                // Force hide offline state
                const offlineState = document.getElementById('offlineState');
                if (offlineState) {
                    offlineState.style.display = 'none';
                    offlineState.classList.remove('active');
                    offlineState.style.visibility = 'hidden';
                    offlineState.style.opacity = '0';
                }
            }
        }
    }
    
    /**
     * Public API for external control (if needed)
     */
    window.RajCreationLive = {
        checkStream: checkStreamStatus,
        showOffline: showOfflineState,
        showLive: showLiveState,
        getState: () => ({ ...streamState }),
        toggleFullscreen: toggleFullscreen,
        togglePictureInPicture: togglePictureInPicture,
        applyLiveStreamEmbed: applyLiveStreamEmbed,
        applyRecordedVideosEmbed: applyRecordedVideosEmbed,
        applyThumbnail: applyThumbnail,
        removeThumbnail: removeThumbnail,
        loadSettings: loadSettings,
        forceApplyThumbnail: forceApplyThumbnailIfExists
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Ensure page loader is hidden even if there are errors
    window.addEventListener('error', function() {
        const pageLoader = document.getElementById('pageLoader');
        if (pageLoader && !pageLoader.classList.contains('hidden')) {
            setTimeout(function() {
                pageLoader.classList.add('hidden');
                pageLoader.style.display = 'none';
            }, 500);
        }
    });

})();

