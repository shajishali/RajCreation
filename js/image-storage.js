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
        
        // Check manifest from images folder first (this works on all devices)
        if (imageManifest.thumbnails[type] && imageManifest.thumbnails[type].data) {
            return imageManifest.thumbnails[type].data;
        }
        
        // Fallback to localStorage (device-specific, works immediately on current device)
        const settingsData = localStorage.getItem('websiteSettings');
        if (settingsData) {
            try {
                const settings = JSON.parse(settingsData);
                if (settings.thumbnail) return settings.thumbnail;
            } catch (e) {}
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
        let settings = settingsData ? JSON.parse(settingsData) : {};
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
            let settings = JSON.parse(settingsData);
            delete settings.thumbnail;
            localStorage.setItem('websiteSettings', JSON.stringify(settings));
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
     */
    async function exportManifest() {
        await loadManifest();
        const jsonString = JSON.stringify(imageManifest, null, 2);
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

