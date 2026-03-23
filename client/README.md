# Livin Client - React Frontend

A modern React application for the Livin Real Estate Investment Platform.

## Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

For production on Hostinger, set `VITE_API_URL` to your Railway backend URL before building, for example:

```env
VITE_API_URL=https://your-backend.up.railway.app
```

## Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Serve the `dist` folder using any static file server:
   ```bash
   npx serve dist
   ```

For Hostinger static hosting, upload the contents of `dist` after building with the production `VITE_API_URL`.

## API Integration

All API calls use the `VITE_API_URL` environment variable. Update this in your `.env` file to point to your API server.

## Project Structure

```
src/
├── pages/           # Page components
├── components/      # Reusable components
├── App.tsx          # Main app component
├── types.ts         # TypeScript type definitions
└── utils/           # Utility functions
```
