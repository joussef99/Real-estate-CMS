import { Request } from 'express';

/**
 * Get the backend base URL from the request object
 * Respects trust proxy setup for production (Railway)
 */
export function getBackendBaseUrl(req: Request): string {
  // Environment variable takes priority
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  // Construct from request
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

/**
 * Convert a relative path to an absolute backend URL.
 */
export function getFullImageUrl(req: Request, relativePath: string): string {
  const baseUrl = getBackendBaseUrl(req);
  // Remove leading slash if present
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${baseUrl}${path}`;
}

/**
 * Transform an object's image properties to full URLs
 */
export function transformImagesToFullUrls<T extends Record<string, any>>(
  req: Request,
  obj: T,
  imageFields: (keyof T)[] = ['main_image']
): T {
  const result = { ...obj };

  imageFields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      const imagePath = result[field] as string;
      if (!/^https?:\/\//i.test(imagePath)) {
        // Legacy relative paths are no longer served; force frontend fallback behavior.
        result[field] = null as any;
      }
    }
  });

  return result;
}

/**
 * Transform gallery arrays to full URLs
 */
export function transformGalleryToFullUrls(req: Request, gallery: string | any[] | null | undefined): any[] {
  if (!gallery) return [];
  let galleryArray: any[] = [];

  if (typeof gallery === 'string') {
    try {
      galleryArray = JSON.parse(gallery);
    } catch {
      return [];
    }
  } else if (Array.isArray(gallery)) {
    galleryArray = gallery;
  }

  return galleryArray.filter((item) => typeof item === 'string' && /^https?:\/\//i.test(item));
}
