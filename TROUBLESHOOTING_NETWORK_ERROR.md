# Troubleshooting NetworkError in Supabase Storage Upload

## Error: "NetworkError when attempting to fetch resource"

This error occurs when the browser cannot connect to Supabase Storage. Here's how to fix it:

## Quick Fixes

### 1. Check Supabase CORS Settings

The most common cause is missing CORS configuration in Supabase.

**Steps:**
1. Go to Supabase Dashboard → Settings → API
2. Scroll down to "CORS Configuration"
3. Add your domain to allowed origins:
   - `https://raj-creations.vercel.app`
   - `https://*.vercel.app` (for all Vercel deployments)
   - `http://localhost:3000` (for local development)
4. Click "Save"

### 2. Verify Storage Bucket Configuration

1. Go to Supabase Dashboard → Storage
2. Click on `images` bucket
3. Check:
   - ✅ Bucket is **PUBLIC** (toggle should be ON)
   - ✅ Storage policies are set up (run `supabase-complete-setup.sql`)

### 3. Check Supabase URL and Keys

Verify your configuration in `js/config.js`:

```javascript
supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',  // Must match your project
    anonKey: 'YOUR_ANON_KEY'  // Get from Settings → API
}
```

**Important:** Make sure:
- URL matches your Supabase project URL exactly
- Anon key is from the same project
- No extra spaces or characters

### 4. Test Connection

Use the diagnostic tool:
1. Open `test-storage.html` in your browser
2. Click "Test Connection"
3. Click "Check 'images' Bucket"
4. Try uploading a test image

### 5. Check Browser Console

Open Developer Tools (F12) → Console tab and look for:
- CORS errors
- Network errors
- Authentication errors
- Detailed error messages

### 6. Verify Network Connectivity

- Check your internet connection
- Try accessing Supabase Dashboard directly
- Check if other Supabase operations work (like reading videos)

## Common Issues and Solutions

### Issue: CORS Error
**Solution:** Add your domain to Supabase CORS settings (see #1 above)

### Issue: Bucket Not Found
**Solution:** 
1. Create `images` bucket in Storage
2. Make it PUBLIC
3. Run `supabase-complete-setup.sql`

### Issue: Permission Denied
**Solution:**
1. Run `supabase-complete-setup.sql` in SQL Editor
2. This sets up storage policies for public access

### Issue: Wrong Supabase URL/Key
**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the correct URL and anon key
3. Update `js/config.js`

### Issue: File Too Large
**Solution:**
- Compress the image before uploading
- Maximum file size: 50MB (check bucket settings)

## Testing After Fix

1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh the page
3. Try uploading a video with thumbnail again
4. Check browser console for any remaining errors

## Still Not Working?

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Browser Console:** Look for detailed error messages
3. **Try Different Browser:** Rule out browser-specific issues
4. **Check Network Tab:** In DevTools → Network, see the actual request/response

## Need More Help?

Check the browser console for the exact error message and share it. The improved error handling will now show more detailed information about what's failing.


