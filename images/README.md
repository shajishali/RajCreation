# Images Folder

This folder stores all actual image files (thumbnails and photos) for your RajCreation Live website.

## How It Works (Auto-Export Enabled)

1. **Upload thumbnail** through the admin panel
2. **Click "Save Thumbnail"** - Image file and manifest will automatically download!
3. **Place downloaded files** in this `images` folder:
   - Copy the image file (e.g., `thumbnail_live_1234567890.jpg`) to `images/`
   - Replace `images/images-manifest.json` with the downloaded one
4. **Commit to Git** and push to GitHub
5. **Deploy** (if using GitHub Pages, it deploys automatically)
6. ✅ **Now your thumbnail is visible on ALL devices!**

## File Structure

- `images-manifest.json` - References image files (contains file paths, NOT image data)
- Actual image files (e.g., `thumbnail_live_1234567890.jpg`, `photo_1234567890.png`)

## Example Manifest Structure

```json
{
  "thumbnails": {
    "live": {
      "fileName": "thumbnail_live_1234567890.jpg",
      "savedAt": "2026-01-02T03:42:25.000Z"
    }
  },
  "photos": [],
  "lastUpdated": "2026-01-02T03:42:25.000Z"
}
```

## Important Notes

- **Images are stored as actual files** (not embedded in code/JSON)
- **Manifest only references file paths** (not base64 data)
- **Current Device**: Thumbnail works immediately on your laptop (stored in browser localStorage as base64)
- **Other Devices**: After placing files in this folder and committing to Git, thumbnail loads from actual image file
- **Auto-Export**: Files download automatically when you save a thumbnail
- Always commit the entire `images` folder (both image files and manifest) to your repository for cross-device access

