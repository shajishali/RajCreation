/**
 * RajCreation Live - Configuration File
 * 
 * IMPORTANT: This file contains sensitive keys.
 * For production, consider using environment variables or a build process.
 * 
 * To use: Copy this file and update with your actual values.
 * You can also create a config.local.js that overrides these values.
 */

(function() {
    'use strict';

    // Supabase Configuration
    window.RAJ_CREATION_CONFIG = {
        supabase: {
            url: 'https://ahxqgrdiyfjsmjrkibdg.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeHFncmRpeWZuc21qcmtpYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDQ4MjksImV4cCI6MjA4MjkyMDgyOX0.dHS0r8_m4yOcGoItWZzpZie2H9Lt-edi4zPnlDd72VI'
        },
        
        // Site Configuration
        site: {
            title: 'RajCreation Live',
            description: 'Watch live telecast streaming'
        },
        
        // Admin Configuration
        admin: {
            username: 'admin',
            password: 'admin123'
        },
        
        // API Configuration (for future use)
        api: {
            baseUrl: window.location.origin,
            timeout: 30000
        },
        
        // Feature Flags
        features: {
            enableAnalytics: false,
            enableNotifications: true,
            enableOfflineMode: true
        }
    };

    // Try to load local config override if it exists
    // This allows you to create config.local.js with your own values
    // and add it to .gitignore
    if (typeof window.RAJ_CREATION_CONFIG_LOCAL !== 'undefined') {
        // Deep merge local config over default config
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        deepMerge(window.RAJ_CREATION_CONFIG, window.RAJ_CREATION_CONFIG_LOCAL);
    }

})();

