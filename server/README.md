# Livin Server - Node.js + Express API

Backend API server for the Livin Real Estate Investment Platform.

## Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server (runs on http://localhost:5000)
npm run dev

# Build production server
npm run build

# Start production server
npm start

# Type check
npm run lint
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@host:5432/railway
JWT_SECRET=your_random_hex_string_here
ADMIN_INITIAL_PASSWORD=strong_password
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
BACKEND_URL=
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Generating JWT_SECRET

Run this command in Node.js to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Image Uploads (Cloudinary)

The server uploads images directly to Cloudinary and stores only full CDN URLs in PostgreSQL:

- Images are optimized to `.webp` format before upload
- Uploaded folders: `livin/projects`, `livin/developers`, `livin/destinations`
- Upload endpoints keep the same API response shape (`images`, `logo`, `image`)

The frontend should use returned URLs directly:

```tsx
<img src={project.main_image} alt={project.name} />
```

Legacy local `/uploads/...` paths are still supported for older records via URL transformation.

**For production (frontend and backend on different domains):**

Set the `BACKEND_URL` environment variable to generate absolute image URLs:

```env
# Production (e.g., Railway deployment)
BACKEND_URL=https://your-backend.up.railway.app

# The API can still return older local records as:
# {
#   "image": "https://your-backend.up.railway.app/uploads/developers/logo-12345.webp"
# }
```

**For development:** Leave `BACKEND_URL` unset. The server will infer the URL from request headers (`http://localhost:5000`).

## API Endpoints

- Base URL: `http://localhost:5000/api`
- Authentication: Bearer token in `Authorization` header

### Public Routes

- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `GET /api/developers` - List developers
- `GET /api/destinations` - List destinations
- `GET /api/blogs` - List blogs
- `GET /api/careers` - List careers
- `GET /api/property-types` - List property types
- `GET /api/amenities` - List amenities
- `POST /api/leads` - Create a lead
- `POST /api/newsletter` - Subscribe to newsletter

### Admin Routes (Protected)

- All CRUD operations for projects, developers, destinations, blogs, careers
- Admin stats dashboard
- File uploads
- Newsletter subscriber management
- Change password

## Deployment

1. Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `NODE_ENV=production`, `CORS_ORIGIN`, `BACKEND_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Railway.
2. Run `npm run build` during the Railway build step.
3. Run `npm start` as the Railway start command.
4. Run `npm run prisma:migrate` after deploy to apply schema changes.
5. Ensure `CORS_ORIGIN` contains every Hostinger frontend origin that should access the API.

## Project Structure

```
server/
├── src/
│   ├── index.ts          # Main server file
│   ├── lib/prisma.ts     # Prisma client configuration
│   ├── services/         # Service layer (business/data logic)
│   ├── routes/           # API route handlers
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
├── prisma/               # Prisma schema and migrations
├── src/config/cloudinary.ts # Cloudinary SDK configuration
└── package.json          # Dependencies
```
