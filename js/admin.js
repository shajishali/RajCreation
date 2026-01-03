/**
 * Admin Panel System for RajCreation Live
 * Provides authentication and content management capabilities
 */

(function() {
    'use strict';

    // Admin credentials
    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'admin123'
    };

    // Session management
    let adminState = {
        isAuthenticated: false,
        sessionExpiry: null,
        SESSION_DURATION: 2 * 60 * 60 * 1000 // 2 hours
    };

    /**
     * Initialize Admin System
     */
    function init() {
        // Check for existing session
        checkAdminSession();
        
        // Setup admin login
        setupAdminLogin();
        
        // Check if admin hash is in URL
        if (window.location.hash === '#admin' || window.location.hash === '#admin-login') {
            setTimeout(() => {
                showAdminLogin();
            }, 300);
        }
        
        // Show admin controls if authenticated
        if (adminState.isAuthenticated) {
            // Use a small delay to ensure DOM elements are available
            setTimeout(() => {
                showAdminControls();
            }, 100);
        }
    }

    /**
     * Setup Admin Login Modal
     */
    function setupAdminLogin() {
        createAdminLoginModal();
    }

    /**
     * Create Admin Login Modal
     */
    function createAdminLoginModal() {
        if (document.getElementById('adminLoginModal')) return;

        const modal = document.createElement('div');
        modal.id = 'adminLoginModal';
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>🔐 Admin Login</h2>
                    <button class="admin-modal-close" id="adminLoginClose" aria-label="Close">✕</button>
                </div>
                <div class="admin-modal-body">
                    <form id="adminLoginForm" class="admin-login-form">
                        <div class="form-group">
                            <label for="adminUsername">Username</label>
                            <input type="text" id="adminUsername" name="username" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="adminPassword">Password</label>
                            <input type="password" id="adminPassword" name="password" required autocomplete="current-password">
                        </div>
                        <button type="submit" class="admin-login-btn">Login</button>
                        <div class="admin-error" id="adminLoginError"></div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup event listeners
        setupLoginFormEvents();
    }

    /**
     * Setup Login Form Events
     */
    function setupLoginFormEvents() {
        const form = document.getElementById('adminLoginForm');
        const closeBtn = document.getElementById('adminLoginClose');
        const modal = document.getElementById('adminLoginModal');
        const overlay = modal.querySelector('.admin-modal-overlay');

        form.addEventListener('submit', handleAdminLogin);
        closeBtn.addEventListener('click', hideAdminLogin);
        overlay.addEventListener('click', hideAdminLogin);
    }

    /**
     * Handle Admin Login
     */
    function handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminLoginError');

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Create admin session
            createAdminSession();
            
            // Check if there's a return path after login (for admin pages)
            const returnPath = sessionStorage.getItem('adminReturnPath');
            if (returnPath) {
                sessionStorage.removeItem('adminReturnPath');
                
                // Hide login modal
                hideAdminLogin();
                
                // Show success notification
                showNotification('success', '✅ Login successful! Redirecting to admin panel...');
                
                // Small delay to show notification, then redirect
                setTimeout(() => {
                    window.location.href = returnPath;
                }, 800);
                return;
            }
            
            // Hide login modal
            hideAdminLogin();
            
            // Show admin controls
            showAdminControls();
            
            // Show success notification
            showNotification('success', '✅ Login successful!');
            
            // Remove hash from URL
            if (window.location.hash) {
                history.replaceState(null, null, ' ');
            }
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    }

    /**
     * Create Admin Session
     */
    function createAdminSession() {
        const expiry = new Date().getTime() + adminState.SESSION_DURATION;
        adminState.isAuthenticated = true;
        adminState.sessionExpiry = expiry;
        
        localStorage.setItem('adminSession', JSON.stringify({
            expiry: expiry,
            authenticated: true
        }));
    }

    /**
     * Check Admin Session
     */
    function checkAdminSession() {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expiry && now < session.expiry) {
                    adminState.isAuthenticated = true;
                    adminState.sessionExpiry = session.expiry;
                    return true;
                } else {
                    // Session expired
                    clearAdminSession();
                }
            } catch (e) {
                clearAdminSession();
            }
        }
        return false;
    }

    /**
     * Clear Admin Session
     */
    function clearAdminSession() {
        adminState.isAuthenticated = false;
        adminState.sessionExpiry = null;
        localStorage.removeItem('adminSession');
    }

    /**
     * Show Admin Login Modal
     */
    function showAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.getElementById('adminUsername').focus();
        }
    }

    /**
     * Hide Admin Login Modal
     */
    function hideAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Clear form
            document.getElementById('adminUsername').value = '';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminLoginError').style.display = 'none';
        }
    }

    /**
     * Show Admin Controls
     */
    function showAdminControls() {
        // Create floating admin panel
        createFloatingAdminPanel();
        
        // Show edit buttons on the page
        showEditButtons();
        
        // Setup edit modals
        setupEditModals();
    }

    /**
     * Create Floating Admin Panel
     */
    function createFloatingAdminPanel() {
        // Remove existing panel if any
        const existing = document.getElementById('floatingAdminPanel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'floatingAdminPanel';
        panel.className = 'floating-admin-panel';
        panel.innerHTML = `
            <div class="admin-panel-header">🔐 Admin Mode</div>
            <button id="adminLogoutBtn" class="admin-logout-btn">Logout</button>
        `;
        document.body.appendChild(panel);

        // Setup logout event
        document.getElementById('adminLogoutBtn').addEventListener('click', handleAdminLogout);
    }

    /**
     * Handle Admin Logout
     */
    function handleAdminLogout() {
        clearAdminSession();
        location.reload();
    }

    /**
     * Show Edit Buttons
     */
    function showEditButtons() {
        // Show edit buttons on home page (live stream)
        const editButtons = document.getElementById('adminEditButtons');
        if (editButtons) {
            editButtons.classList.add('show');
            
            // Setup button events
            const thumbnailBtn = document.getElementById('editThumbnailBtn');
            const liveStreamBtn = document.getElementById('editLiveStreamBtn');
            
            if (thumbnailBtn) {
                thumbnailBtn.addEventListener('click', () => openThumbnailModal());
            }
            
            if (liveStreamBtn) {
                liveStreamBtn.addEventListener('click', () => openLiveStreamModal());
            }
        }
        
        // Show edit buttons on video page (recorded videos)
        const videoEditButtons = document.getElementById('adminEditButtonsVideo');
        if (videoEditButtons) {
            videoEditButtons.classList.add('show');
            
            // Setup button event
            const recordedVideosBtn = document.getElementById('editRecordedVideosBtn');
            if (recordedVideosBtn) {
                recordedVideosBtn.addEventListener('click', () => openRecordedVideosModal());
            }
        }
    }

    /**
     * Setup Edit Modals
     */
    function setupEditModals() {
        // Create thumbnail edit modal (for home page)
        createThumbnailModal();
        
        // Create live stream edit modal (for home page)
        createLiveStreamModal();
        
        // Create recorded videos edit modal (for video page)
        createRecordedVideosModal();
    }

    /**
     * Create Thumbnail Edit Modal
     */
    function createThumbnailModal() {
        if (document.getElementById('thumbnailEditModal')) return;

        const modal = document.createElement('div');
        modal.id = 'thumbnailEditModal';
        modal.className = 'admin-edit-modal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>📸 Edit Thumbnail</h2>
                    <button class="admin-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div class="form-group">
                        <label for="thumbnailInput">Upload Thumbnail Image</label>
                        <input type="file" id="thumbnailInput" accept="image/*">
                    </div>
                    <div class="admin-thumbnail-preview" id="thumbnailPreview"></div>
                    <div class="form-actions">
                        <button class="btn-save" id="saveThumbnailBtn">Save Thumbnail</button>
                        <button class="btn-clear" id="clearThumbnailBtn">Remove Thumbnail</button>
                    </div>
                    <small style="display: block; margin-top: 1rem; color: #999; font-size: 0.85rem;">
                        Thumbnails are stored in Supabase and will be available on all devices.
                    </small>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => closeModal('thumbnailEditModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => closeModal('thumbnailEditModal'));
        document.getElementById('thumbnailInput').addEventListener('change', handleThumbnailPreview);
        document.getElementById('saveThumbnailBtn').addEventListener('click', saveThumbnail);
        document.getElementById('clearThumbnailBtn').addEventListener('click', clearThumbnail);
    }

    /**
     * Create Live Stream Edit Modal
     */
    function createLiveStreamModal() {
        if (document.getElementById('liveStreamEditModal')) return;

        const modal = document.createElement('div');
        modal.id = 'liveStreamEditModal';
        modal.className = 'admin-edit-modal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>📺 Edit Live Stream</h2>
                    <button class="admin-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div class="form-group">
                        <label for="liveStreamEmbedInput">Embed Code (HTML)</label>
                        <textarea id="liveStreamEmbedInput" placeholder="Paste your YOLO Live embed code here..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn-save" id="saveLiveStreamBtn">Save Embed</button>
                        <button class="btn-clear" id="clearLiveStreamBtn">Clear Embed</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => closeModal('liveStreamEditModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => closeModal('liveStreamEditModal'));
        document.getElementById('saveLiveStreamBtn').addEventListener('click', saveLiveStream);
        document.getElementById('clearLiveStreamBtn').addEventListener('click', clearLiveStream);
        
        // Load existing embed code
        loadLiveStreamEmbed();
    }

    /**
     * Open Thumbnail Modal
     */
    function openThumbnailModal() {
        const modal = document.getElementById('thumbnailEditModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Load existing thumbnail
            loadThumbnailPreview();
        }
    }

    /**
     * Open Live Stream Modal
     */
    function openLiveStreamModal() {
        const modal = document.getElementById('liveStreamEditModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close Modal
     */
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Handle Thumbnail Preview
     */
    function handleThumbnailPreview(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('thumbnailPreview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Thumbnail Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Load Thumbnail Preview
     */
    async function loadThumbnailPreview() {
        // Only load from Supabase
        if (window.RajCreationSupabase && window.RajCreationSupabase.getThumbnail) {
            try {
                const thumbnailData = await window.RajCreationSupabase.getThumbnail('live');
                if (thumbnailData) {
                    const preview = document.getElementById('thumbnailPreview');
                    if (preview) {
                        preview.innerHTML = `<img src="${thumbnailData}" alt="Current Thumbnail" style="max-width: 100%; border-radius: 8px;">`;
                    }
                }
            } catch (e) {
                console.log('Supabase thumbnail not found:', e);
            }
        } else {
            console.error('Supabase not available. Please ensure Supabase is configured.');
        }
    }

    /**
     * Save Thumbnail
     */
    async function saveThumbnail() {
        const fileInput = document.getElementById('thumbnailInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('error', '❌ Please select an image');
            return;
        }

        // Check if Supabase is available
        if (!window.RajCreationSupabase || !window.RajCreationSupabase.uploadImage) {
            showNotification('error', '❌ Supabase is not configured. Please set up Supabase first.');
            return;
        }

        const fileName = `thumbnail_live_${Date.now()}.${file.name.split('.').pop()}`;
        
        try {
            showNotification('info', '⏳ Uploading thumbnail to Supabase...');
            
            // Upload file to Supabase Storage
            const uploadResult = await window.RajCreationSupabase.uploadImage(file, fileName, 'thumbnails');
            
            // Save thumbnail metadata to database
            await window.RajCreationSupabase.saveThumbnail(fileName, uploadResult.url, 'live');
            
            // Apply thumbnail immediately if on index page
            if (window.RajCreationLive && typeof window.RajCreationLive.applyThumbnail === 'function') {
                window.RajCreationLive.applyThumbnail(uploadResult.url);
            }
            
            showNotification('success', '✅ Thumbnail saved to Supabase! It will be visible on all devices.');
            closeModal('thumbnailEditModal');
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            console.error('Supabase upload error:', error);
            showNotification('error', `❌ Failed to save thumbnail: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Clear Thumbnail
     */
    async function clearThumbnail() {
        if (!confirm('Remove the current thumbnail?')) {
            return;
        }

        // Check if Supabase is available
        if (!window.RajCreationSupabase || !window.RajCreationSupabase.getClient) {
            showNotification('error', '❌ Supabase is not configured. Please set up Supabase first.');
            return;
        }

        try {
            // Delete from Supabase database (the storage file will remain but won't be referenced)
            // Note: We could also delete from storage, but for simplicity, we just remove the database entry
            const client = window.RajCreationSupabase.getClient();
            const { error } = await client
                .from('thumbnails')
                .delete()
                .eq('type', 'live');

            if (error) throw error;
            
            // Remove thumbnail immediately if on index page
            if (window.RajCreationLive && typeof window.RajCreationLive.removeThumbnail === 'function') {
                window.RajCreationLive.removeThumbnail();
            }
            
            showNotification('success', '✅ Thumbnail removed from Supabase');
            closeModal('thumbnailEditModal');
            setTimeout(() => location.reload(), 300);
        } catch (error) {
            console.error('Error removing thumbnail:', error);
            showNotification('error', `❌ Failed to remove thumbnail: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Export Thumbnail to Images Folder (Deprecated - now using Supabase only)
     */
    async function exportThumbnailToImages() {
        showNotification('info', 'ℹ️ Thumbnails are now stored in Supabase only. No local export needed.');
    }

    /**
     * Load Live Stream Embed
     */
    async function loadLiveStreamEmbed() {
        // Only load from Supabase
        if (window.RajCreationSupabase && window.RajCreationSupabase.getLiveStreamEmbed) {
            try {
                const embedCode = await window.RajCreationSupabase.getLiveStreamEmbed();
                if (embedCode) {
                    const input = document.getElementById('liveStreamEmbedInput');
                    if (input) {
                        input.value = embedCode;
                    }
                }
            } catch (e) {
                console.log('Supabase embed code not found:', e);
            }
        } else {
            console.error('Supabase not available. Please ensure Supabase is configured.');
        }
    }

    /**
     * Save Live Stream
     */
    async function saveLiveStream() {
        const embedCode = document.getElementById('liveStreamEmbedInput').value.trim();
        
        if (!embedCode) {
            showNotification('error', '❌ Please enter embed code');
            return;
        }

        // Check if Supabase is available
        if (!window.RajCreationSupabase || !window.RajCreationSupabase.saveLiveStreamEmbed) {
            showNotification('error', '❌ Supabase is not configured. Please set up Supabase first.');
            return;
        }

        try {
            // Save to Supabase settings table
            await window.RajCreationSupabase.saveLiveStreamEmbed(embedCode);
            
            // Apply embed immediately if on index page
            if (window.RajCreationLive && typeof window.RajCreationLive.applyLiveStreamEmbed === 'function') {
                window.RajCreationLive.applyLiveStreamEmbed(embedCode);
            }
            
            showNotification('success', '✅ Live stream embed saved to Supabase!');
            closeModal('liveStreamEditModal');
            
            // Reload page to show embed (with small delay to ensure save completed)
            setTimeout(() => location.reload(), 300);
        } catch (error) {
            console.error('Error saving embed code:', error);
            showNotification('error', `❌ Failed to save embed code: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Clear Live Stream
     */
    async function clearLiveStream() {
        if (!confirm('Remove the current live stream embed?')) {
            return;
        }

        // Check if Supabase is available
        if (!window.RajCreationSupabase || !window.RajCreationSupabase.deleteLiveStreamEmbed) {
            showNotification('error', '❌ Supabase is not configured. Please set up Supabase first.');
            return;
        }

        try {
            // Delete from Supabase settings table
            await window.RajCreationSupabase.deleteLiveStreamEmbed();
            
            showNotification('success', '✅ Live stream embed removed from Supabase');
            closeModal('liveStreamEditModal');
            setTimeout(() => location.reload(), 300);
        } catch (error) {
            console.error('Error removing embed code:', error);
            showNotification('error', `❌ Failed to remove embed code: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Create Recorded Videos Edit Modal
     */
    function createRecordedVideosModal() {
        if (document.getElementById('recordedVideosEditModal')) return;

        const modal = document.createElement('div');
        modal.id = 'recordedVideosEditModal';
        modal.className = 'admin-edit-modal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>📹 Edit Recorded Videos</h2>
                    <button class="admin-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div class="form-group">
                        <label for="recordedVideosEmbedInput">Embed Code (HTML)</label>
                        <textarea id="recordedVideosEmbedInput" placeholder="Paste your YOLO Live recorded videos embed code here..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn-save" id="saveRecordedVideosBtn">Save Embed</button>
                        <button class="btn-clear" id="clearRecordedVideosBtn">Clear Embed</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => closeModal('recordedVideosEditModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => closeModal('recordedVideosEditModal'));
        document.getElementById('saveRecordedVideosBtn').addEventListener('click', saveRecordedVideos);
        document.getElementById('clearRecordedVideosBtn').addEventListener('click', clearRecordedVideos);
        
        // Load existing embed code
        loadRecordedVideosEmbed();
    }

    /**
     * Open Recorded Videos Modal
     */
    function openRecordedVideosModal() {
        const modal = document.getElementById('recordedVideosEditModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Load Recorded Videos Embed
     */
    function loadRecordedVideosEmbed() {
        const embedCode = localStorage.getItem('recordedVideosEmbed');
        if (embedCode) {
            const input = document.getElementById('recordedVideosEmbedInput');
            if (input) {
                input.value = embedCode;
            }
        }
    }

    /**
     * Save Recorded Videos
     */
    function saveRecordedVideos() {
        const embedCode = document.getElementById('recordedVideosEmbedInput').value.trim();
        
        if (embedCode) {
            localStorage.setItem('recordedVideosEmbed', embedCode);
            showNotification('success', '✅ Recorded videos embed saved!');
            closeModal('recordedVideosEditModal');
            
            // Reload page to show embed
            setTimeout(() => location.reload(), 500);
        } else {
            showNotification('error', '❌ Please enter embed code');
        }
    }

    /**
     * Clear Recorded Videos
     */
    function clearRecordedVideos() {
        if (confirm('Remove the current recorded videos embed?')) {
            localStorage.removeItem('recordedVideosEmbed');
            showNotification('success', '✅ Recorded videos embed removed');
            closeModal('recordedVideosEditModal');
            setTimeout(() => location.reload(), 500);
        }
    }

    /**
     * Show Notification
     */
    function showNotification(type, message) {
        // Remove existing notification
        const existing = document.querySelector('.admin-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide and remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Expose functions to window for use in main.js
     */
    window.RajCreationAdmin = {
        init: init,
        checkSession: checkAdminSession,
        showLogin: showAdminLogin
    };

    // Initialize when DOM is ready
    // Skip initialization if we're on a dedicated admin page
    if (!window.SKIP_ADMIN_JS_INIT) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();

