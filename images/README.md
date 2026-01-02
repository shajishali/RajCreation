# Images Folder

This folder stores all images (thumbnails and photos) for your RajCreation Live website.

## How It Works (Auto-Export Enabled)

1. **Upload thumbnail** through the admin panel
2. **Click "Save Thumbnail"** - Files will automatically download!
3. **Place downloaded files** in this `images` folder:
   - Copy the image file (e.g., `thumbnail_live_1234567890.jpg`) to `images/`
   - Replace `images/images-manifest.json` with the downloaded one
4. **Commit to Git** and push to GitHub
5. **Deploy** (if using GitHub Pages, it deploys automatically)
6. ✅ **Now your thumbnail is visible on ALL devices!**

## Files

- `images-manifest.json` - Contains metadata about all images
- Individual image files (thumbnails, photos)

## Important Notes

- **Current Device**: Thumbnail works immediately on your laptop (stored in browser localStorage)
- **Other Devices**: After placing files in this folder and committing to Git, thumbnail works everywhere
- **Auto-Export**: Files download automatically when you save a thumbnail
- Always commit the entire `images` folder to your repository for cross-device access

