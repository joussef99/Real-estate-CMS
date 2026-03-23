# Deployment Checklist

## Backend (Railway)

1. Set the Railway service root to `server/`.
2. Configure these environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_INITIAL_PASSWORD`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-hostinger-domain.com,https://www.your-hostinger-domain.com`
   - `BACKEND_URL=https://your-backend.up.railway.app`
3. Use `npm run build` as the build command.
4. Use `npm start` as the start command.
5. Run `npm run prisma:migrate` after deploy when schema changes exist.
6. Verify the API responds on `/api/projects` and `/sitemap.xml`.

## Frontend (Hostinger)

1. In `client/`, set `VITE_API_URL=https://your-backend.up.railway.app` for the production build.
2. Run `npm run build` in `client/`.
3. Upload the contents of `client/dist/` to Hostinger.
4. Configure SPA fallback to serve `index.html` for app routes.
5. Verify public pages and admin login load data from the Railway API.

## Final Verification

1. Confirm the browser only calls the Railway backend, never `localhost`.
2. Confirm uploads resolve with absolute `BACKEND_URL` paths.
3. Confirm CORS allows Hostinger domains and rejects unknown origins.
4. Confirm Prisma connects with the production `DATABASE_URL` and returns expected records.
