/**
 * Base URL for all API requests.
 * - Dev: set VITE_API_URL=http://localhost:5000 in client/.env (or leave empty to use Vite proxy)
 * - Prod: set VITE_API_URL=https://your-api-domain.com in your deployment environment
 */
export const API_BASE: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

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

export async function parseJsonResponse<T>(response: Response): Promise<T> {
	const contentType = response.headers.get('content-type') || '';

	if (!contentType.includes('application/json')) {
		const preview = (await response.text()).slice(0, 140);
		throw new Error(`Expected JSON response but received: ${preview || '[empty response]'}`);
	}

	const data = await response.json();

	if (!response.ok) {
		const errorMessage = typeof data?.error === 'string'
			? data.error
			: `Request failed with status ${response.status}`;
		throw new Error(errorMessage);
	}

	return data as T;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await apiFetch(path, init);
	return parseJsonResponse<T>(response);
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

export async function authJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await authFetch(path, init);
	return parseJsonResponse<T>(response);
}

export function authUploadJson<T>(path: string, body: FormData, onProgress?: (percent: number) => void): Promise<T> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `${API_BASE}${path}`);

		const headers = createAuthHeaders();
		headers.forEach((value, key) => {
			xhr.setRequestHeader(key, value);
		});

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable && onProgress) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};

		xhr.onerror = () => {
			reject(new Error('Upload failed. Please try again.'));
		};

		xhr.onload = () => {
			const contentType = xhr.getResponseHeader('content-type') || '';
			const rawResponse = xhr.responseText || '';

			if (xhr.status === 401) {
				clearAdminToken();
				redirectToAdminLogin();
			}

			if (!contentType.includes('application/json')) {
				const preview = rawResponse.slice(0, 140);
				reject(new Error(`Expected JSON response but received: ${preview || '[empty response]'}`));
				return;
			}

			try {
				const data = JSON.parse(rawResponse);
				if (xhr.status < 200 || xhr.status >= 300) {
					const errorMessage = typeof data?.error === 'string'
						? data.error
						: `Request failed with status ${xhr.status}`;
					reject(new Error(errorMessage));
					return;
				}

				onProgress?.(100);
				resolve(data as T);
			} catch {
				reject(new Error('Failed to parse upload response.'));
			}
		};

		xhr.send(body);
	});
}
