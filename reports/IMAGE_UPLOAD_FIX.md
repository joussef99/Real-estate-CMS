# Image Upload & Serving Fix - Implementation Summary

## Problem

Images stored in the backend upload folder were not displaying in the frontend because:

1. Frontend (Hostinger) and Backend (Railway) are on different domains
2. Backend was returning relative paths like `/uploads/dev/image.webp`
3. Relative paths don't work across different domains

## Solution

Implemented absolute URL generation for all image responses from the backend API.

---

## Changes Made

### 1. Backend - New Utility: `server/src/utils/imageUrl.ts`

**Purpose:** Generate absolute image URLs based on request context

**Key Functions:**

- `getBackendBaseUrl(req)` - Gets backend URL from environment or request headers
- `getFullImageUrl(req, path)` - Converts relative path to absolute URL
- `transformImagesToFullUrls(req, obj, fields)` - Transforms object image fields to full URLs
- `transformGalleryToFullUrls(req, gallery)` - Transforms image arrays to full URLs

**Features:**

- Respects `BACKEND_URL` environment variable (for production)
- Falls back to request headers with proper protocol handling
- Works with Railway's trust proxy setup

### 2. Backend - Updated Routes

#### `/server/src/routes/uploads.ts`

- Import imageUrl utilities
- All upload endpoints now return full URLs:
  - `POST /api/upload` → returns absolute image URLs
  - `POST /api/upload/developer-logo` → returns absolute logo URL
  - `POST /api/upload/destination-image` → returns absolute image URL

#### `/server/src/routes/projects.ts`

- Transform project listings to include full image URLs
- Updated endpoints:
  - `GET /api/projects` - List with pagination
  - `GET /api/projects/search` - Search results
  - `GET /api/projects/featured` - Featured projects
  - `GET /api/projects/:identifier` - Project details
- Transforms `main_image` field and `gallery` arrays

#### `/server/src/routes/developers.ts`

- Transform developer listings to include full image URLs
- Updated endpoints:
  - `GET /api/developers` - List developers
  - `GET /api/developers/:slug/projects` - Developer's projects
- Transforms `logo` field and nested project images

#### `/server/src/routes/destinations.ts`

- Transform destination listings to include full image URLs
- Updated endpoints:
  - `GET /api/destinations` - List destinations
  - `GET /api/destinations/:slug/projects` - Destination's projects
- Transforms `image` field and nested project images

#### `/server/src/routes/blogs.ts`

- Transform blog listings to include full image URLs
- Updated endpoints:
  - `GET /api/blogs` - List blogs
  - `GET /api/blogs/:identifier` - Blog details
- Transforms `image` field

### 3. Configuration Files

#### `.env.example` (server)

- Added `BACKEND_URL` documentation:
  ```env
  # Optional: Full backend URL for generating absolute image URLs
  # BACKEND_URL=https://your-backend.up.railway.app
  ```

#### `README.md` (server)

- Added "Image Serving & BACKEND_URL" section
- Documents how to configure image URL generation for production vs development

---

## Deployment Instructions

### Local Development

```bash
# No special configuration needed
# Images available at: http://localhost:5000/uploads/...
npm run dev
```

### Production (Railway/Hostinger)

```bash
# Set environment variable on Railway:
BACKEND_URL=https://your-backend.up.railway.app

# Frontend remains unchanged - uses full URLs from API
# Image responses: {"image": "https://your-backend.up.railway.app/uploads/..."}
```

---

## API Response Examples

### Before (Relative URLs)

```json
{
  "id": 1,
  "name": "Luxury Apartment",
  "main_image": "/uploads/projects/apartment-123.webp",
  "gallery": ["/uploads/projects/apt-1.webp", "/uploads/projects/apt-2.webp"]
}
```

### After (Absolute URLs)

```json
{
  "id": 1,
  "name": "Luxury Apartment",
  "main_image": "https://api.railway.app/uploads/projects/apartment-123.webp",
  "gallery": [
    "https://api.railway.app/uploads/projects/apt-1.webp",
    "https://api.railway.app/uploads/projects/apt-2.webp"
  ]
}
```

---

## Frontend Changes Required

**None!** The frontend components already use the image data from API responses. They will automatically work with the new absolute URLs.

### How It Works

1. Frontend makes API call: `GET /api/projects`
2. Backend returns: `{"main_image": "https://api.railway.app/uploads/projects/..."}`
3. Frontend renders: `<img src="https://api.railway.app/uploads/..." />`
4. Image loads successfully from Railway server

---

## Files Modified

**Backend:**

- ✅ `server/src/utils/imageUrl.ts` (NEW)
- ✅ `server/src/routes/uploads.ts`
- ✅ `server/src/routes/projects.ts`
- ✅ `server/src/routes/developers.ts`
- ✅ `server/src/routes/destinations.ts`
- ✅ `server/src/routes/blogs.ts`
- ✅ `server/.env.example`
- ✅ `server/README.md`

**Frontend:**

- No changes required (already compatible)

---

## Testing Checklist

1. ✅ Upload an image via admin panel
2. ✅ Verify API returns full URL (e.g., `https://your-api.up.railway.app/uploads/...`)
3. ✅ Access image directly in browser: `https://your-api.up.railway.app/uploads/filename.webp`
4. ✅ Verify image displays in frontend (different domain)
5. ✅ Check project listings show images correctly
6. ✅ Check developer/destination preview images work
7. ✅ Verify gallery images display in detail pages

---

## Troubleshooting

### Images Still Not Showing?

1. **Check BACKEND_URL is set:**
   - Railway: Add to environment variables
   - Local: Leave unset (auto-detects)

2. **Verify uploads directory exists:**

   ```bash
   ls -la server/uploads/
   ```

3. **Check Express static middleware:**
   - `server/src/index.ts` should have:

   ```typescript
   app.use("/uploads", express.static(uploadsDir));
   ```

4. **Verify API response format:**
   ```bash
   curl https://your-api.up.railway.app/api/projects
   ```
   Should show `"main_image": "https://..."`

### Wrong Protocol (http vs https)?

- Set `BACKEND_URL` explicitly in `.env` for production
- Development auto-detects from request headers

---

## Security Notes

- ✅ Images served statically (no security risk)
- ✅ Only image paths can be accessed (`/uploads/...`)
- ✅ No sensitive data in image URLs
- ✅ Configure CORS if frontend is on different domain (already done)
