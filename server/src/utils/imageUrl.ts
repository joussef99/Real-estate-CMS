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
 * Convert a relative image path to a full URL
 * Example: "/uploads/developers/image-123.webp" -> "https://api.railway.app/uploads/developers/image-123.webp"
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
  const baseUrl = getBackendBaseUrl(req);

  imageFields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      const imagePath = result[field] as string;
      // Only transform if it's a relative path starting with /uploads
      if (imagePath.startsWith('/uploads')) {
        result[field] = `${baseUrl}${imagePath}` as any;
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

  const baseUrl = getBackendBaseUrl(req);
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

  return galleryArray.map(item => {
    if (typeof item === 'string' && item.startsWith('/uploads')) {
      return `${baseUrl}${item}`;
    }
    return item;
  });
}
