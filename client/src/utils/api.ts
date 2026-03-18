/**
 * Base URL for all API requests.
 * - Dev: set VITE_API_URL=http://localhost:5000 in client/.env (or leave empty to use Vite proxy)
 * - Prod: set VITE_API_URL=https://your-api-domain.com in your deployment environment
 */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

export const ADMIN_TOKEN_KEY = 'admin_token';
export const LEGACY_TOKEN_KEY = 'token';

export function getAdminToken(): string | null {
	return localStorage.getItem(ADMIN_TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setAdminToken(token: string) {
	localStorage.setItem(ADMIN_TOKEN_KEY, token);
	localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function clearAdminToken() {
	localStorage.removeItem(ADMIN_TOKEN_KEY);
	localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function createAuthHeaders(headers?: HeadersInit): Headers {
	const nextHeaders = new Headers(headers);
	const token = getAdminToken();

	if (token) {
		nextHeaders.set('Authorization', `Bearer ${token}`);
	}

	return nextHeaders;
}

export function apiFetch(path: string, init?: RequestInit) {
	return fetch(`${API_BASE}${path}`, init);
}

function redirectToAdminLogin() {
	if (typeof window === 'undefined') {
		return;
	}

	if (window.location.pathname !== '/admin/login') {
		window.location.assign('/admin/login');
	}
}

export async function authFetch(path: string, init?: RequestInit) {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: createAuthHeaders(init?.headers),
	});

	if (response.status === 401) {
		clearAdminToken();
		redirectToAdminLogin();
	}

	return response;
}
