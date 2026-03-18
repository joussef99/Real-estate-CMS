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
```

### Generating JWT_SECRET

Run this command in Node.js to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Image Serving & BACKEND_URL

The server automatically serves uploaded images from the `/uploads` endpoint:

- Images are optimized to `.webp` format
- Paths: `/uploads/`, `/uploads/developers/`, `/uploads/destinations/`

**For production (frontend and backend on different domains):**

Set the `BACKEND_URL` environment variable to generate absolute image URLs:

```env
# Production (e.g., Railway deployment)
BACKEND_URL=https://your-backend.up.railway.app

# The API will return images as:
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

1. Set environment variables in production
2. Run `npm start`
3. Ensure the server is accessible from your frontend domain
4. Configure CORS appropriately for your domain

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
├── uploads/              # Uploaded files storage
└── package.json          # Dependencies
```
