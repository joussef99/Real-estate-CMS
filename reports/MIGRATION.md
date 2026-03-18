# Migration Guide: Monolithic to Split Architecture

This document outlines the architectural transformation from a monolithic application to an independent client/server structure.

## What Changed

### Before (Monolithic)

- Single `package.json` with all dependencies (React + Express)
- Single codebase with client and server code mixed
- Single build output
- Single deployment unit

### After (Split Monorepo)

- Root `package.json` with workspace configuration
- `client/package.json` with only React dependencies
- `server/package.json` with only Express dependencies
- Independent build outputs (`client/dist` and server)
- Independent deployments

### File Organization

```
BEFORE:
livin/
├── src/                    # React components + types
├── server/                 # Express API
├── package.json            # Mixed dependencies
└── vite.config.ts          # SPA-only

AFTER:
livin/
├── client/
│   ├── src/                # React components + types (moved from /src)
│   ├── public/             # Static assets
│   ├── package.json        # React-only dependencies
│   ├── vite.config.ts      # SPA config with API proxy
│   └── tsconfig.json       # Client TypeScript config
├── server/
│   ├── src/                # Express code (moved from /server)
│   ├── db/                 # Database
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, errors
│   ├── utils/              # Helpers
│   ├── uploads/            # User uploads
│   ├── package.json        # Express-only dependencies
│   ├── .env.example        # Server config template
│   └── realestate.db       # SQLite database
├── package.json            # Root workspace config
└── README.md               # This documentation
```

## Migration Completed

The following have been completed:

✅ **Created `/client` folder with:**

- React dependencies in `client/package.json`
- `client/vite.config.ts` with API proxy to backend
- `client/tsconfig.json` for TypeScript
- `client/.env.example` for frontend configuration
- `client/README.md` with frontend-specific instructions

✅ **Created `/server` folder with:**

- Express dependencies in `server/package.json`
- CORS middleware with environment-based origin
- API-only mode (removed Vite SPA serving)
- Port changed from 3000 → 5000
- `server/.env.example` with all required variables
- `server/README.md` with backend-specific instructions

✅ **Updated root:**

- `package.json` now uses npm workspaces
- Root `README.md` with instructions for both apps
- Monorepo management scripts

## Next Steps

### 1. Verify File Organization

Run this to confirm the structure:

```bash
# Check that key files exist
ls -la client/package.json
ls -la server/package.json
ls -la client/src/App.tsx
ls -la server/src/index.ts
```

### 2. Install Dependencies

From the root directory:

```bash
npm run install-all
```

Or manually:

```bash
# Install root workspace dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 3. Create Environment Files

**Create `client/.env`:**

```env
VITE_API_URL=http://localhost:5000
```

**Create `server/.env`:**

```env
PORT=5000
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ADMIN_INITIAL_PASSWORD=admin123
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 4. Test Both Apps

**Terminal 1 - Start Backend:**

```bash
cd server
npm run dev
```

Expected output:

```
Server running on http://localhost:5000
```

**Terminal 2 - Start Frontend:**

```bash
cd client
npm run dev
```

Expected output:

```
VITE v6.2.0 ready in XXX ms
➜ Local: http://localhost:5173/
```

### 5. Verify Communication

In the browser, go to `http://localhost:5173` and:

1. Check that the page loads (frontend working)
2. Try logging into the admin panel
3. Test newsletter signup (verify POST to `/api/newsletter` succeeds)
4. Check browser DevTools → Network → verify API calls go to `http://localhost:5000/api/*`

## Key Differences

### Frontend (Client)

| Feature          | Before           | After                              |
| ---------------- | ---------------- | ---------------------------------- |
| **Port**         | 5173             | 5173 (same)                        |
| **Dev Server**   | Served from Vite | Served from Vite                   |
| **API URL**      | Hardcoded `/api` | `VITE_API_URL` env var             |
| **Build**        | `npm run build`  | `npm run build --workspace=client` |
| **Dependencies** | Shared root      | Isolated `client/package.json`     |

### Backend (Server)

| Feature          | Before              | After                          |
| ---------------- | ------------------- | ------------------------------ |
| **Port**         | 3000                | 5000                           |
| **Vite SPA**     | ✅ Serving frontend | ❌ Removed (API-only)          |
| **CORS**         | ✅ Enabled          | ✅ Enabled (configurable)      |
| **Dev Server**   | `tsx`               | `tsx` (same)                   |
| **Build**        | N/A (no build)      | N/A (no build)                 |
| **Dependencies** | Shared root         | Isolated `server/package.json` |

## Deployment

### Frontend Deployment

Build and deploy the `client/dist/` folder to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

Set environment variable:

```env
VITE_API_URL=https://api.yourdomain.com
```

### Backend Deployment

Deploy the `server/` folder (including `node_modules`) to:

- Heroku
- Railway
- DigitalOcean App Platform
- AWS EC2 / Lambda
- Google Cloud Run

Set environment variables:

```env
JWT_SECRET=<secure 256-bit hex>
ADMIN_INITIAL_PASSWORD=<strong password>
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
PORT=5000
```

## Benefits of Split Architecture

| Benefit                    | Explanation                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **Independent Scaling**    | Scale backend separately from frontend                         |
| **Separate Deployment**    | Deploy frontend to CDN, backend to servers                     |
| **Clear Dependencies**     | Each app only imports what it needs                            |
| **Team Separation**        | Frontend team uses Vite stack, backend team uses Express stack |
| **Technology Flexibility** | Can swap frontend framework without touching backend           |
| **Smaller Bundles**        | No unused dependencies in either app                           |
| **Error Isolation**        | Backend crash doesn't affect frontend static files             |

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### API Calls Failing

**Verify:**

1. Server running on port 5000: `curl http://localhost:5000/api/projects`
2. Client env var set: Check `client/.env` has `VITE_API_URL=http://localhost:5000`
3. CORS enabled: Check `server/.env` has `CORS_ORIGIN=http://localhost:5173`
4. No console errors: Open browser DevTools and check Network tab

### Dependencies Not Installing

```bash
# Remove node_modules and lock files
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json

# Reinstall everything
npm run install-all
```

## Rollback

If you need to revert to monolithic structure:

1. Move files:

   ```bash
   # Merge client/src into root src
   cp -r client/src/* src/

   # Merge server files back
   cp -r server/src/* server/
   ```

2. Restore old root `package.json` (has all dependencies)
3. Restore old `vite.config.ts` (with Vite middleware)
4. Delete `client/` and `server/` folders

## Questions?

See:

- [Root README.md](./README.md)
- [Client README.md](./client/README.md)
- [Server README.md](./server/README.md)
