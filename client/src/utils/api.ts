/**
 * Base URL for all API requests.
 * - Dev: set VITE_API_URL=http://localhost:5000 in client/.env (or leave empty to use Vite proxy)
 * - Prod: set VITE_API_URL=https://your-api-domain.com in your deployment environment
 */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';
