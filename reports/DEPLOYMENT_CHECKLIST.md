# Deployment Checklist

## Environment Configuration

Before deploying, **read [ENV_VALIDATION_GUIDE.md](ENV_VALIDATION_GUIDE.md)** for detailed information about the validation system.

The backend validates all required environment variables at startup and exits with clear instructions if anything is missing.

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 256-bit hex string (minimum 32 characters)

### Optional Variables
- `PORT` - RAM port (Railway sets this automatically)
- `NODE_ENV` - Set to `production`
- `ADMIN_INITIAL_PASSWORD` - Initial admin user password
- `CORS_ORIGIN` - Frontend origin(s) allowed to call the API
- `BACKEND_URL` - Backend URL for image generation (if frontend and backend are on different domains)

## Backend (Railway)

1. Set the Railway service root to `server/`.

2. **Add required variables in Railway Dashboard → Variables:**
   - `DATABASE_URL` - Get from PostgreSQL plugin in Railway
   - `JWT_SECRET` - Generate new with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **Add production configuration variables:**
   - `NODE_ENV=production`
   - `ADMIN_INITIAL_PASSWORD=your-strong-password` (change after first login)
   - `CORS_ORIGIN=https://your-hostinger-domain.com,https://www.your-hostinger-domain.com`
   - `BACKEND_URL=https://your-backend.up.railway.app`

4. Configure build/start commands:
   - Build command: `npm run build`
   - Start command: `npm start`

5. Deploy and monitor logs:
   - You should see: `[STARTUP] Environment configuration validated:`
   - Verify all values are correct (secrets are masked)
   - Verify: `[OK] Server running on port`

6. Run migrations after deploy:
   - For new deployments or schema changes: `npm run prisma:migrate`

7. Verify API health:
   - Visit `https://your-backend.up.railway.app/health` (should return 200 OK)
   - Visit `https://your-backend.up.railway.app/api/projects` (should return data)
   - Visit `https://your-backend.up.railway.app/sitemap.xml` (should return XML)

## Frontend (Hostinger)

1. Build client with production API URL:
   ```bash
   cd client
   VITE_API_URL=https://your-backend.up.railway.app npm run build
   ```

2. Upload the `client/dist/` contents to Hostinger static hosting.

3. **Configure SPA fallback:**
   - Set the SPA fallback to serve `index.html` for routes that don't match static files
   - This enables client-side routing to work properly

4. Verify:
   - Public pages load without errors
   - Admin login calls the Railway API
   - API responses show full absolute image URLs (with `BACKEND_URL` prefix)

## Final Verification

After deployment, verify everything works:

1. **Backend connectivity:**
   - Browser network shows requests to Railway domain, never `localhost`
   - No mixed content warnings (all HTTPS)

2. **CORS validation:**
   - Requests from your Hostinger domain succeed
   - Requests from `localhost` are rejected (in production)

3. **Database connectivity:**
   - Check Railway logs for: `[DB] [server-startup] host=... port=... db=...`

4. **Image serving:**
   - Images in API responses include full `BACKEND_URL` prefix
   - Example: `https://your-backend.up.railway.app/uploads/developers/logo-abc.webp`

5. **Health checks:**
   - `curl https://your-backend.up.railway.app/health` returns OK
   - `/api/projects`, `/api/blogs`, etc. return data

## Rollback

If deployment fails:

1. **Check Railway logs** for validation errors
2. **Missing `DATABASE_URL`?** - Add the PostgreSQL connection string
3. **Missing `JWT_SECRET`?** - Generate and add a new secret
4. **CORS errors?** - Verify `CORS_ORIGIN` includes your frontend domain
5. **Revert changes** and fix env variables, then redeploy

See [ENV_VALIDATION_GUIDE.md](ENV_VALIDATION_GUIDE.md) for troubleshooting steps.
