/**
 * Image Storage System for RajCreation Live
 * Stores images in images folder instead of localStorage for cross-device access
 */

(function() {
    'use strict';

    // Get the manifest file path based on current page location
    function getManifestUrl() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
            return '../images/images-manifest.json';
        }
        return 'images/images-manifest.json';
    }

    let imageManifest = {
        thumbnails: {},
        photos: [],
        lastUpdated: ''
    };

    /**
     * Load manifest from images folder
     */
    async function loadManifest() {
        try {
            const response = await fetch(getManifestUrl());
            if (response.ok) {
                imageManifest = await response.json();
                return true;
            }
        } catch (e) {
            console.log('Manifest file not found, will use localStorage');
        }
        return false;
    }

    /**
     * Save manifest to localStorage (since we can't write files directly)
     */
    function saveManifestToLocalStorage() {
        imageManifest.lastUpdated = new Date().toISOString();
        localStorage.setItem('imagesManifest', JSON.stringify(imageManifest));
    }

    /**
     * Get Thumbnail
     */
    async function getThumbnail(type = 'live') {
        // Load manifest from images folder first (for cross-device access)
        await loadManifest();
        
        // Check manifest from images folder
        if (imageManifest.thumbnails[type]) {
            const thumbnail = imageManifest.thumbnails[type];
            
            // Priority 1: If manifest has base64 data, use it (file not yet on server)
            // This handles the case when thumbnail was just saved but file not committed to git yet
            if (thumbnail.data) {
                return thumbnail.data;
            }
            
            // Priority 2: If manifest has fileName but no data, try to load from file path
            // This handles the case when file exists on server (committed to git)
            if (thumbnail.fileName) {
                const fileName = thumbnail.fileName;
                const path = window.location.pathname.includes('/admin/') ? `../images/${fileName}` : `images/${fileName}`;
                
                // Try to verify file exists by attempting to load it
                // If file doesn't exist, fall through to localStorage
                try {
                    const response = await fetch(path, { method: 'HEAD' });
                    if (response.ok) {
                        return path;
                    }
                } catch (e) {
                    // File doesn't exist, fall through to localStorage
                }
            }
        }
        
        // Fallback to localStorage (device-specific, works immediately on current device)
        // This contains base64 data for immediate display
        const settingsData = localStorage.getItem('websiteSettings');
        if (settingsData) {
            try {
                const settings = JSON.parse(settingsData);
                if (settings.thumbnail) return settings.thumbnail;
            } catch (e) {
                // Invalid JSON, continue to next fallback
            }
        }
        
        return localStorage.getItem('liveThumbnail');
    }

    /**
     * Save Thumbnail
     */
    async function saveThumbnail(data, type = 'live', fileName = null) {
        await loadManifest();
        
        const fileExtension = fileName ? fileName.split('.').pop() : 'jpg';
        const defaultFileName = fileName || `thumbnail_${type}_${Date.now()}.${fileExtension}`;
        
        // Save to manifest
        imageManifest.thumbnails[type] = {
            fileName: defaultFileName,
            data: data,
            savedAt: new Date().toISOString()
        };
        
        // Save manifest to localStorage (so it can be exported later)
        saveManifestToLocalStorage();
        
        // Also save to websiteSettings for backward compatibility
        const settingsData = localStorage.getItem('websiteSettings');
        let settings = {};
        if (settingsData) {
            try {
                settings = JSON.parse(settingsData);
            } catch (e) {
                // Invalid JSON, start with empty object
                console.warn('Corrupted websiteSettings JSON, resetting:', e);
                settings = {};
            }
        }
        settings.thumbnail = data;
        localStorage.setItem('websiteSettings', JSON.stringify(settings));
        
        // Also save to old key for backward compatibility
        localStorage.setItem('liveThumbnail', data);
    }

    /**
     * Remove Thumbnail
     */
    async function removeThumbnail(type = 'live') {
        await loadManifest();
        
        delete imageManifest.thumbnails[type];
        saveManifestToLocalStorage();
        
        // Also remove from websiteSettings
        const settingsData = localStorage.getItem('websiteSettings');
        if (settingsData) {
            try {
                let settings = JSON.parse(settingsData);
                delete settings.thumbnail;
                localStorage.setItem('websiteSettings', JSON.stringify(settings));
            } catch (e) {
                // Invalid JSON, clear the corrupted data
                console.warn('Corrupted websiteSettings JSON, clearing:', e);
                localStorage.removeItem('websiteSettings');
            }
        }
        
        localStorage.removeItem('liveThumbnail');
    }

    /**
     * Export Image as File (for downloading to images folder)
     */
    function exportImageAsFile(dataUrl, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Export Manifest JSON (for downloading to images folder)
     * Creates manifest with file paths only (no base64 data)
     */
    async function exportManifest() {
        await loadManifest();
        
        // Create export manifest with file paths only (no base64 data)
        const exportManifest = {
            thumbnails: {},
            photos: [],
            lastUpdated: imageManifest.lastUpdated || new Date().toISOString()
        };
        
        // Copy thumbnail references (file paths only, no base64 data)
        for (const type in imageManifest.thumbnails) {
            const thumb = imageManifest.thumbnails[type];
            exportManifest.thumbnails[type] = {
                fileName: thumb.fileName,
                savedAt: thumb.savedAt
            };
        }
        
        // Copy photo references (file paths only, no base64 data)
        for (const photo of imageManifest.photos) {
            exportManifest.photos.push({
                fileName: photo.fileName,
                savedAt: photo.savedAt
            });
        }
        
        const jsonString = JSON.stringify(exportManifest, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'images-manifest.json';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export Thumbnail
     */
    async function exportThumbnail(type = 'live') {
        await loadManifest();
        
        const thumbnail = imageManifest.thumbnails[type];
        if (!thumbnail) {
            return false;
        }
        
        exportImageAsFile(thumbnail.data, thumbnail.fileName);
        exportManifest();
        return true;
    }

    /**
     * Get Photos
     */
    async function getPhotos() {
        await loadManifest();
        return imageManifest.photos || [];
    }

    /**
     * Save Photo
     */
    async function savePhoto(data, fileName = null) {
        await loadManifest();
        
        const fileExtension = fileName ? fileName.split('.').pop() : 'jpg';
        const defaultFileName = fileName || `photo_${Date.now()}.${fileExtension}`;
        
        const photo = {
            fileName: defaultFileName,
            data: data,
            savedAt: new Date().toISOString()
        };
        
        imageManifest.photos.push(photo);
        saveManifestToLocalStorage();
        
        return photo;
    }

    /**
     * Export All Images (thumbnails and photos)
     */
    async function exportAllImages() {
        await loadManifest();
        
        // Export thumbnails
        for (const type in imageManifest.thumbnails) {
            await exportThumbnail(type);
        }
        
        // Export photos
        for (const photo of imageManifest.photos) {
            exportImageAsFile(photo.data, photo.fileName);
        }
        
        // Export manifest
        exportManifest();
    }

    // Initialize
    loadManifest();

    // Expose to global scope
    window.RajCreationImages = {
        getThumbnail,
        saveThumbnail,
        removeThumbnail,
        exportThumbnail,
        exportAllImages,
        getPhotos,
        savePhoto,
        exportManifest,
        loadManifest
    };

})();

