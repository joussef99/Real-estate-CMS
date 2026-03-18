# Project Cleanup & Deployment Guide

## Overview

This guide explains how to safely clean your full-stack project before deployment and what files are safe to delete.

---

## 📁 Project Structure & What to Clean

### Files to Delete (Safe to Remove)

| Path                   | Why Delete                              | Size Impact |
| ---------------------- | --------------------------------------- | ----------- |
| `dist/`                | Root build output (if any)              | ~10-50 MB   |
| `node_modules/`        | Dependencies (root level)               | ~500 MB     |
| `client/dist/`         | Vite build output (old builds)          | ~5-20 MB    |
| `client/node_modules/` | Client dependencies                     | ~800 MB     |
| `server/node_modules/` | Server dependencies                     | ~200 MB     |
| `temp_blogs.json`      | Temporary data file                     | ~5 KB       |
| `temp_projects.json`   | Temporary data file                     | ~150 KB     |
| `*.log`                | Log files                               | ~1-100 MB   |
| `package-lock.json`    | (optional) Regenerated on `npm install` | ~500 KB     |

### Files to Keep (Critical Data)

| Path              | Why Keep             | Action                          |
| ----------------- | -------------------- | ------------------------------- |
| `server/uploads/` | User uploaded images | ✅ Git ignore (in .gitignore)   |
| `realestate.db`   | SQLite database      | ✅ Git ignore (in .gitignore)   |
| `.env.example`    | Environment template | ✅ Commit to git                |
| `server/.env`     | Production secrets   | ✅ Never commit (in .gitignore) |
| `reports/`        | Documentation        | ✅ Commit to git                |

---

## 🧹 Cleanup Scripts

### Root Level Package.json

Added cleanup commands to `package.json`:

```bash
# Clean build outputs and temp files (all three packages)
npm run clean

# Clean everything except node_modules
npm run clean:root

# Clean client build and dependencies
npm run clean:client

# Clean server dependencies
npm run clean:server

# Clean everything including node_modules (heavy cleanup)
npm run clean:all

# Deep clean (also removes lock files)
npm run clean:deep
```

### What Each Script Does

#### `npm run clean` ⭐ **Recommended before deployment**

- Deletes `dist/` directories
- Deletes `temp_*.json` files
- Deletes `node_modules/` in client and server
- Keeps database and uploads safe

#### `npm run clean:root`

- Deletes root `dist/` folder
- Deletes `temp_*.json` files

#### `npm run clean:client`

- Deletes `client/dist/` folder
- Deletes `client/node_modules/`

#### `npm run clean:server`

- Deletes `server/node_modules/`

#### `npm run clean:all` ⚠️ **Heavy cleanup**

- Runs all of the above
- Also deletes root `node_modules/`

#### `npm run clean:deep` ⚠️ **Total reset**

- Runs `npm run clean:all`
- Deletes all log files
- Deletes `package-lock.json`

---

## 🚀 Pre-Deployment Checklist

### Step 1: Clean the Project

```bash
cd c:\Users\The Professionals\Downloads\livin

# Clean Build & Temp Files (Safe)
npm run clean

# Verify cleanup
dir  # Should not see temp_*.json, dist, or client/node_modules
```

### Step 2: Reinstall Dependencies

```bash
# Install all dependencies fresh
npm install:all

# This reinstalls:
# - Root dependencies
# - Client dependencies
# - Server dependencies
```

### Step 3: Build for Production

```bash
# Build client for Hostinger
npm run build

# Output will be in: client/dist/
```

### Step 4: Verify Builds

```bash
# Check client build exists
dir client\dist\  # Should have index.html, assets/, etc.

# Verify server can start
npm run dev:server  # Should log "Server running on port 5000"
```

### Step 5: Final Check Before Deployment

```bash
# Ensure .env files are set correctly
type server\.env  # Check BACKEND_URL is set for production

# Verify database exists
dir server\realestate.db  # Must exist

# Verify uploads directory exists
dir server\uploads\  # Should exist (even if empty)
```

---

## 📝 Updated .gitignore

The `.gitignore` file has been updated to include:

```gitignore
# Never commit
node_modules/
dist/
build/
.env
.env.local
uploads/
realestate.db
*.db
temp_*.json
*.log

# IDE files
.vscode/
.idea/
*.swp

# Keep in git
!.env.example
```

### Key Points

- ✅ `.env.example` is committed (template for others)
- ✅ `.env` is ignored (secrets not committed)
- ✅ `node_modules/` is ignored (too large)
- ✅ `dist/` is ignored (rebuilt on deployment)
- ✅ `uploads/` is ignored (user files, not code)
- ✅ `realestate.db` is ignored (data, not code)

---

## 🌐 Deployment Paths

### Client → Hostinger

```
Deploy: client/dist/*
To: /home/your-domain/public_html/
Commands:
- npm run build
- Upload dist/ contents to Hostinger FTP
- Set VITE_API_URL=https://your-backend.up.railway.app in Hostinger settings
```

### Server → Railway

```
Deploy: server/*
To: Railway app
Commands:
- Set environment variables (PORT, JWT_SECRET, BACKEND_URL, etc.)
- Railway auto-deploys from git
- Uses: npm start (from server/package.json)
- Serves: /uploads/ folder automatically
```

---

## ✅ Final Production Setup

### Environment Variables (Railway)

```bash
PORT=5000
JWT_SECRET=<generated-secret>
ADMIN_INITIAL_PASSWORD=<strong-password>
NODE_ENV=production
CORS_ORIGIN=https://your-hostinger-domain.com
BACKEND_URL=https://your-railway-backend.up.railway.app
```

### Environment Variables (Hostinger - if needed)

```
VITE_API_URL=https://your-railway-backend.up.railway.app
```

### Database & Uploads

- ✅ `realestate.db` initialized on first run
- ✅ `server/uploads/` directory auto-created
- ✅ Images saved to `server/uploads/` + served at `/uploads/`

---

## 🔍 Cleanup Space Savings

| Cleanup Level         | Space Freed | Time to Clean |
| --------------------- | ----------- | ------------- |
| Just temp files       | ~150 KB     | <1 sec        |
| + dist folders        | ~20 MB      | <1 sec        |
| + client node_modules | ~800 MB     | 5-10 sec      |
| + server node_modules | ~200 MB     | 5-10 sec      |
| + root node_modules   | ~500 MB     | 5-10 sec      |
| Total (clean:all)     | ~1.5 GB     | 30-60 sec     |

---

## 📋 Troubleshooting

### "npm run clean" fails on Windows

If cleanup scripts fail, manually delete:

```powershell
# PowerShell commands
Remove-Item -Path "dist" -Recurse -Force
Remove-Item -Path "temp_*.json"
Remove-Item -Path "client\dist" -Recurse -Force
Remove-Item -Path "client\node_modules" -Recurse -Force
Remove-Item -Path "server\node_modules" -Recurse -Force
```

### "npm install:all" after clean

After cleaning, reinstall with:

```bash
npm install:all
```

This will reinstall all dependencies in all packages.

### Lost the database?

The database only exists in production. For development:

```bash
# Server auto-creates realestate.db on first run
npm run dev:server  # Creates DB if missing
```

---

## 🎯 Recommended Pre-Deployment Workflow

```bash
# 1. Clean the project
npm run clean

# 2. Reinstall fresh dependencies
npm install:all

# 3. Build client for production
npm run build

# 4. Test server locally
npm run dev:server

# 5. Verify everything
# - Check client/dist/ exists
# - Check server starts without errors
# - Check images can be uploaded/served

# 6. Deploy!
# - Push to git
# - Railway auto-deploys server
# - Upload client/dist/* to Hostinger
```

---

## 📚 Related Documentation

- See `IMAGE_UPLOAD_FIX.md` for image serving setup
- See `server/README.md` for API documentation
- See `.env.example` for all environment variables
